r"""视频批量处理 — 全流程端到端测试脚本。

覆盖两种核心剪辑模式：
  - 图生视频（image-to-video）：读取 D:\test\ 下真实图片 → FFmpeg 编码
  - 参考生视频（reference-video）：读取 D:\test\ 下参考视频 + BGM → FFmpeg 处理

模拟服务端接口（登录/配置/任务/状态/文案），其余全部真实调用：
  - 直接使用 D:\test 目录下的原始素材（不生成伪数据）
  - 调用系统 FFmpeg 执行真实的视频编码
  - 真实的文件系统操作和日志记录
  - 验证输出为有效的 H.264 MP4 文件

覆盖 Issue #09（图生视频）和 Issue #14（原视频参考）的验收标准。

运行:
    cd video-batch-processing-system
    python scripts/demo_full_pipeline.py
"""

import io
import json
import os
import random
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from unittest.mock import MagicMock

# Windows 下强制设置 UTF-8 编码，避免控制台输出乱码
if sys.platform == "win32":
    os.environ.setdefault("PYTHONIOENCODING", "utf-8")
    if hasattr(sys.stdout, "buffer"):
        sys.stdout = io.TextIOWrapper(
            sys.stdout.buffer, encoding="utf-8", errors="replace",
        )
        sys.stderr = io.TextIOWrapper(
            sys.stderr.buffer, encoding="utf-8", errors="replace",
        )
    else:
        import codecs
        sys.stdout = codecs.getwriter("utf-8")(sys.stdout)
        sys.stderr = codecs.getwriter("utf-8")(sys.stderr)

# 将项目源码目录加入模块搜索路径，以便导入 video_batch 包
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from video_batch.auth import AuthClient
from video_batch.config_manager import ConfigManager
from video_batch.config_sync import ConfigSync, UserConfig
from video_batch.duplicate_detection import (
    DuplicateDetector, DuplicateDetectionConfig, DuplicateResult,
    VideoHashStore, compute_phash,
)
from video_batch.copywriting import CopywritingConfig, CopywritingGenerator
from video_batch.local_config import LocalConfig, MaterialPathsConfig
from video_batch.logger import Logger
from video_batch.material_scanner import MaterialScanner
from video_batch.overlay_elements import OverlayConfig, OverlayElementBuilder
from video_batch.pipeline import (
    EditDirs, PipelineContext, VideoEditingPipeline,
)
from video_batch.task_queue import Task, TaskQueue
from video_batch.task_status import TaskStatus, TaskStatusManager

# ============================================================
# 素材路径 — 由 local_config.material_paths 模式 + DEMO_MATERIAL_BASE 解析而来
# ============================================================

# 演示环境的素材根目录
DEMO_MATERIAL_BASE = Path("D:/test")

# 测试素材所在的唯一任务 ID
MATERIAL_TASK_ID = "3633867863993022100"


@dataclass
class _MaterialDirs:
    """素材目录聚合 — 由 local_config 模式解析后的真实路径。"""
    base: Path
    image_dir: Path
    video_dir: Path
    bgm_dir: Path
    output_dir: Path
    watermark_dir: Path
    sticker_dir: Path
    prepend_dir: Path
    append_dir: Path


def _resolve_material_dirs(
    mat_paths: MaterialPathsConfig,
    task_id: str,
    base_dir: Path = DEMO_MATERIAL_BASE,
) -> _MaterialDirs:
    """从 local_config 的 material_paths 模式中提取相对路径，拼接到 base_dir 上。

    参数:
        mat_paths: local_config 中的素材路径配置
        task_id: 任务 ID，用于填充路径模式中的 {task_id} 占位符
        base_dir: 素材根目录（演示环境使用 D:/test）
    返回:
        聚合了所有素材目录的 _MaterialDirs 实例
    """
    def _resolve(pattern: str) -> Path:
        rel = pattern.replace(mat_paths.base_dir + "/", "", 1) if pattern.startswith(mat_paths.base_dir + "/") else pattern
        rel = rel.format(task_id=task_id)
        return base_dir / rel

    return _MaterialDirs(
        base=base_dir,
        image_dir=_resolve(mat_paths.image_dir),
        video_dir=_resolve(mat_paths.video_dir),
        bgm_dir=_resolve(mat_paths.bgm_dir),
        output_dir=_resolve(mat_paths.output_dir),
        watermark_dir=_resolve(mat_paths.watermark_dir),
        sticker_dir=_resolve(mat_paths.sticker_dir),
        prepend_dir=_resolve(mat_paths.prepend_dir),
        append_dir=_resolve(mat_paths.append_dir),
    )


# 延迟解析的素材目录（在 main() 中通过 _resolve_material_dirs 填充）
_dirs: _MaterialDirs | None = None

# 临时文件目录（模块级，供 Mock TTS 缓存等使用）
_SCRATCH_DIR = Path(__file__).parent.parent / "_demo_scratch"

# FFmpeg drawtext 滤镜所需的中文字体路径（黑体，覆盖简繁中文）
# 注意使用反斜杠转义冒号，避免与 FFmpeg 滤镜参数分隔符冲突
CN_FONT_PATH = "C\\:/Windows/Fonts/simhei.ttf"

# ============================================================
# 模拟服务端响应数据（HTTP 接口 mock）
# ============================================================

# 登录接口返回的模拟 token 数据
LOGIN_RESPONSE = {
    "access_token": "at-demo-full-pipeline-abc123",
    "refresh_token": "rt-demo-full-pipeline-xyz789",
}

# ============================================================
# 模拟服务端配置存储（支持多用户配置，按 config_id 索引）
# ============================================================

SERVER_CONFIG_STORE = {
    # 图生视频配置 v2：基础视频效果 + 变调
    "cfg-img-v2": {
        "version": 2,
        "clip_mode": {"mode": "image-to-video"},
        "video_items": {
            "frame_extraction": True,
            "cropping": True,
            "blur": True,
            "shake": True,
            "watermark": True,
            "brightness": True,
            "contrast": True,
            "saturation": True,
            "color_balance": False,
            "gamma": False,
            "vintage_bw": False,
        },
        "text_items": {"subtitles": False, "danmaku": False, "sticker": True,},
        "affix": {"prepend_enabled": False, "append_enabled": False},
        "audio": {
            "background_music_enabled": True,
            "speed_adjustment_enabled": False,
            "pitch_enabled": True,
        },
        "repetition": {"loop_count": 1},
        "clip_duration": {"default_duration_per_image": 3.0},
    },
    # 参考生视频配置 v3：图片拼接 + 色彩平衡 + 变调
    "cfg-ref-v3": {
        "version": 3,
        "clip_mode": {"mode": "reference-video", "img_video_position": "after"},
        "video_items": {
            "frame_extraction": False,
            "cropping": False,
            "blur": False,
            "shake": False,
            "watermark": False,
            "brightness": False,
            "contrast": False,
            "saturation": False,
            "color_balance": False,
            "gamma": False,
            "vintage_bw": False,
        },
        "text_items": {"subtitles": True, "danmaku": True, "sticker": True,},
        "affix": {"prepend_enabled": True, "append_enabled": False},
        "audio": {
            "background_music_enabled": True,
            "speed_adjustment_enabled": True,
            "pitch_enabled": True,
        },
        "repetition": {"loop_count": 2},
        "clip_duration": {"default_duration_per_image": 2.0},
    },
}

