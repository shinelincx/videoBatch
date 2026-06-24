"""任务处理器 — 在后台线程执行视频剪辑管线。

TaskProcessorWorker 通过 QObject.moveToThread 在子线程运行，
通过信号将状态变更和结果通知 GUI 主线程。
"""

import shutil
import sys
import traceback
from pathlib import Path

import requests
from PySide6.QtCore import QObject, Signal

from video_batch.config_manager import ConfigManager
from video_batch.config_sync import UserConfig
from video_batch.duplicate_detection import (
    DuplicateDetectionConfig,
    DuplicateDetector,
    VideoHashStore,
)
from video_batch.local_config import LocalConfig
from video_batch.logger import Logger
from video_batch.generate_media import (
    GenerateApiConfig,
    GenerateMediaClient,
    build_generate_duration,
)
from video_batch.material_scanner import MaterialScanner
from video_batch.pipeline import EditDirs, PipelineContext, VideoEditingPipeline
from video_batch.task_queue import Task
from video_batch.task_status import TaskStatus, TaskStatusManager


class TaskProcessorWorker(QObject):
    """后台任务处理器，在子线程中执行完整的视频剪辑流水线。

    信号:
        task_progress(task_id, step): 处理步骤更新
        task_finished(task_id, success, message): 处理完成
        task_status_update(task_id, new_status): 状态变更
        task_duplicate_result(task_id, hamming_distance, is_duplicate): 重复检测结果
    """

    task_progress = Signal(str, str)
    task_finished = Signal(str, bool, str)
    task_status_update = Signal(str, str)
    task_duplicate_result = Signal(str, int, bool)

    def __init__(self, parent: QObject | None = None) -> None:
        super().__init__(parent)
        self._logger: Logger | None = None
        self._config_manager: ConfigManager | None = None
        self._status_manager: TaskStatusManager | None = None
        self._material_dir: Path = Path(".")
        self._access_token: str = ""
        self._scratch_dir: Path = Path(".")
        self._user_id: str = ""
        self._detector: DuplicateDetector | None = None

    def configure(
        self,
        logger: Logger,
        config_manager: ConfigManager,
        material_dir: str,
        access_token: str,
        scratch_dir: Path,
        user_id: str = "",
        hash_store_db_path: str = "",
        status_manager: TaskStatusManager | None = None,
    ) -> None:
        self._logger = logger
        self._config_manager = config_manager
        self._status_manager = status_manager
        self._material_dir = Path(material_dir)
        self._access_token = access_token
        self._scratch_dir = Path(scratch_dir)
        self._user_id = user_id

        if hash_store_db_path:
            db_path = Path(hash_store_db_path)
            db_path.parent.mkdir(parents=True, exist_ok=True)
            hash_store = VideoHashStore(db_path, logger=logger)
            config = DuplicateDetectionConfig()
            self._detector = DuplicateDetector(
                hash_store=hash_store,
                config=config,
                logger=logger,
            )

    def process(
        self,
        task_id: str,
        productId: str,
        config_id: str = "",
        product_category_name: str = "",
        product_title: str = "",
        mode: str = "",
    ) -> None:
        """执行指定任务的完整剪辑流水线。"""
        print("[TaskProcessor] 开始处理: task_id=%s productId=%s config_id=%s mode=%s" % (
            task_id[:16], productId[:16], config_id, mode,
        ), flush=True)
        task = Task(
            id=task_id,
            productId=productId,
            status="待剪辑",
            config_id=config_id,
            mode=mode,
            productCategoryName=product_category_name,
            productTitle=product_title,
        )
        try:
            self._run_pipeline(task)
        except Exception as e:
            traceback.print_exc()
            self._log("ERROR", task_id, "处理失败: %s" % e)
            if self._status_manager is not None:
                try:
                    self._status_manager.transition(
                        task,
                        TaskStatus.FAILED,
                        self._access_token,
                        failure_reason=str(e),
                    )
                except Exception:
                    task.status = TaskStatus.FAILED
            else:
                task.status = TaskStatus.FAILED
            self.task_status_update.emit(task_id, task.status)
            self.task_finished.emit(task_id, False, str(e))

    # ── 主流程 ──

    def _run_pipeline(self, task: Task) -> None:
        task_id = task.id
        productId = task.productId
        config_id = task.config_id or ""
        mode = task.mode or ""

        self.task_progress.emit(task_id, "准备中")
        self._transition_and_notify(task, TaskStatus.PROCESSING)
        self.task_progress.emit(task_id, "同步配置")

        user_config = self._config_manager.sync(self._access_token, config_id=config_id)
        if not mode:
            mode = getattr(user_config.clip_mode, "mode", None) or "reference-video"
            task.mode = mode
        if not config_id and getattr(user_config.clip_mode, "mode", None) != mode:
            fallback_config_id = _find_config_id_for_mode(
                Path(self._config_manager._local_config_path).parent,
                mode,
            )
            if fallback_config_id:
                config_id = fallback_config_id
                task.config_id = fallback_config_id
                user_config = self._config_manager.sync(
                    self._access_token,
                    config_id=fallback_config_id,
                )

        self.task_progress.emit(task_id, "加载本地配置")
        local_config = self._config_manager.load_local_config()

        self._log("INFO", task_id, "模式: %s  配置: %s" % (mode, task.config_id))
        self.task_progress.emit(task_id, "解析素材目录")
        dirs = self._resolve_edit_dirs(local_config, productId, user_config)

        self.task_progress.emit(task_id, "扫描素材")
        scanner = MaterialScanner(
            assets_dir=self._material_dir,
            logger=self._logger,
        )
        material_index = scanner.scan(productId)
        if material_index.is_empty():
            raise RuntimeError("素材目录为空，请检查素材路径配置")

        if mode == "reference-video" and not material_index.videos:
            raise RuntimeError("参考生视频模式需要至少一个参考视频素材")
        if mode == "image-to-video" and not material_index.images:
            raise RuntimeError("图生视频模式需要至少一张图片素材")

        self.task_progress.emit(task_id, "构建管线")
        subtitle_srt_path: Path | None = None
        replacement_audio_path: Path | None = None
        generated_media_covers_loop_count = False
        if user_config.text_items.subtitles:
            self.task_progress.emit(task_id, "生成字幕音频")
            generated = self._generate_subtitle_audio(
                task=task,
                user_config=user_config,
                material_index=material_index,
            )
            subtitle_srt_path = generated.srt_path
            replacement_audio_path = generated.mp3_path
            generated_media_covers_loop_count = True

        ctx = PipelineContext(
            task=task,
            user_config=user_config,
            local_config=local_config,
            material_index=material_index,
            scratch_dir=self._scratch_dir,
            dirs=dirs,
            logger=self._logger,
            subtitle_srt_path=subtitle_srt_path,
            replacement_audio_path=replacement_audio_path,
            generated_media_covers_loop_count=generated_media_covers_loop_count,
        )

        self.task_progress.emit(task_id, "剪辑中")
        pipeline = VideoEditingPipeline(logger=self._logger)
        result_path = pipeline.run(ctx)

        self.task_progress.emit(task_id, "重复检测")
        self._run_duplicate_detection(task, result_path, user_config)

        final_output = result_path

        self._transition_and_notify(task, TaskStatus.COMPLETED)
        self._log("INFO", task_id, "处理完成: %s" % result_path)
        self.task_finished.emit(task_id, True, str(result_path))

    def _generate_subtitle_audio(
        self,
        task: Task,
        user_config: UserConfig,
        material_index,
    ):
        if self._config_manager is None:
            raise RuntimeError("配置管理器未初始化")

        config_dir = Path(self._config_manager._local_config_path).parent
        generate_config = GenerateApiConfig.load(
            config_dir / "generate_api_config.json",
        )
        image_duration = getattr(
            user_config.clip_duration,
            "default_duration_per_image",
            5.0,
        )
        img_position = getattr(user_config.clip_mode, "img_video_position", "after")
        loop_count = getattr(user_config.repetition, "loop_count", 1)
        reference_video = None
        videos = getattr(material_index, "videos", None)
        if videos:
            reference_video = videos[0].path

        duration = build_generate_duration(
            mode=task.mode or "reference-video",
            material_index=material_index,
            image_duration=image_duration,
            img_video_position=img_position,
            reference_video=reference_video,
            duration_probe=self._probe_video_duration,
            loop_count=loop_count,
        )
        client = GenerateMediaClient(
            config=generate_config,
            base_url=generate_config.base_url,
            http_session=requests.Session(),
            scratch_dir=self._scratch_dir,
        )
        product_category_name = getattr(task, "productCategoryName", "") or ""
        product_title = getattr(task, "productTitle", "") or ""
        if not isinstance(product_category_name, str):
            product_category_name = ""
        if not isinstance(product_title, str):
            product_title = ""
        image_path = None
        if getattr(user_config, "subtitles_mode", "text") == "images":
            images = getattr(material_index, "images", None) or []
            if not images:
                raise RuntimeError("subtitles_mode=images requires at least one image")
            image_path = images[0].path

        return client.generate(
            task_id=task.id,
            product_id=task.productId,
            config_id=task.config_id or "",
            duration=duration,
            category=product_category_name,
            title=product_title,
            selling_points=product_title,
            image_path=image_path,
        )

    @staticmethod
    def _probe_video_duration(video_path: Path) -> float:
        import json
        from video_batch.environment import _run_no_window

        result = _run_no_window(
            ["ffprobe", "-v", "quiet", "-print_format", "json",
             "-show_entries", "format=duration", str(video_path)],
            capture_output=True, text=True,
            encoding="utf-8", errors="replace",
        )
        if result.returncode != 0:
            return 0.0
        try:
            info = json.loads(result.stdout)
            return float(info.get("format", {}).get("duration", 0.0))
        except (json.JSONDecodeError, TypeError, ValueError):
            return 0.0

    def _transition_and_notify(self, task: Task, new_status: str) -> None:
        if self._status_manager is not None:
            try:
                self._status_manager.transition(task, new_status, self._access_token)
            except Exception:
                task.status = new_status
        else:
            task.status = new_status
        self.task_status_update.emit(task.id, task.status)

    # ── 目录解析 ──

    def _resolve_edit_dirs(
        self,
        local_config: LocalConfig,
        task_id: str,
        user_config: UserConfig,
    ) -> EditDirs:
        """解析素材目录路径，将 LocalConfig 模式转为真实 Path。"""
        mat_paths = local_config.material_paths
        base = self._material_dir

        def _resolve(pattern: str) -> Path:
            prefix = mat_paths.base_dir + "/"
            rel = pattern.replace(prefix, "", 1) if pattern.startswith(prefix) else pattern
            rel = rel.format(task_id=task_id)
            return base / rel

        prepend_dir = (
            _resolve(mat_paths.prepend_dir)
            if user_config.affix.prepend_enabled
            else Path("NONEXISTENT")
        )
        append_dir = (
            _resolve(mat_paths.append_dir)
            if user_config.affix.append_enabled
            else Path("NONEXISTENT")
        )

        return EditDirs(
            bgm_dir=_resolve(mat_paths.bgm_dir),
            output_dir=_resolve(mat_paths.output_dir),
            watermark_dir=_resolve(mat_paths.watermark_dir),
            sticker_dir=_resolve(mat_paths.sticker_dir),
            prepend_dir=prepend_dir,
            append_dir=append_dir,
            img_dir=_resolve(mat_paths.image_dir),
        )

    # ── 日志 ──

    def _log(self, level: str, task_id: str, message: str) -> None:
        if self._logger is None:
            return
        if level == "INFO":
            self._logger.info(task_id=task_id, module="任务处理", message=message)
        elif level == "ERROR":
            self._logger.error(task_id=task_id, module="任务处理", message=message)

    # ── 重复检测 ──

    def _run_duplicate_detection(self, task: Task, video_path: Path, _user_config) -> None:
        """对生成的视频执行重复检测，结果通过信号发送。"""
        if self._detector is None:
            self._log("INFO", task.id, "重复检测未配置，跳过")
            self.task_duplicate_result.emit(task.id, -1, False)
            return

        if not self._user_id:
            self._log("INFO", task.id, "缺少用户 ID，跳过重复检测")
            self.task_duplicate_result.emit(task.id, -1, False)
            return

        try:
            result = self._detector.check_duplicate(
                task=task,
                video_path=str(video_path),
                user_id=self._user_id,
                clip_mode=task.mode or "reference-video",
                scope="full",
                access_token=self._access_token,
            )
            self.task_duplicate_result.emit(task.id, result.hamming_distance, result.is_duplicate)
            if result.is_duplicate:
                self._log("INFO", task.id,
                          f"重复检测: 发现重复视频，汉明距离={result.hamming_distance}")
            else:
                self._log("INFO", task.id,
                          f"重复检测: 唯一视频，汉明距离={result.hamming_distance}")
        except Exception as e:
            self._log("ERROR", task.id, f"重复检测失败: {e}")
            self.task_duplicate_result.emit(task.id, -1, False)


def _find_config_id_for_mode(config_dir: Path, mode: str) -> str | None:
    import json

    config_path = Path(config_dir) / "server_config.json"
    if not config_path.exists():
        return None
    try:
        data = json.loads(config_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None
    if not isinstance(data, dict):
        return None
    for config_id, config in data.items():
        if not isinstance(config, dict):
            continue
        clip_mode = config.get("clip_mode", {})
        if isinstance(clip_mode, dict) and clip_mode.get("mode") == mode:
            return str(config_id)
    return None
