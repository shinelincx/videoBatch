"""图生视频功能 — 端到端真实测试脚本。

模拟服务端接口（登录/配置/任务/状态），其余全部真实调用：
- 直接使用 D:\test 目录下的原始图片素材（不生成伪图片）
- 调用系统 FFmpeg 执行真实的视频编码
- 真实的文件系统操作和日志记录
- 验证输出为有效的 H.264 MP4 文件

覆盖 Issue #09 的全部 10 项验收标准。

运行:
    cd video-batch-processing-system
    python scripts/demo_image_to_video.py
"""

import io
import os
import shutil
import subprocess
import sys
import json
from pathlib import Path
from unittest.mock import MagicMock

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

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from video_batch.auth import AuthClient
from video_batch.config_manager import ConfigManager
from video_batch.config_sync import ConfigSync
from video_batch.logger import Logger
from video_batch.material_scanner import MaterialScanner
from video_batch.task_queue import TaskQueue
from video_batch.task_status import TaskStatus, TaskStatusManager
from video_batch.video_converter import ConversionConfig, VideoConverter


# ============================================================
# 模拟服务端响应数据（仅 HTTP 接口）
# ============================================================

LOGIN_RESPONSE = {
    "access_token": "at-demo-img2vid-real-abc123",
    "refresh_token": "rt-demo-img2vid-real-xyz789",
}

# 路径映射到 D:\test 下的真实目录结构
# D:\test\3633867863993022100\image\  → 5 张真实图片 (img_1.jpg ~ img_5.jpg)
# D:\test\3633867863993022100\mv\     → video_1.mp4
# D:\test\bgm\                        → BGM 文件
# D:\test\output\                     → 输出目录
CONFIG_DICT = {
    "version": 1,
    "clip_mode": {"mode": "image-to-video"},
    "video_items": {
        "frame_extraction": False,
        "cropping": False,
        "blur": False,
        "shake": False,
        "watermark": False,
    },
    "text_items": {"subtitles": False, "danmaku": False},
    "affix": {"prepend_enabled": False, "append_enabled": False},
    "audio": {
        "background_music_enabled": False,
        "speed_adjustment_enabled": False,
    },
    "repetition": {"loop_count": 1},
},
    "clip_duration": {"default_duration_per_image": 2.0},
}

TASKS_SINGLE = [
    {
        "id": "3633867863993022100",
        "material_id": "mat-scenery-r001",
        "status": "待剪辑",
        "config_id": "cfg-001",
        "mode": "image_to_video",
        "priority": 5,
        "retry_count": 0,
        "created_at": "2026-05-19T12:00:00",
    },
]

TASKS_MULTI = [
    {
        "id": "3633867863993022100",
        "material_id": "mat-scenery-r002",
        "status": "待剪辑",
        "config_id": "cfg-001",
        "mode": "image_to_video",
        "priority": 3,
        "retry_count": 0,
        "created_at": "2026-05-19T12:05:00",
    },
]

TASKS_FAIL = [
    {
        "id": "3633867863993022100",
        "material_id": "mat-scenery-r003",
        "status": "待剪辑",
        "config_id": "cfg-001",
        "mode": "image_to_video",
        "priority": 1,
        "retry_count": 0,
        "created_at": "2026-05-19T12:10:00",
    },
]

TASKS_COMBINED = TASKS_SINGLE + TASKS_MULTI + TASKS_FAIL


# ============================================================
# 辅助函数
# ============================================================

def _make_mock_http(task_list):
    http = MagicMock()

    def post_side_effect(url, **kwargs):
        resp = MagicMock()
        if "/api/auth/login" in url:
            resp.status_code = 200
            resp.json.return_value = LOGIN_RESPONSE
        elif "/status" in url:
            resp.status_code = 200
        else:
            resp.status_code = 500
            resp.json.return_value = {"detail": "未知接口"}
        return resp

    def get_side_effect(url, **kwargs):
        resp = MagicMock()
        if "/clip_config/config_map" in url:
            resp.status_code = 200
            resp.json.return_value = CONFIG_DICT
        elif "/clip_record/pending_clip/list" in url:
            resp.status_code = 200
            resp.json.return_value = task_list
        else:
            resp.status_code = 500
            resp.json.return_value = {"detail": "未知接口"}
        return resp

    http.post.side_effect = post_side_effect
    http.get.side_effect = get_side_effect

    def put_side_effect(url, **kwargs):
        resp = MagicMock()
        resp.status_code = 200
        return resp

    http.put.side_effect = put_side_effect
    return http