# ============================================================
# 模拟任务数据（关联 config_id 到服务端配置存储）
# ============================================================

# 图生视频模式的任务数据
TASK_IMAGE_TO_VIDEO = {
    "id": MATERIAL_TASK_ID,
    "material_id": "mat-img-r001",
    "status": "待剪辑",
    "config_id": "cfg-img-v2",
    "mode": "image-to-video",
    "priority": 5,
    "retry_count": 0,
    "created_at": "2026-05-20T10:00:00",
}

# 参考生视频模式的任务数据
TASK_REFERENCE_VIDEO = {
    "id": MATERIAL_TASK_ID,
    "material_id": "mat-ref-r001",
    "status": "待剪辑",
    "config_id": "cfg-ref-v3",
    "mode": "reference-video",
    "priority": 3,
    "retry_count": 0,
    "created_at": "2026-05-20T10:05:00",
}


# ============================================================
# 模拟 HTTP 会话工厂
# ============================================================

def _make_mock_http(config_store: dict[str, dict], task_list: list[dict]):
    """构建模拟 HTTP 会话，覆盖所有服务端接口。

    使用 MagicMock 模拟 requests.Session 的行为，根据 URL 路径返回预设响应。

    /clip_config/config_map 支持 ?config_id= 查询参数，从 config_store 中检索对应配置。
    无 config_id 参数时，根据最近一次 /clip_record/pending_clip/list 返回的 config_id 自动匹配。

    参数:
        config_store: 服务端配置存储字典（config_id → config_dict）
        task_list: 任务接口返回的任务列表
    返回:
        MagicMock 对象，可替代 requests.Session 使用
    """
    http = MagicMock()

    # 追踪最近一次任务返回的 config_id（用于无 query 参数时的配置匹配）
    _last_config_id: str | None = None

    # POST 请求模拟：登录、登出、创建任务、文案生成
    def post_side_effect(url, **kwargs):
        resp = MagicMock()
        if "/api/auth/login" in url:
            # 登录接口
            resp.status_code = 200
            resp.json.return_value = LOGIN_RESPONSE
        elif "/api/auth/logout" in url:
            # 登出接口
            resp.status_code = 200
        elif "/api/copywriting" in url:
            # 文案生成接口
            resp.status_code = 200
            resp.json.return_value = {
                "text": "探索无限可能，从这里开始——让每一次创作都成为经典！",
                "style": "正式",
            }
        elif "/api/tts" in url:
            # TTS 语音合成接口：生成 440Hz 正弦波模拟语音
            _tts_cache = _SCRATCH_DIR / "tts" / "_mock_tts.mp3"
            _tts_cache.parent.mkdir(parents=True, exist_ok=True)
            if not _tts_cache.exists():
                subprocess.run(
                    ["ffmpeg", "-y", "-f", "lavfi",
                     "-i", "sine=frequency=440:duration=3",
                     "-q:a", "5", str(_tts_cache)],
                    capture_output=True,
                )
            resp.status_code = 200
            resp.content = _tts_cache.read_bytes()
        elif "/api/tasks" in url and "/status" not in url:
            # 创建任务接口
            resp.status_code = 201
            resp.json.return_value = task_list[0] if task_list else {}
        elif "/status" in url:
            # 任务状态更新接口
            resp.status_code = 200
        else:
            # 未知接口
            resp.status_code = 500
            resp.json.return_value = {"detail": "未知接口"}
        return resp

    # GET 请求模拟：获取配置（支持 config_id 查询）、获取任务列表
    def get_side_effect(url, **kwargs):
        nonlocal _last_config_id
        resp = MagicMock()
        if "/clip_config/config_map" in url or "/clip_config/config_map?" in url:
            # 配置获取接口 — 解析 config_id 查询参数
            config_id = None
            import re
            m = re.search(r"[?&]config_id=([^&\s]+)", url)
            if m:
                config_id = m.group(1)
            elif _last_config_id:
                config_id = _last_config_id
            config_dict = config_store.get(config_id) if config_id else None
            if config_dict is None:
                resp.status_code = 404
                resp.json.return_value = {"detail": "配置 %s 不存在" % (config_id or "unknown")}
            else:
                resp.status_code = 200
                resp.json.return_value = config_dict
        elif "/clip_record/pending_clip/list" in url:
            # 任务列表接口
            resp.status_code = 200
            resp.json.return_value = task_list
            # 记录 config_id 用于后续无参 /clip_config/config_map 匹配
            if task_list:
                _last_config_id = task_list[0].get("config_id")
        elif "/api/tasks/" in url and "/status" not in url:
            # 单个任务详情接口
            resp.status_code = 200
            resp.json.return_value = task_list[0] if task_list else {}
        else:
            # 未知接口
            resp.status_code = 500
            resp.json.return_value = {"detail": "未知接口"}
        return resp

    # PUT 请求模拟：统一返回 200
    def put_side_effect(url, **kwargs):
        resp = MagicMock()
        resp.status_code = 200
        return resp

    # 绑定 side_effect 到 MagicMock 方法
    http.post.side_effect = post_side_effect
    http.get.side_effect = get_side_effect
    http.put.side_effect = put_side_effect
    return http


# ============================================================
# 辅助函数
# ============================================================

def _verify_mp4_file(path: Path):
    """验证文件是否为有效的 MP4 格式。

    通过检查文件存在性、大小以及 MP4 ftyp box 标识来验证。

    参数:
        path: 待验证的文件路径
    返回:
        文件大小（字节）
    抛出:
        AssertionError: 文件不符合 MP4 格式要求
    """
    assert path.exists(), "输出文件不存在: {}".format(path)
    size = path.stat().st_size
    assert size > 1024, "文件过小 ({} bytes)，不是有效视频".format(size)

    # 读取前 12 字节，检查 MP4 ftyp box 标识
    with open(str(path), "rb") as f:
        header = f.read(12)

    # box_size 应为 0x18 (24) 或 0x20 (32)
    assert header[:4] in (b"\x00\x00\x00\x18", b"\x00\x00\x00\x20"), \
        "文件头不匹配 MP4/ftyp box"
    ftyp = header[4:8]
    assert b"ftyp" in ftyp or b"isom" in ftyp, \
        "未检测到 ftyp/isom 标识, 实际={}".format(ftyp)
    return size


