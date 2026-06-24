import os
import time
from collections import deque
from pathlib import Path
from typing import TYPE_CHECKING

from PySide6.QtCore import QObject, QThread, QTimer, Signal
from PySide6.QtWidgets import QMessageBox

from video_batch.auth import AuthClient, SessionExpiredError
from video_batch.config_manager import ConfigManager
from video_batch.gui.app_config import AppConfig
from video_batch.gui.main_window import MainWindow
from video_batch.gui.mock_data import (
    update_mock_task_hamming,
    update_mock_task_status,
)
from video_batch.gui.task_item import TaskItem
from video_batch.gui.task_processor import TaskProcessorWorker
from video_batch.logger import Logger

if TYPE_CHECKING:
    from video_batch.task_status import TaskStatusManager

_SCRATCH_DIR_NAME = "_pipeline_scratch"
_AUTO_REFRESH_INTERVAL_MS = 15000


class UserPanelController(QObject):
    """用户面板控制器，协调任务加载、素材配置、媒体查看和任务处理。

    职责:
      - 加载工具配置的素材根目录路径
      - 连接面板信号（刷新、素材/视频查看、路径变更、任务处理）
      - 调用 API 获取任务列表并填充表格
      - 管理媒体查看窗口生命周期
      - 编排后台任务处理流水线
    """

    session_expired = Signal(str)
    _worker_process = Signal(str, str, str, str, str, str)

    def __init__(
        self,
        window: MainWindow,
        auth_client: AuthClient,
        access_token: str,
        app_config: AppConfig,
        logger: Logger,
        config_manager: ConfigManager,
        task_worker: TaskProcessorWorker,
        status_manager: "TaskStatusManager | None" = None,
        auto_refresh: bool = True,
        scratch_dir: Path | None = None,
    ) -> None:
        super().__init__()
        self._window = window
        self._auth_client = auth_client
        self._access_token = access_token
        self._app_config = app_config
        self._logger = logger
        self._config_manager = config_manager
        self._task_worker = task_worker
        self._status_manager = status_manager
        self._scratch_dir = scratch_dir or (Path(__file__).resolve().parent.parent.parent / "_demo_scratch" / _SCRATCH_DIR_NAME)

        self._processing_task_ids: set[str] = set()
        self._task_queue: deque[tuple[str, str, str, str, str]] = deque()
        self._paused: bool = False

        self._task_thread = QThread(self)
        self._task_worker.moveToThread(self._task_thread)
        self._task_thread.start()

        self._auto_refresh_timer = QTimer(self)
        self._auto_refresh_timer.setInterval(_AUTO_REFRESH_INTERVAL_MS)
        self._auto_refresh_timer.timeout.connect(self._on_auto_refresh_tick)

        self._connect_signals()
        self._restore_material_dir()
        if auto_refresh:
            self.on_refresh()

    def set_access_token(self, access_token: str) -> None:
        self._access_token = access_token
        self._sync_worker_config()

    def _connect_signals(self) -> None:
        panel = self._window.user_panel

        panel.material_dir_widget.path_changed.connect(self._on_material_dir_changed)
        panel.task_table.refresh_requested.connect(self.on_refresh)
        panel.task_table.batch_process_requested.connect(self._on_process_task)
        panel.task_table.auto_refresh_toggled.connect(self._on_auto_refresh_toggled)
        panel.task_table.view_material_requested.connect(self._on_view_material)
        panel.task_table.view_video_requested.connect(self._on_view_video)

        self._task_worker.task_status_update.connect(self._on_task_status_update)
        self._task_worker.task_finished.connect(self._on_task_finished)
        self._task_worker.task_duplicate_result.connect(self._on_duplicate_result)

        self._worker_process.connect(self._task_worker.process)

    def _restore_material_dir(self) -> None:
        if self._app_config.material_dir:
            self._window.user_panel.material_dir_widget.set_path(
                self._app_config.material_dir
            )

    def _on_material_dir_changed(self, path: str) -> None:
        self._app_config.material_dir = path
        self._app_config.save()

    def _on_process_task(self) -> None:
        if self._paused:
            return
        self._auto_process_pending_tasks()

    def _auto_process_pending_tasks(self) -> None:
        if not self._access_token:
            return
        if not self._app_config.material_dir:
            return
        if self._paused:
            return

        pending_tasks = [
            t for t in self._window.user_panel.task_table.tasks
            if t.status == "待剪辑" and t.id not in self._processing_task_ids
        ]
        if not pending_tasks:
            return

        self._sync_worker_config()
        for task in pending_tasks:
            self._processing_task_ids.add(task.id)
            self._task_queue.append((
                task.id,
                task.productId,
                task.config_id or "",
                task.productCategoryName or "",
                task.productTitle or "",
            ))
            self._logger.info(
                task_id=task.id,
                module="任务处理",
                message="任务已加入处理队列: material_dir=%s config_id=%s mode=reference-video" % (
                    self._app_config.material_dir, task.config_id or "",
                ),
            )
        self._dispatch_next_task()

    def _sync_worker_config(self) -> None:
        """同步当前配置到后台 worker。"""
        self._scratch_dir.mkdir(parents=True, exist_ok=True)
        hash_db_path = ""
        if self._scratch_dir:
            hash_db_path = str(self._scratch_dir / "duplicate_hashes.db")
        self._task_worker.configure(
            logger=self._logger,
            config_manager=self._config_manager,
            material_dir=self._app_config.material_dir or "",
            access_token=self._access_token,
            scratch_dir=self._scratch_dir,
            user_id="demo",
            hash_store_db_path=hash_db_path,
            status_manager=self._status_manager,
        )

    def _on_task_status_update(self, task_id: str, new_status: str) -> None:
        """后台 worker 报告状态变更，同步更新表格。"""
        self._try_update_mock_status(task_id, new_status)
        self.on_refresh()

    def _on_task_finished(self, task_id: str, success: bool, message: str) -> None:
        """后台 worker 报告处理完成，刷新列表并提示。"""
        self._processing_task_ids.discard(task_id)
        if success:
            self._try_update_mock_status(task_id, "待发布")
        else:
            self._try_update_mock_status(task_id, "剪辑失败")
        self.on_refresh()
        if success:
            self._logger.info(
                task_id=task_id,
                module="任务处理",
                message="处理完成: %s" % message,
            )
            self._dispatch_next_task()
        else:
            self._paused = True
            self._show_warning("处理失败", "任务 %s 处理失败:\n%s" % (task_id[:16], message))
            self._paused = False
            self._dispatch_next_task()

    def _on_duplicate_result(self, task_id: str, hamming_distance: int, is_duplicate: bool) -> None:
        """后台 worker 报告重复检测结果，更新 mock 数据并刷新。"""
        if hamming_distance >= 0:
            update_mock_task_hamming(task_id, hamming_distance)
        self.on_refresh()

    def _try_update_mock_status(self, task_id: str, new_status: str) -> None:
        """尝试更新 mock 数据中的任务状态（仅 mock 模式下生效）。"""
        try:
            update_mock_task_status(task_id, new_status)
        except Exception:
            pass

    def on_refresh(self) -> None:
        try:
            raw_tasks = self._auth_client.fetch_tasks(self._access_token)
            time.sleep(3)
        except SessionExpiredError as e:
            self.session_expired.emit(str(e) or "登录已过期，请重新登录。")
            return
        except Exception as e:
            self._show_warning("加载失败", f"获取任务列表失败:\n{e}")
            return
        items = [TaskItem.from_dict(t) for t in raw_tasks]
        if self._logger:
            self._logger.info(
                task_id="panel",
                module="任务面板",
                message=f"渲染任务列表，共 {len(items)} 条",
            )
        self._window.user_panel.task_table.set_tasks(items)
        self._auto_process_pending_tasks()

    def _on_auto_refresh_toggled(self, enabled: bool) -> None:
        if enabled:
            self._auto_refresh_timer.start()
            self._logger.info(
                task_id="panel",
                module="任务面板",
                message="自动刷新已开启，每 15 秒轮询一次",
            )
        else:
            self._auto_refresh_timer.stop()
            self._logger.info(
                task_id="panel",
                module="任务面板",
                message="自动刷新已关闭",
            )

    def _on_auto_refresh_tick(self) -> None:
        self.on_refresh()

    def _on_view_material(self, task_id: str, material_id: str) -> None:
        """打开素材对应的本地文件夹。"""
        self._open_folder(task_id, material_id)

    def _on_view_video(self, task_id: str, material_id: str) -> None:
        """打开视频输出对应的本地文件夹。"""
        self._open_folder(task_id, material_id, "output")

    def _dispatch_next_task(self) -> None:
        """从队列中取出下一个任务并提交给 worker 处理。"""
        if self._paused:
            return
        if not self._task_queue:
            return
        task_id, product_id, config_id, product_category_name, product_title = self._task_queue.popleft()
        self._worker_process.emit(
            task_id,
            product_id,
            config_id,
            product_category_name,
            product_title,
            "",
        )

    def _open_folder(self, task_id: str, material_id: str, sub_dir: str | None = None) -> None:
        """在资源管理器中打开 material_id 对应的本地文件夹。"""
        base_dir = self._app_config.material_dir
        if not base_dir:
            self._show_warning("路径未配置", "请先配置素材根目录。")
            return

        if sub_dir:
            folder_path = os.path.join(base_dir, sub_dir, material_id)
        else:
            folder_path = os.path.join(base_dir, material_id)

        if not os.path.exists(folder_path):
            self._show_warning("文件夹不存在",
                               f"素材文件夹不存在:\n{folder_path}")
            return

        try:
            os.startfile(folder_path)
        except Exception as e:
            self._show_warning("打开失败", f"无法打开文件夹:\n{folder_path}\n\n{e}")

    def _show_warning(self, title: str, text: str) -> None:
        try:
            QMessageBox.warning(self._window, title, text)
        except TypeError:
            pass