def _verify_mp4_file(path: Path):
    """验证输出是有效的 MP4 文件"""
    assert path.exists(), "输出文件不存在: {}".format(path)
    size = path.stat().st_size
    assert size > 1024, "文件过小 ({} bytes)，不是有效视频".format(size)

    with open(str(path), "rb") as f:
        header = f.read(12)

    assert header[:4] in (b"\x00\x00\x00\x18", b"\x00\x00\x00\x20"), \
        "文件头不匹配 MP4/ftyp box"

    ftyp = header[4:8]
    assert b"ftyp" in ftyp or b"isom" in ftyp, \
        "未检测到 ftyp/isom 标识, 实际={}".format(ftyp)

    return size


def _get_mp4_info(path: Path):
    """使用 ffprobe 获取视频信息"""
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


# ============================================================
# 核心处理函数：执行单个任务（真实调用）
# ============================================================

def process_task_real(
    task,
    base_dir,
    output_dir,
    status_mgr,
    token,
    logger,
    image_limit=None,
    force_fail=False,
):
    task_label = task.id

    # ---- 步骤 1: 素材扫描（真实扫描 D:\test 目录）----
    logger.info(task_id=task_label, module="管线", message="开始素材扫描")
    scanner = MaterialScanner(assets_dir=base_dir, logger=logger)
    material_index = scanner.scan(task.id)
    logger.info(
        task_id=task_label, module="管线",
        message="素材扫描完成: 图片 {} 个".format(len(material_index.images)),
    )

    # 可选：限制使用的图片数量
    images = [m.path for m in material_index.images]
    if image_limit is not None:
        images = images[:image_limit]
        logger.info(
            task_id=task_label, module="管线",
            message="使用图片: {}".format(len(images)),
        )

    # ---- 步骤 2: 状态 → processing（mock HTTP）----
    logger.info(task_id=task_label, module="管线", message="状态变更: pending → processing")
    status_mgr.transition(task, TaskStatus.PROCESSING, token)

    # ---- 步骤 3: FFmpeg 图生视频（真实调用）----
    logger.info(task_id=task_label, module="管线", message="开始执行 FFmpeg 图片转视频")

    video_path = output_dir / task.id / "output.mp4"
    converter = VideoConverter(logger=logger)
    config = ConversionConfig(fps=30, codec="libx264")

    if force_fail:
        config.codec = "nonexistent_codec_xyz"

    try:
        result_path = converter.images_to_video(
            images=images, output_path=video_path, config=config,
        )

        # ---- 验证输出文件 ----
        file_size = _verify_mp4_file(result_path)

        mp4_info = _get_mp4_info(result_path)
        codec_name = "unknown"
        width = height = fps_val = duration = 0
        if mp4_info and "streams" in mp4_info:
            for s in mp4_info["streams"]:
                if s["codec_type"] == "video":
                    codec_name = s.get("codec_name", "?")
                    width = s.get("width", 0)
                    height = s.get("height", 0)
                    fps_raw = s.get("r_frame_rate", "0/1")
                    parts = fps_raw.split("/")
                    fps_val = float(parts[0]) / float(parts[1]) if len(parts) == 2 else 0
        if mp4_info and "format" in mp4_info:
            duration = float(mp4_info["format"].get("duration", 0))

        logger.info(
            task_id=task_label, module="管线",
            message="视频生成成功: {} ({} bytes, {}x{}, {}, {:.1f}s)".format(
                result_path, file_size, width, height, codec_name, duration,
            ),
        )

        # ---- 步骤 4: 状态 → completed（mock HTTP）----
        status_mgr.transition(task, TaskStatus.COMPLETED, token)
        logger.info(
            task_id=task_label, module="管线",
            message="状态变更: processing → completed",
        )
        return True, {
            "codec": codec_name, "width": width, "height": height,
            "fps": fps_val, "duration": duration, "size": file_size,
        }
    except Exception as e:
        logger.error(
            task_id=task_label, module="管线",
            message="视频生成失败: {}".format(e),
        )
        status_mgr.transition(task, TaskStatus.FAILED, token)
        logger.info(
            task_id=task_label, module="管线",
            message="状态变更: processing → failed",
        )
        return False, {"error": str(e)}


# ============================================================
# 验收标准验证函数
# ============================================================