def _get_mp4_info(path: Path):
    """调用 ffprobe 获取视频的编码信息。

    参数:
        path: 视频文件路径
    返回:
        JSON 格式的视频信息字典，解析失败返回 None
    """
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json",
         "-show_format", "-show_streams", str(path)],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        return None
    try:
        return json.loads(result.stdout)
    except Exception:
        return None


def _format_video_info(info: dict | None) -> str:
    """将 ffprobe 返回的视频信息格式化为可读字符串。

    参数:
        info: ffprobe 返回的信息字典
    返回:
        形如 "720x960@30/1fps(h264) | 音频:aac@44100Hz | 93.3s | 24433KB" 的字符串
    """
    if not info:
        return "无信息"
    streams = info.get("streams", [])
    fmt = info.get("format", {})
    parts = []
    for s in streams:
        if s.get("codec_type") == "video":
            # 视频流信息
            parts.append("{}x{}@{}fps({})".format(
                s.get("width", "?"), s.get("height", "?"),
                s.get("r_frame_rate", "?"), s.get("codec_name", "?"),
            ))
        elif s.get("codec_type") == "audio":
            # 音频流信息
            parts.append("音频:{}@{}Hz".format(
                s.get("codec_name", "?"), s.get("sample_rate", "?"),
            ))
    dur = fmt.get("duration", "?")
    if dur != "?":
        parts.append("{:.1f}s".format(float(dur)))
    parts.append("{}KB".format(int(fmt.get("size", 0)) / 1024))
    return " | ".join(parts)


def _compute_phash_ffmpeg(video_path: str) -> str:
    """使用 ffmpeg 从视频文件提取帧并计算 64 位 pHash。

    从视频中提取一帧，缩放为 32x32 灰度图，然后调用
    duplicate_detection.compute_phash() 进行 DCT 哈希计算。

    参数:
        video_path: 视频文件路径
    返回:
        16 位十六进制 pHash 字符串
    """
    result = subprocess.run([
        "ffmpeg", "-y", "-i", video_path,
        "-vframes", "1", "-s", "32x32",
        "-pix_fmt", "gray",
        "-f", "rawvideo", "-",
    ], capture_output=True)
    if result.returncode != 0 or len(result.stdout) < 1024:
        err = result.stderr.decode("utf-8", errors="replace")[:200]
        raise RuntimeError("ffmpeg 提取帧失败: {}".format(err))
    raw = result.stdout[:1024]
    frame = [[float(raw[y * 32 + x]) for x in range(32)] for y in range(32)]
    return compute_phash(frame)


class _FFmpegDuplicateDetector(DuplicateDetector):
    """使用 ffmpeg 实际提取帧计算 pHash 的重复检测器。

    继承自 DuplicateDetector，重写 compute_phash 方法以使用 ffmpeg
    代替未集成的视频解码库，实现端到端的重复检测。
    """
    def compute_phash(self, video_path: str) -> str:
        return _compute_phash_ffmpeg(video_path)


# ============================================================
# 重复检测工具（调用 DuplicateDetector.check_duplicate）
# ============================================================

def _run_duplicate_check(
    task, video_path: str, task_label: str,
    user_id: str, clip_mode: str,
    store_db: Path,
    logger: "Logger",
):
    """执行视频重复检测并输出结果。

    参数:
        task: 当前任务对象
        video_path: 输出视频文件路径
        task_label: 任务标签（用于日志输出前缀）
        user_id: 用户标识
        clip_mode: 剪辑模式
        store_db: 哈希数据库文件路径
        logger: 日志记录器
    返回:
        DuplicateResult 对象
    """
    detector_config = DuplicateDetectionConfig()
    hash_store = VideoHashStore(db_path=store_db, logger=logger)
    detector = _FFmpegDuplicateDetector(
        hash_store=hash_store,
        config=detector_config,
        logger=logger,
    )
    return detector.check_duplicate(
        task=task,
        video_path=video_path,
        user_id=user_id,
        clip_mode=clip_mode,
    )


def _print_file_list(label: str, directory: Path, pattern: str = "*"):
    """打印指定目录下的文件列表及大小。

    参数:
        label: 显示标题
        directory: 目录路径
        pattern: glob 匹配模式
    返回:
        文件路径列表
    """
    files = sorted(directory.glob(pattern)) if directory.exists() else []
    print("  {}: {} 个文件".format(label, len(files)))
    for f in files:
        print("    {}  ({} bytes)".format(f.name, f.stat().st_size))
    return files


# ============================================================
# 管线 1: 图生视频（image-to-video）
def run_image_to_video_pipeline(
    logger: Logger,
    http,
    tokens,
    config_dir: Path,
    task_id: str,
    scratch_dir: Path,
    local_config: LocalConfig,
    dirs: _MaterialDirs,
    image_limit: int | None = None,
    force_fail: bool = False,
):
    """执行完整的图生视频管线。

    流程: 任务获取 → 配置同步 → 素材扫描 → 文案生成 → 剪辑管线 → 叠加元素 → 去重验证

    核心编辑步骤委托给 VideoEditingPipeline。
    """
    label = "图生视频-{}".format(task_id[:8])

    task_queue = TaskQueue(
        base_url="http://mock-api", http_session=http, logger=logger,
    )
    task_queue.fetch_and_enqueue(tokens.access_token)
    task = task_queue.dequeue()
    print("  [任务] id={}, config_id={}, mode={}".format(
        task.id[:16], task.config_id, task.mode,
    ))

    config_sync = ConfigSync(
        base_url="http://mock-api", http_session=http,
        config_dir=config_dir, logger=logger,
    )
    config_manager = ConfigManager(syncer=config_sync, config_dir=config_dir, logger=logger)
    user_config = config_manager.sync(tokens.access_token, config_id=task.config_id)
    print("  [配置] mode={}, version={} (config_id={})".format(
        user_config.clip_mode.mode, user_config.version, task.config_id,
    ))

    status_mgr = TaskStatusManager(
        base_url="http://mock-api", http_session=http, logger=logger,
    )

    print("  [扫描] 扫描素材目录...")
    scanner = MaterialScanner(assets_dir=dirs.base, logger=logger)
    material_index = scanner.scan(task.id)
    images = [m.path for m in material_index.images]
    print("  [素材] 发现 {} 张图片".format(len(images)))
    for img in images:
        print("    {}".format(img.name))

    if image_limit is not None:
        material_index.images = material_index.images[:image_limit]
        print("  [限制] 使用前 {} 张".format(image_limit))

    tts_audio_extra: list[str] = []
    subtitle_text = "演示字幕"
    if user_config.text_items.subtitles:
        print("  [文案] 调用 CopywritingGenerator 生成文案 + TTS 语音...")
        copywriting_config = CopywritingConfig(enabled=True)
        copywriting_generator = CopywritingGenerator(
            config=copywriting_config,
            base_url="http://mock-api",
            http_session=http,
            temp_dir=scratch_dir,
            logger=logger,
            supported_styles=local_config.randomization.copywriting_styles,
        )
        try:
            copywriting_result = copywriting_generator.generate(
                access_token=tokens.access_token,
            )
            subtitle_text = copywriting_result.text
            print("  [文案] 文案文本: {}".format(subtitle_text))
            print("  [文案] TTS 音频: {}".format(copywriting_result.audio_path))
            tts_audio_extra = ["-i", str(copywriting_result.audio_path)]
        except Exception as e:
            print("  [文案] 生成失败，使用默认字幕: {}".format(e))

    extra_video_filters: list[str] = []
    if user_config.text_items.subtitles:
        extra_video_filters.append(
            "drawtext=fontfile='{}':text='{}':fontsize=36:fontcolor=white:"
            "x=(w-text_w)/2:y=h*0.9".format(CN_FONT_PATH, subtitle_text),
        )
    if user_config.text_items.danmaku:
        extra_video_filters.append(
            "drawtext=fontfile='{}':text='弹幕示例':fontsize=20:fontcolor=yellow:"
            "x='w-t*100':y=h*0.25:enable='1'".format(CN_FONT_PATH),
        )
    print("  [效果] 额外视频滤镜: {}".format(extra_video_filters if extra_video_filters else "无"))

    edit_dirs = EditDirs(
        bgm_dir=dirs.bgm_dir,
        output_dir=dirs.output_dir,
        watermark_dir=dirs.watermark_dir,
        sticker_dir=dirs.sticker_dir,
        prepend_dir=dirs.prepend_dir if user_config.affix.prepend_enabled else Path("NONEXISTENT"),
        append_dir=dirs.append_dir if user_config.affix.append_enabled else Path("NONEXISTENT"),
    )

    ctx = PipelineContext(
        task=task,
        user_config=user_config,
        local_config=local_config,
        material_index=material_index,
        scratch_dir=scratch_dir,
        dirs=edit_dirs,
        logger=logger,
        extra_video_filters=extra_video_filters,
        extra_audio_inputs=tts_audio_extra,
    )

    status_mgr.transition(task, TaskStatus.PROCESSING, tokens.access_token)
    print("  [状态] pending -> processing")

    pipeline = VideoEditingPipeline(logger=logger)
    try:
        pipeline_result = pipeline.run(ctx)
    except Exception as e:
        logger.error(task_id=task.id, module="图生视频", message="失败: {}".format(e))
        status_mgr.transition(task, TaskStatus.FAILED, tokens.access_token)
        print("  [状态] processing -> failed ({})".format(e))
        return {"success": False, "error": str(e), "mode": "image-to-video"}

    processed = pipeline_result
    if user_config.video_items.watermark and dirs.watermark_dir.exists():
        wm_range = local_config.randomization.overlay
        print("  [水印] 透明度范围: [{:.3f}, {:.3f}]".format(
            wm_range.watermark_transparency_min, wm_range.watermark_transparency_max,
        ))
        overlay_config = OverlayConfig(watermark_enabled=True, subtitle_enabled=False, danmaku_enabled=False)
        overlay_builder = OverlayElementBuilder(
            config=overlay_config,
            watermark_dir=str(dirs.watermark_dir),
            range_config=wm_range,
        )
        wm_filters, wm_inputs = overlay_builder.build()
        if wm_filters:
            wm_path = wm_inputs[1]
            params = overlay_builder.get_applied_params()
            print("  [水印] 图片: {}, alpha={:.3f}".format(Path(wm_path).name, params.watermark_transparency))
            temp_wm = scratch_dir / "img2vid" / "_temp_watermarked.mp4"
            temp_wm.parent.mkdir(parents=True, exist_ok=True)
            wm_cmd = [
                "ffmpeg", "-y",
                "-i", str(processed),
                "-i", wm_path,
                "-filter_complex", wm_filters[0],
                "-c:v", "libx264", "-c:a", "copy",
                "-pix_fmt", "yuv420p",
                str(temp_wm),
            ]
            subprocess.run(wm_cmd, capture_output=True, check=True)
            processed.unlink(missing_ok=True)
            processed = temp_wm
            print("  [水印] 叠加完成")
    elif user_config.video_items.watermark:
        print("  [水印] 目录不存在: {}".format(dirs.watermark_dir))

    if user_config.text_items.sticker_enabled and dirs.sticker_dir.exists():
        st_range = local_config.randomization.overlay
        print("  [贴纸] 目录: {}".format(dirs.sticker_dir))
        overlay_config = OverlayConfig(
            watermark_enabled=False, subtitle_enabled=False,
            danmaku_enabled=False, sticker_enabled=True,
        )
        overlay_builder = OverlayElementBuilder(
            config=overlay_config,
            sticker_dir=str(dirs.sticker_dir),
            rng=random.Random(),
            range_config=st_range,
            logger=logger,
        )
        st_filters, st_inputs = overlay_builder.build()
        if st_filters:
            st_params = overlay_builder.get_applied_params()
            print("  [贴纸] {} 个: {}".format(st_params.sticker_count, st_params.sticker_files))
            temp_st = scratch_dir / "img2vid" / "_temp_stickered.mp4"
            temp_st.parent.mkdir(parents=True, exist_ok=True)
            st_cmd = ["ffmpeg", "-y", "-i", str(processed)]
            st_cmd.extend(st_inputs)
            st_cmd.extend([
                "-filter_complex", ";".join(st_filters),
                "-c:v", "libx264", "-c:a", "copy",
                "-pix_fmt", "yuv420p", str(temp_st),
            ])
            subprocess.run(st_cmd, capture_output=True, check=True)
            processed.unlink(missing_ok=True)
            processed = temp_st
            print("  [贴纸] 叠加完成")
    elif user_config.text_items.sticker_enabled:
        print("  [贴纸] 目录不存在: {}".format(dirs.sticker_dir))

    result_path = processed

    # 确保最终输出落到预期输出目录
    final_output = dirs.output_dir / "P{}.mp4".format(task.id)
    shutil.copy2(str(result_path), str(final_output))
    result_path = final_output

    file_size = _verify_mp4_file(result_path)
    info = _get_mp4_info(result_path)
    print("  [编码] 成功: {} ({}, {})".format(
        result_path.name, "{:,}B".format(file_size), _format_video_info(info),
    ))

    status_mgr.transition(task, TaskStatus.COMPLETED, tokens.access_token)
    print("  [状态] processing -> completed")

    dup_db = scratch_dir / "hashes.db"
    dup_result = _run_duplicate_check(
        task=task, video_path=str(result_path),
        task_label=label, user_id="demo_user",
        clip_mode=task.mode,
        store_db=dup_db, logger=logger,
    )
    dup_status = "重复" if dup_result.is_duplicate else "唯一"
    print("  [去重] {} (汉明距离={}, 阈值={})".format(
        dup_status, dup_result.hamming_distance, dup_result.threshold,
    ))

    return {
        "success": True,
        "output_path": str(result_path),
        "file_size": file_size,
        "video_info": info,
        "mode": "image-to-video",
        "video_filters": extra_video_filters,
        "audio_filters": [],
        "duplicate_result": dup_result,
    }