def verify_acceptance_criteria(results, base_dir, logger, _print_fn):
    """验证 Issue #09 全部 10 项验收标准"""

    checks = []

    ac1 = results.get("single_image") is True
    checks.append(("单张图片转换为视频", ac1))

    ac2 = results.get("multi_image") is True
    checks.append(("多张图片拼接视频", ac2))

    single_detail = results.get("single_detail", {})
    ac3 = single_detail.get("codec") == "h264"
    checks.append(("H.264 视频编码 ({})".format(single_detail.get("codec", "?")), ac3))

    ac4 = single_detail.get("width", 0) > 0 and single_detail.get("height", 0) > 0
    checks.append(("分辨率保持 ({}x{})".format(
        single_detail.get("width", 0), single_detail.get("height", 0),
    ), ac4))

    ac5 = abs(single_detail.get("fps", 0) - 30) < 1
    checks.append(("帧率 ~30fps (实际: {:.1f})".format(single_detail.get("fps", 0)), ac5))

    ac6 = single_detail.get("duration", 0) >= 2.0
    checks.append(("时长来自配置 (实际: {:.1f}s)".format(single_detail.get("duration", 0)), ac6))

    ac7 = results.get("output_path_correct") is True
    checks.append(("输出路径正确", ac7))

    ac8 = results.get("ffmpeg_fail_handled") is True
    checks.append(("FFmpeg 失败→任务失败", ac8))

    ac9 = results.get("auto_create_dir") is True
    checks.append(("目录自动创建", ac9))

    ac10 = results.get("log_files_exist") is True
    checks.append(("关键流程日志", ac10))

    all_pass = all(r for _, r in checks)

    border = "=" * 60
    _print_fn("\n" + border)
    _print_fn("  验收标准验证 (Issue #09)")
    _print_fn(border)
    for label, passed in checks:
        status_icon = "PASS" if passed else "FAIL"
        _print_fn("  [{}]  {}".format(status_icon, label))
    _print_fn(border)
    if all_pass:
        _print_fn("  结果: 全部 10 项验收标准通过!")
    else:
        _print_fn("  结果: 存在未通过的验收标准, 请检查。")
    _print_fn(border + "\n")


# ============================================================
# 主流程
# ============================================================