# ============================================================
# 管线 2: 参考生视频（reference-video）
# ============================================================

def run_reference_video_pipeline(
    logger: Logger,
    http,
    tokens,
    config_dir: Path,
    task_id: str,
    scratch_dir: Path,
    local_config: LocalConfig,
    dirs: _MaterialDirs,
    force_fail: bool = False,
):
    """执行完整的参考生视频管线。

    流程: 任务获取 → 配置同步 → 素材扫描 → 文案生成 → 剪辑管线 → 叠加元素 → 去重验证

    核心编辑步骤（图片拼接+参考视频处理+前后贴）委托给 VideoEditingPipeline。
    """
    task_queue = TaskQueue(
        base_url="http://mock-api", http_session=http, logger=logger,
    )
    task_queue.fetch_and_enqueue(tokens.access_token)
    task = task_queue.dequeue()
    print("  [任务] id={}, config_id={}, mode={}".format(
        task.id[:16], task.config_id, task.mode,
    ))

    config_sync = ConfigSync(
        base_url="http://mock-api", http_session=http,
        config_dir=config_dir, logger=logger,
    )
    config_manager = ConfigManager(syncer=config_sync, config_dir=config_dir, logger=logger)
    user_config = config_manager.sync(tokens.access_token, config_id=task.config_id)
    print("  [配置] mode={}, version={} (config_id={})".format(
        user_config.clip_mode.mode, user_config.version, task.config_id,
    ))

    status_mgr = TaskStatusManager(
        base_url="http://mock-api", http_session=http, logger=logger,
    )

    print("  [扫描] 扫描素材目录...")
    scanner = MaterialScanner(assets_dir=dirs.base, logger=logger)
    material_index = scanner.scan(task.id)
    images = [m.path for m in material_index.images]
    videos = [m.path for m in material_index.videos]
    print("  [素材] 发现 {} 张图片, {} 个视频".format(len(images), len(videos)))
    if not videos:
        print("  [错误] 未找到参考视频!")
        return {"success": False, "error": "未找到参考视频", "mode": "reference-video"}

    reference_video = videos[0]
    print("  [参考] 使用视频: {}".format(reference_video.name))

    tts_audio_extra: list[str] = []
    subtitle_text = "演示字幕"
    if user_config.text_items.subtitles:
        print("  [文案] 调用 CopywritingGenerator 生成文案 + TTS 语音...")
        copywriting_config = CopywritingConfig(enabled=True)
        copywriting_generator = CopywritingGenerator(
            config=copywriting_config,
            base_url="http://mock-api",
            http_session=http,
            temp_dir=scratch_dir,
            logger=logger,
            supported_styles=local_config.randomization.copywriting_styles,
        )
        try:
            copywriting_result = copywriting_generator.generate(
                access_token=tokens.access_token,
            )
            subtitle_text = copywriting_result.text
            print("  [文案] 文案文本: {}".format(subtitle_text))
            print("  [文案] TTS 音频: {}".format(copywriting_result.audio_path))
            tts_audio_extra = ["-i", str(copywriting_result.audio_path)]
        except Exception as e:
            print("  [文案] 生成失败，使用默认字幕: {}".format(e))

    extra_video_filters: list[str] = []
    if user_config.text_items.subtitles:
        extra_video_filters.append(
            "drawtext=fontfile='{}':text='{}':fontsize=24:fontcolor=white:"
            "x=(w-text_w)/2:y=h*0.9".format(CN_FONT_PATH, subtitle_text),
        )
    if user_config.text_items.danmaku:
        extra_video_filters.append(
            "drawtext=fontfile='{}':text='弹幕示例':fontsize=20:fontcolor=yellow:"
            "x='w-t*100':y=h*0.25:enable='1'".format(CN_FONT_PATH),
        )
    print("  [效果] 额外视频滤镜: {}".format(extra_video_filters if extra_video_filters else "无"))

    bgm_files = sorted(dirs.bgm_dir.glob("*.mp3")) if dirs.bgm_dir.exists() else []
    print("  [BGM] 可选背景音乐: {} 个".format(len(bgm_files)))
    for b in bgm_files:
        print("    {}".format(b.name))

    if user_config.audio.pitch_enabled:
        audio_range = local_config.randomization.audio
        print("  [变调] 半音范围: {:.1f} ~ {:.1f}".format(
            audio_range.pitch_semitones_min, audio_range.pitch_semitones_max,
        ))

    edit_dirs = EditDirs(
        bgm_dir=dirs.bgm_dir,
        output_dir=dirs.output_dir,
        watermark_dir=dirs.watermark_dir,
        sticker_dir=dirs.sticker_dir,
        prepend_dir=dirs.prepend_dir if user_config.affix.prepend_enabled else Path("NONEXISTENT"),
        append_dir=dirs.append_dir if user_config.affix.append_enabled else Path("NONEXISTENT"),
        img_dir=dirs.image_dir,
    )

    ctx = PipelineContext(
        task=task,
        user_config=user_config,
        local_config=local_config,
        material_index=material_index,
        scratch_dir=scratch_dir,
        dirs=edit_dirs,
        logger=logger,
        extra_video_filters=extra_video_filters,
        extra_audio_inputs=tts_audio_extra,
    )

    status_mgr.transition(task, TaskStatus.PROCESSING, tokens.access_token)
    print("  [状态] pending -> processing")

    pipeline = VideoEditingPipeline(logger=logger)
    try:
        pipeline_result = pipeline.run(ctx)
    except Exception as e:
        logger.error(task_id=task.id, module="参考视频", message="失败: {}".format(e))
        status_mgr.transition(task, TaskStatus.FAILED, tokens.access_token)
        print("  [状态] processing -> failed ({})".format(e))
        return {"success": False, "error": str(e), "mode": "reference-video"}

    processed = pipeline_result
    if user_config.video_items.watermark and dirs.watermark_dir.exists():
        wm_range = local_config.randomization.overlay
        print("  [水印] 透明度范围: [{:.3f}, {:.3f}]".format(
            wm_range.watermark_transparency_min, wm_range.watermark_transparency_max,
        ))
        overlay_config = OverlayConfig(watermark_enabled=True, subtitle_enabled=False, danmaku_enabled=False)
        overlay_builder = OverlayElementBuilder(
            config=overlay_config,
            watermark_dir=str(dirs.watermark_dir),
            range_config=wm_range,
        )
        wm_filters, wm_inputs = overlay_builder.build()
        if wm_filters:
            wm_path = wm_inputs[1]
            params = overlay_builder.get_applied_params()
            print("  [水印] 图片: {}, alpha={:.3f}".format(Path(wm_path).name, params.watermark_transparency))
            temp_wm = scratch_dir / "refvid" / "_temp_watermarked.mp4"
            temp_wm.parent.mkdir(parents=True, exist_ok=True)
            wm_cmd = [
                "ffmpeg", "-y",
                "-i", str(processed),
                "-i", wm_path,
                "-filter_complex", wm_filters[0],
                "-c:v", "libx264", "-c:a", "copy",
                "-pix_fmt", "yuv420p",
                str(temp_wm),
            ]
            subprocess.run(wm_cmd, capture_output=True, check=True)
            processed.unlink(missing_ok=True)
            processed = temp_wm
            print("  [水印] 叠加完成")
    elif user_config.video_items.watermark:
        print("  [水印] 目录不存在: {}".format(dirs.watermark_dir))

    if user_config.text_items.sticker_enabled and dirs.sticker_dir.exists():
        st_range = local_config.randomization.overlay
        print("  [贴纸] 目录: {}".format(dirs.sticker_dir))
        overlay_config = OverlayConfig(
            watermark_enabled=False, subtitle_enabled=False,
            danmaku_enabled=False, sticker_enabled=True,
        )
        overlay_builder = OverlayElementBuilder(
            config=overlay_config,
            sticker_dir=str(dirs.sticker_dir),
            rng=random.Random(),
            range_config=st_range,
            logger=logger,
        )
        st_filters, st_inputs = overlay_builder.build()
        if st_filters:
            st_params = overlay_builder.get_applied_params()
            print("  [贴纸] {} 个: {}".format(st_params.sticker_count, st_params.sticker_files))
            temp_st = scratch_dir / "refvid" / "_temp_stickered.mp4"
            temp_st.parent.mkdir(parents=True, exist_ok=True)
            st_cmd = ["ffmpeg", "-y", "-i", str(processed)]
            st_cmd.extend(st_inputs)
            st_cmd.extend([
                "-filter_complex", ";".join(st_filters),
                "-c:v", "libx264", "-c:a", "copy",
                "-pix_fmt", "yuv420p", str(temp_st),
            ])
            subprocess.run(st_cmd, capture_output=True, check=True)
            processed.unlink(missing_ok=True)
            processed = temp_st
            print("  [贴纸] 叠加完成")
    elif user_config.text_items.sticker_enabled:
        print("  [贴纸] 目录不存在: {}".format(dirs.sticker_dir))

    result_path = processed

    # 确保最终输出落到预期输出目录
    final_output = dirs.output_dir / "V{}.mp4".format(task.id)
    shutil.copy2(str(result_path), str(final_output))
    result_path = final_output

    file_size = _verify_mp4_file(result_path)
    info = _get_mp4_info(result_path)
    print("  [编码] 成功: {} ({}, {})".format(
        result_path.name, "{:,}B".format(file_size), _format_video_info(info),
    ))

    status_mgr.transition(task, TaskStatus.COMPLETED, tokens.access_token)
    print("  [状态] processing -> completed")

    dup_db = scratch_dir / "hashes.db"
    dup_result = _run_duplicate_check(
        task=task, video_path=str(result_path),
        task_label="参考视频-{}".format(task_id[:8]),
        user_id="demo_user",
        clip_mode=task.mode,
        store_db=dup_db, logger=logger,
    )
    dup_status = "重复" if dup_result.is_duplicate else "唯一"
    print("  [去重] {} (汉明距离={}, 阈值={})".format(
        dup_status, dup_result.hamming_distance, dup_result.threshold,
    ))

    return {
        "success": True,
        "output_path": str(result_path),
        "file_size": file_size,
        "video_info": info,
        "audio_filters": [],
        "mode": "reference-video",
        "duplicate_result": dup_result,
    }


# 验收标准验证
# ============================================================

def verify_acceptance_criteria(
    img_result: dict,
    ref_result: dict,
    log_dir: Path,
    output_dir: Path,
):
    """验证 Issue #09（图生视频）和 Issue #14（参考生视频）的验收标准。

    检查项包括：
        - 视频生成是否成功
        - 编码格式是否为 H.264
        - 分辨率是否正常
        - 视频效果是否全部启用
        - 音频处理是否生效
        - 日志和输出文件是否存在

    参数:
        img_result: 图生视频管线的执行结果
        ref_result: 参考生视频管线的执行结果
        log_dir: 日志目录
        output_dir: 输出目录
    返回:
        是否全部通过
    """
    checks = []

    # --- Issue #09: 图生视频 ---
    # AC1: 图片转换成功
    ac1 = img_result.get("success") is True
    checks.append(("图生视频 | 单/多张图片转换成功", ac1))

    # AC2: H.264 编码
    i_info = img_result.get("video_info")
    if i_info and i_info.get("streams"):
        vs = [s for s in i_info["streams"] if s.get("codec_type") == "video"]
        if vs:
            ac2 = vs[0].get("codec_name", "") in ("h264", "libx264")
            checks.append(("图生视频 | H.264 编码 ({})".format(vs[0].get("codec_name")), ac2))
            # AC3: 分辨率正常
            ac3 = vs[0].get("width", 0) > 0 and vs[0].get("height", 0) > 0
            checks.append(("图生视频 | 分辨率保持 ({}x{})".format(
                vs[0].get("width", "?"), vs[0].get("height", "?")), ac3))
        else:
            checks.append(("图生视频 | H.264 编码", False))
            checks.append(("图生视频 | 分辨率保持", False))
    else:
        checks.append(("图生视频 | H.264 编码", False))
        checks.append(("图生视频 | 分辨率保持", False))

    # AC4: 输出路径正确
    ac4 = img_result.get("output_path") is not None
    checks.append(("图生视频 | 输出路径正确", ac4))

    # AC5: 5 项视频效果全部启用
    img_vf = img_result.get("video_filters", [])
    ac5 = len(img_vf) >= 5
    checks.append(("图生视频 | 视频效果全部启用 ({} / 5 项)".format(len(img_vf)), ac5))

    # --- Issue #14: 参考生视频 ---
    # AC6: 参考视频处理成功
    ac6 = ref_result.get("success") is True
    checks.append(("参考生视频 | 基于参考视频生成成功", ac6))

    # AC7/AC8: H.264 + AAC 编码
    r_info = ref_result.get("video_info")
    if r_info and r_info.get("streams"):
        rcodecs = set()
        has_audio = False
        for s in r_info["streams"]:
            if s.get("codec_type") == "video":
                rcodecs.add(s.get("codec_name", ""))
            elif s.get("codec_type") == "audio":
                has_audio = True
        ac7 = any(c in ("h264", "libx264") for c in rcodecs)
        checks.append(("参考生视频 | H.264 编码 ({})".format("|".join(rcodecs)), ac7))
        ac8 = has_audio
        checks.append(("参考生视频 | AAC 音频编码", ac8))
    else:
        checks.append(("参考生视频 | H.264 编码", False))
        checks.append(("参考生视频 | AAC 音频编码", False))

    # AC9: 音频处理启用
    ac9 = len(ref_result.get("audio_filters", [])) > 0
    checks.append(("参考生视频 | 音频处理启用 ({} 条滤波)".format(
        len(ref_result.get("audio_filters", [])),), ac9))

    # --- 重复检测评分 ---
    # AC12: 图生视频去重评分
    img_dup = img_result.get("duplicate_result")
    if img_dup is not None:
        status_text = "唯一" if not img_dup.is_duplicate else "重复"
        checks.append(("图生视频 | 去重检测 ({} | 汉明距离={}, 阈值={})".format(
            status_text, img_dup.hamming_distance, img_dup.threshold,
        ), not img_dup.is_duplicate))
    else:
        checks.append(("图生视频 | 去重检测 (未执行)", False))

    # AC13: 参考生视频去重评分
    ref_dup = ref_result.get("duplicate_result")
    if ref_dup is not None:
        status_text = "唯一" if not ref_dup.is_duplicate else "重复"
        checks.append(("参考生视频 | 去重检测 ({} | 汉明距离={}, 阈值={})".format(
            status_text, ref_dup.hamming_distance, ref_dup.threshold,
        ), not ref_dup.is_duplicate))
    else:
        checks.append(("参考生视频 | 去重检测 (未执行)", False))

    # --- 通用 ---
    # AC10: 日志文件存在
    log_files = sorted(log_dir.glob("task_*.log")) if log_dir.exists() else []
    ac10 = len(log_files) > 0
    checks.append(("通用 | 关键流程日志 ({})".format(len(log_files)), ac10))

    # AC11: 输出目录有至少 2 个视频
    output_files = sorted(output_dir.rglob("*.mp4")) if output_dir.exists() else []
    ac11 = len(output_files) >= 2
    checks.append(("通用 | 输出目录有视频 ({})".format(len(output_files)), ac11))

    all_pass = all(r for _, r in checks)

    # ---- 打印验证结果表格 ----
    border = "=" * 60
    print("\n" + border)
    print("  验收标准验证 (Issue #09 + #14)")
    print(border)
    for label, passed in checks:
        icon = "PASS" if passed else "FAIL"
        print("  [{}]  {}".format(icon, label))
    print(border)
    if all_pass:
        print("  结果: 全部 {} 项验收标准通过!".format(len(checks)))
    else:
        failed = sum(1 for _, r in checks if not r)
        print("  结果: {} / {} 项通过, {} 项未通过".format(
            len(checks) - failed, len(checks), failed,
        ))
    print(border + "\n")

    return all_pass