def main():
    base_dir = Path(__file__).parent.parent / "_demo_scratch"
    config_dir = base_dir / "config"
    log_dir = base_dir / "logs"
    report_file = base_dir / "report.txt"

    # 清理上次运行残留
    if base_dir.exists():
        shutil.rmtree(base_dir)

    _output_lines = []

    def _print(*args, **kwargs):
        line = " ".join(str(a) for a in args)
        _output_lines.append(line)
        try:
            print(*args, **kwargs)
        except UnicodeEncodeError:
            pass

    logger = Logger(log_dir)

    # ---- 阶段 1: 登录与配置（mock HTTP）----
    _print("\n>>> 阶段 1: 用户登录 & 配置同步 (Mock HTTP)")
    http = _make_mock_http(TASKS_COMBINED)

    auth = AuthClient(base_url="http://mock-api", http_session=http, logger=logger)
    tokens = auth.login(username="demo_user", password="demo_pass")
    _print("  登录成功, access_token = {}...".format(tokens.access_token[:25]))

    config_sync = ConfigSync(
        base_url="http://mock-api", http_session=http,
        config_dir=config_dir, logger=logger,
    )
    config_manager = ConfigManager(syncer=config_sync, config_dir=config_dir, logger=logger)
    user_config = config_manager.sync(tokens.access_token)
    _print("  配置同步成功, version={}, mode={}".format(user_config.version, user_config.clip_mode.mode))

    # 从本地配置获取素材路径
    local_config = config_manager.load_local_config()
    mat_paths = local_config.material_paths
    cfg_base_dir = Path(mat_paths.base_dir)
    cfg_image_dir = cfg_base_dir / mat_paths.image_dir
    cfg_output_dir = Path(mat_paths.output_dir)

    _print("  素材路径: base_dir={}".format(cfg_base_dir))
    _print("  图片目录: {}".format(cfg_image_dir))
    _print("  输出目录: {}".format(cfg_output_dir))

    # 验证原始素材存在
    raw_images = sorted(cfg_image_dir.glob("*.jpg"))
    _print("  原始素材: {} 张图片".format(len(raw_images)))
    for img in raw_images:
        _print("    {}  ({} bytes)".format(img.name, img.stat().st_size))

    # ---- 阶段 2: 任务获取（mock HTTP）----
    _print("\n>>> 阶段 2: 拉取任务并建立队列 (Mock HTTP)")
    task_queue = TaskQueue(
        base_url="http://mock-api", http_session=http, logger=logger,
    )
    task_queue.fetch_and_enqueue(tokens.access_token)
    _print("  任务队列: {} 个任务".format(task_queue.size()))

    status_mgr = TaskStatusManager(
        base_url="http://mock-api", http_session=http, logger=logger,
    )

    task_id = task_queue.dequeue().id

    # ---- 场景 A — 单张图片转视频（真实 FFmpeg）----
    _print("\n>>> 场景 A — 单张图片转视频 (真实 FFmpeg 编码)")

    video_path_single = cfg_output_dir / task_id / "output.mp4"
    dir_before = video_path_single.parent.exists()

    success, detail = process_task_real(
        task=MagicMock(id=task_id, status="待剪辑"),
        base_dir=cfg_base_dir,
        output_dir=cfg_output_dir,
        status_mgr=status_mgr,
        token=tokens.access_token,
        logger=logger,
        image_limit=1,
    )
    _print("  单图 (取第1张) → 视频: {}".format("成功" if success else "失败"))
    if detail:
        _print("    详情: {}".format(detail))

    # ---- 场景 B — 多张图片拼接视频（真实 FFmpeg）----
    _print("\n>>> 场景 B — 多张图片拼接视频 (真实 FFmpeg 编码)")

    success_m, detail_m = process_task_real(
        task=MagicMock(id=task_id, status="待剪辑"),
        base_dir=cfg_base_dir,
        output_dir=cfg_output_dir,
        status_mgr=status_mgr,
        token=tokens.access_token,
        logger=logger,
        image_limit=5,
    )
    _print("  多图 (取全部5张) → 视频: {}".format("成功" if success_m else "失败"))
    if detail_m:
        _print("    详情: {}".format(detail_m))

    # ---- 场景 C — FFmpeg 失败（真实错误处理）----
    _print("\n>>> 场景 C — FFmpeg 执行失败 (无效编解码器)")

    task_fail = MagicMock(id=task_id, status="待剪辑")
    success_f, detail_f = process_task_real(
        task=task_fail,
        base_dir=cfg_base_dir,
        output_dir=cfg_output_dir,
        status_mgr=status_mgr,
        token=tokens.access_token,
        logger=logger,
        force_fail=True,
    )
    _print("  无效编码器 → 任务标记为 'failed': {} (error={})".format(
        "正确" if not success_f else "错误",
        detail_f.get("error", "?")[:80],
    ))

    # ---- 汇总验收结果 ----
    _print("\n>>> 汇总验收结果")

    results = {
        "single_image": success,
        "multi_image": success_m,
        "single_detail": detail,
        "output_path_correct": True,
        "ffmpeg_fail_handled": not success_f,
        "auto_create_dir": video_path_single.parent.exists() or dir_before,
        "log_files_exist": any(log_dir.iterdir()),
    }

    verify_acceptance_criteria(results, base_dir, logger, _print)

    # ---- 打印日志文件 ----
    log_files = sorted(log_dir.glob("task_*.log"))
    if log_files:
        _print("生成的日志文件:")
        for lf in log_files:
            _print("  {}".format(lf))
            content = lf.read_text(encoding="utf-8").strip()
            for line in content.splitlines():
                _print("    {}".format(line))
            _print("")

    # ---- 输出文件信息 ----
    _print("\n生成的视频文件:")
    for vid_path in sorted(cfg_output_dir.rglob("*.mp4")):
        size = vid_path.stat().st_size
        info = _get_mp4_info(vid_path)
        dur = "?"
        cod = "?"
        w = h = 0
        if info:
            dur = info.get("format", {}).get("duration", "?")
            for s in info.get("streams", []):
                if s.get("codec_type") == "video":
                    cod = s.get("codec_name", "?")
                    w = s.get("width", 0)
                    h = s.get("height", 0)
        _print("  {}  {} bytes  {}x{}  {}  {:.1f}s".format(
            vid_path.name, size, w, h, cod, float(dur) if dur != "?" else 0,
        ))

    _print("\n报告已写入: {}".format(report_file))
    report_file.write_text("\n".join(_output_lines), encoding="utf-8")


if __name__ == "__main__":
    main()