# ============================================================
# 主流程
# ============================================================

def main():
    """程序入口函数。

    按阶段顺序执行：
        阶段 0: 素材清单展示
        阶段 1: 用户登录（mock HTTP）
        阶段 2: 图生视频管线
        阶段 3: 参考生视频管线
        阶段 4: 验收标准验证

    输出报告文件: _demo_scratch/report.txt
    """
    global _dirs

    # 初始化工作目录
    base_dir = Path(__file__).parent.parent / "_demo_scratch"
    config_dir = base_dir / "config"
    log_dir = base_dir / "logs"
    report_file = base_dir / "report.txt"

    # 清理上次运行遗留的工作目录
    if base_dir.exists():
        shutil.rmtree(base_dir)

    # 捕获所有输出用于写入报告文件
    _output_lines = []

    def _print(*args, **kwargs):
        """同时输出到控制台和报告文件的打印函数。"""
        line = " ".join(str(a) for a in args)
        _output_lines.append(line)
        try:
            print(*args, **kwargs)
        except UnicodeEncodeError:
            pass

    # 初始化日志记录器
    logger = Logger(log_dir)

    # 确保 local_config.json 存在于 config_dir
    _local_config_source = Path(__file__).parent / "config" / "local_config.json"
    if _local_config_source.exists() and not (config_dir / "local_config.json").exists():
        config_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(str(_local_config_source), str(config_dir / "local_config.json"))

    # ---- 阶段 0: 素材清单 ----
    border = "=" * 60
    _print(border)
    _print("  素材清单 — D:\\test 目录")
    _print(border)

    _print("\n素材任务ID: {}".format(MATERIAL_TASK_ID))

    # 展示素材文件（使用默认 D:/test 路径预览）
    _preview_dirs = _resolve_material_dirs(
        MaterialPathsConfig(), MATERIAL_TASK_ID, DEMO_MATERIAL_BASE,
    )
    _print("素材基目录: {}".format(_preview_dirs.base))

    # 打印各类型素材文件列表（预览阶段）
    img_files = _print_file_list("图片素材", _preview_dirs.image_dir, "*.jpg")
    vid_files = _print_file_list("视频素材", _preview_dirs.video_dir, "*.mp4")
    bgm_files = _print_file_list("BGM 素材", _preview_dirs.bgm_dir, "*.mp3")
    prepend_files = _print_file_list("前贴视频", _preview_dirs.prepend_dir, "*.mp4")
    append_files = _print_file_list("后贴视频", _preview_dirs.append_dir, "*.mp4")
    sticker_files = _print_file_list("贴纸素材", _preview_dirs.sticker_dir, "*.png")

    _print("\n输出目录: {}".format(_preview_dirs.output_dir))

    # ---- 清理上次运行残留 ----
    concat_trash = _preview_dirs.image_dir / "_concat_list.txt"
    if concat_trash.exists():
        concat_trash.unlink()
        _print("\n[清理] 已删除上次残留: {}".format(concat_trash))

    if _preview_dirs.output_dir.exists():
        for f in sorted(_preview_dirs.output_dir.rglob("*.mp4")):
            try:
                f.unlink()
            except OSError:
                pass
        if not any(_preview_dirs.output_dir.iterdir()):
            shutil.rmtree(str(_preview_dirs.output_dir), ignore_errors=True)
        _preview_dirs.output_dir.mkdir(parents=True, exist_ok=True)
        _print("[清理] 已清理上次残留输出文件")

    # ---- 阶段 1: 登录（mock HTTP）----
    _print("\n>>> 阶段 1: 用户登录 (Mock HTTP)")

    # 图生视频模式：创建 mock HTTP（共享 SERVER_CONFIG_STORE，任务列表仅含图生视频任务）
    http_img = _make_mock_http(SERVER_CONFIG_STORE, [TASK_IMAGE_TO_VIDEO])
    auth_img = AuthClient(base_url="http://mock-api", http_session=http_img, logger=logger)
    tokens_img = auth_img.login(username="demo_user", password="demo_pass")
    _print("  图生视频模式登录成功, access_token={}...".format(tokens_img.access_token[:30]))

    # 参考生视频模式：创建 mock HTTP（共享 SERVER_CONFIG_STORE，任务列表仅含参考生视频任务）
    http_ref = _make_mock_http(SERVER_CONFIG_STORE, [TASK_REFERENCE_VIDEO])
    auth_ref = AuthClient(base_url="http://mock-api", http_session=http_ref, logger=logger)
    tokens_ref = auth_ref.login(username="demo_user", password="demo_pass")
    _print("  参考生视频模式登录成功, access_token={}...".format(tokens_ref.access_token[:30]))

    # ---- 加载 local_config 并解析素材目录 ----
    config_sync_tmp = ConfigSync(
        base_url="http://mock-api", http_session=http_img,
        config_dir=config_dir, logger=logger,
    )
    config_manager_main = ConfigManager(syncer=config_sync_tmp, config_dir=config_dir, logger=logger)
    local_config = config_manager_main.load_local_config()
    _dirs = _resolve_material_dirs(local_config.material_paths, MATERIAL_TASK_ID, DEMO_MATERIAL_BASE)
    _print("\n[local_config] 素材路径已解析: base={}".format(_dirs.base))
    _print("  image_dir: {}".format(_dirs.image_dir))
    _print("  video_dir: {}".format(_dirs.video_dir))
    _print("  bgm_dir: {}".format(_dirs.bgm_dir))
    _print("  output_dir: {}".format(_dirs.output_dir))
    _print("  sticker_dir: {}".format(_dirs.sticker_dir))

    # ---- 阶段 2: 图生视频 ----
    _print("\n>>> 阶段 2: 图生视频管线 (真实 FFmpeg)")

    if not img_files:
        _print("  [跳过] 未找到图片素材")
        img_result = {"success": False, "error": "无图片素材"}
    else:
        img_result = run_image_to_video_pipeline(
            logger=logger,
            http=http_img,
            tokens=tokens_img,
            config_dir=config_dir,
            task_id=MATERIAL_TASK_ID,
            scratch_dir=base_dir / "temp",
            local_config=local_config,
            dirs=_dirs,
        )

    # ---- 阶段 3: 参考生视频 ----
    _print("\n>>> 阶段 3: 参考生视频管线 (真实 FFmpeg)")

    if not vid_files:
        _print("  [跳过] 未找到参考视频素材")
        ref_result = {"success": False, "error": "无参考视频", "audio_filters": []}
    else:
        ref_result = run_reference_video_pipeline(
            logger=logger,
            http=http_ref,
            tokens=tokens_ref,
            config_dir=config_dir,
            task_id=MATERIAL_TASK_ID,
            scratch_dir=base_dir / "temp",
            local_config=local_config,
            dirs=_dirs,
        )

    # ---- 阶段 4: 验收验证 ----
    _print("\n>>> 阶段 4: 验收标准验证")
    verify_acceptance_criteria(img_result, ref_result, log_dir, _dirs.output_dir)

    # ---- 输出文件清单 ----
    _print("\n生成的视频文件:")
    for vid_path in sorted(_dirs.output_dir.rglob("*.mp4")):
        size = vid_path.stat().st_size
        info = _get_mp4_info(vid_path)
        _print("  {} → {} ({})".format(
            vid_path.relative_to(_dirs.output_dir) if vid_path.is_relative_to(_dirs.output_dir) else vid_path,
            "{:,}B".format(size),
            _format_video_info(info),
        ))

    # ---- 重复检测评分摘要 ----
    img_dup = img_result.get("duplicate_result") if isinstance(img_result, dict) else None
    ref_dup = ref_result.get("duplicate_result") if isinstance(ref_result, dict) else None
    if img_dup is not None or ref_dup is not None:
        _print("\n重复检测评分:")
        if img_dup is not None:
            _print("  图生视频: 汉明距离={}, 阈值={}, 结果={}".format(
                img_dup.hamming_distance, img_dup.threshold,
                "重复" if img_dup.is_duplicate else "唯一",
            ))
        if ref_dup is not None:
            _print("  参考生视频: 汉明距离={}, 阈值={}, 结果={}".format(
                ref_dup.hamming_distance, ref_dup.threshold,
                "重复" if ref_dup.is_duplicate else "唯一",
            ))

    # ---- 日志文件 ----
    log_files = sorted(log_dir.glob("task_*.log"))
    if log_files:
        _print("\n日志文件:")
        for lf in log_files:
            _print("  {}".format(lf))
            content = lf.read_text(encoding="utf-8").strip()
            for line in content.splitlines()[-6:]:
                _print("    {}".format(line))

    # 写入报告文件
    _print("\n报告已写入: {}".format(report_file))
    report_file.write_text("\n".join(_output_lines), encoding="utf-8")


if __name__ == "__main__":
    main()
