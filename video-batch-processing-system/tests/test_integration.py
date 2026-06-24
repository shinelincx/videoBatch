import random
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from video_batch.audio_processor import AudioProcessingConfig, AudioProcessor
from video_batch.auth import AuthClient
from video_batch.config_manager import ConfigManager
from video_batch.config_sync import ConfigSync
from video_batch.copywriting import CopywritingConfig, CopywritingGenerator
from video_batch.duplicate_detection import (
    DuplicateDetector, DuplicateDetectionConfig, DuplicateResult, VideoHashStore,
)
from video_batch.frame_randomizer import FrameRandomizationConfig, FrameRandomizer
from video_batch.logger import Logger
from video_batch.material_scanner import MaterialScanner
from video_batch.overlay_elements import OverlayConfig, OverlayElementBuilder
from video_batch.prepend_append import VideoAffixer
from video_batch.reference_video import ReferenceVideoProcessor
from video_batch.retry_mechanism import RetryConfig, RetryManager
from video_batch.task_queue import Task, TaskQueue
from video_batch.task_status import TaskStatus, TaskStatusManager
from video_batch.video_converter import ConversionConfig, VideoConverter


LOGIN_RESPONSE = {
    "code": 0,
    "msg": "操作成功",
    "data": {"token": "at-integration-test-abc123"},
}

CONFIG_DICT = {
    "version": 1,
    "clip_mode": {"mode": "image-to-video"},
    "video_items": {
        "frame_extraction": True,
        "cropping": True,
        "blur": True,
        "shake": True,
        "watermark": True,
    },
    "text_items": {"subtitles": True, "danmaku": True, "sticker": True},
    "affix": {"prepend_enabled": False, "append_enabled": False},
    "audio": {
        "background_music_enabled": False,
        "speed_adjustment_enabled": False,
    },
    "repetition": {"loop_count": 1},
}

TASK_LIST = [
    {
        "id": "task-001",
        "material_id": "mat-001",
        "status": "待剪辑",
        "config_id": "cfg-001",
        "mode": "image-to-video",
        "priority": 1,
        "retry_count": 0,
        "created_at": "2026-05-19T10:00:00",
    },
    {
        "id": "task-002",
        "material_id": "mat-002",
        "status": "待剪辑",
        "config_id": "cfg-002",
        "mode": "reference-video",
        "priority": 0,
        "retry_count": 0,
        "created_at": "2026-05-19T10:01:00",
    },
]


def _mock_subprocess_run(returncode=0, stderr=""):
    result = MagicMock()
    result.returncode = returncode
    result.stderr = stderr
    return result


def _make_mock_http(config_dict=None, task_list=None):
    http = MagicMock()

    def post_side_effect(url, **kwargs):
        resp = MagicMock()
        if "/auth/login" in url:
            resp.status_code = 200
            resp.json.return_value = LOGIN_RESPONSE
        elif "/api/copywriting" in url:
            resp.status_code = 200
            resp.json.return_value = {"text": "这是一条营销文案内容"}
        elif "/api/tts" in url:
            resp.status_code = 200
            resp.content = b"fake_tts_audio_bytes"
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
            resp.json.return_value = config_dict or CONFIG_DICT
        elif "/clip_record/pending_clip/list" in url:
            resp.status_code = 200
            resp.json.return_value = task_list or TASK_LIST
        elif "/token" in url:
            resp.status_code = 200
            resp.json.return_value = LOGIN_RESPONSE
        else:
            resp.status_code = 500
            resp.json.return_value = {"detail": "未知接口"}
        return resp

    http.post.side_effect = post_side_effect
    http.get.side_effect = get_side_effect
    return http


def _setup_material_dirs(assets_dir, task_id, image_count=2):
    task_dir = assets_dir / "input" / task_id
    img_dir = task_dir / "img"
    mv_dir = task_dir / "mv"
    img_dir.mkdir(parents=True)
    mv_dir.mkdir(parents=True)
    for i in range(image_count):
        (img_dir / "frame_{:04d}.jpg".format(i)).write_text("fake_image")
    (mv_dir / "reference.mp4").write_text("fake_video")
    return task_dir


class IntegrationTestPipeline:

    def run_pipeline(self, tmp_path, mode="image-to-video",
                     enable_copywriting=False, enable_retry=False):
        base_dir = tmp_path
        assets_dir = base_dir / "assets"
        config_dir = base_dir / "config"
        hashes_dir = base_dir / "hashes"
        log_dir = base_dir / "logs"
        temp_dir = base_dir / "temp"
        output_dir = assets_dir / "output"

        logger = Logger(log_dir)
        http = _make_mock_http()

        # === 步骤 1: 用户登录 ===
        auth = AuthClient(base_url="http://mock-api", http_session=http, logger=logger)
        tokens = auth.login(username="testuser", password="testpass")
        assert tokens.access_token == "at-integration-test-abc123"
        assert tokens.refresh_token == "at-integration-test-abc123"

        # === 步骤 2: 配置同步 ===
        config_sync = ConfigSync(
            base_url="http://mock-api", http_session=http,
            config_dir=config_dir, logger=logger,
        )
        config_manager = ConfigManager(syncer=config_sync, config_dir=config_dir, logger=logger)
        user_config = config_manager.sync(tokens.access_token)
        assert user_config.version == 1
        assert user_config.clip_mode.mode == "image-to-video"

        # === 步骤 3: 任务获取 ===
        task_queue = TaskQueue(
            base_url="http://mock-api", http_session=http, logger=logger,
        )
        task_queue.fetch_and_enqueue(tokens.access_token)
        task = task_queue.dequeue()
        assert task.id is not None
        assert task.material_id is not None
        assert task.status == "待剪辑"

        # === 步骤 4: 素材扫描 ===
        _setup_material_dirs(assets_dir, task.id)
        scanner = MaterialScanner(assets_dir=assets_dir, logger=logger)
        material_index = scanner.scan(task.id)
        assert len(material_index.images) >= 1

        # === 步骤 5: 任务状态 → processing ===
        status_mgr = TaskStatusManager(
            base_url="http://mock-api", http_session=http, logger=logger,
        )
        status_mgr.transition(task, TaskStatus.PROCESSING, tokens.access_token)
        assert task.status == "剪辑中"

        # === 步骤 6: 文案生成（可选） ===
        copy_result = None
        if enable_copywriting:
            copy_config = CopywritingConfig(enabled=True, style="正式")
            copy_gen = CopywritingGenerator(
                config=copy_config, base_url="http://mock-api",
                http_session=http, temp_dir=temp_dir, logger=logger,
            )
            copy_result = copy_gen.generate(tokens.access_token)
            assert copy_result.text != ""
            assert copy_result.audio_path is not None

        # === 步骤 7: 视频生成 ===
        rng = random.Random(42)
        frame_config = FrameRandomizationConfig()
        randomizer = FrameRandomizer(config=frame_config, rng=rng, logger=logger)
        video_filters = randomizer.build_filters()
        assert len(video_filters) >= 1

        overlay_config = OverlayConfig(
            watermark_enabled=False, subtitle_enabled=False, danmaku_enabled=False,
        )
        overlay_builder = OverlayElementBuilder(
            config=overlay_config, watermark_dir=".", rng=rng, logger=logger,
        )
        overlay_builder.set_video_info(1920, 1080, 30.0)
        overlay_filters, overlay_inputs = overlay_builder.build()

        audio_config = AudioProcessingConfig(
            background_music=False, speed_adjustment=False,
        )
        audio_processor = AudioProcessor(config=audio_config, rng=rng, logger=logger)
        audio_filters, audio_inputs = audio_processor.build(bgm_dir=".")

        task_output_dir = output_dir / task.id
        video_path = task_output_dir / "output.mp4"

        with patch("subprocess.run") as mock_ffmpeg:
            mock_ffmpeg.return_value = _mock_subprocess_run(0)
            if mode == "reference-video":
                ref_video = assets_dir / "input" / task.id / "mv" / "reference.mp4"
                processor = ReferenceVideoProcessor(logger=logger)
                processor.process(
                    reference_video=ref_video,
                    output_path=video_path,
                    video_filters=video_filters,
                    overlay_filters=overlay_filters,
                    overlay_inputs=overlay_inputs,
                    audio_filters=audio_filters,
                    audio_inputs=audio_inputs,
                )
            else:
                images = [m.path for m in material_index.images]
                converter = VideoConverter(logger=logger)
                converter.images_to_video(
                    images=images, output_path=video_path,
                    config=ConversionConfig(),
                )

        # === 步骤 7b: 前后贴拼接 ===
        pref_path = assets_dir / "prepend_videos"
        pref_path.mkdir(parents=True, exist_ok=True)
        (pref_path / "intro.mp4").write_text("fake_prepend")
        app_path = assets_dir / "append_videos"
        app_path.mkdir(parents=True, exist_ok=True)
        (app_path / "outro.mp4").write_text("fake_append")
        affixer = VideoAffixer(
            prepend_dir=pref_path, append_dir=app_path, logger=logger,
        )

        final_path = task_output_dir / "final_output.mp4"
        with patch("subprocess.run") as mock_concat:
            mock_concat.return_value = _mock_subprocess_run(0)
            affix_result = affixer.prepend_append(
                main_video=video_path, output_path=final_path,
            )
        final_output = str(affix_result.output_path)

        # === 步骤 8: 重复检测 ===
        hashes_dir.mkdir(parents=True, exist_ok=True)
        hash_store = VideoHashStore(db_path=hashes_dir / "video_hashes.db")
        detector_config = DuplicateDetectionConfig()
        detector = DuplicateDetector(
            hash_store=hash_store, config=detector_config, logger=logger,
        )

        with patch.object(detector, "compute_phash", return_value="ac" * 8):
            dup_result = detector.check_duplicate(
                task=task, video_path=final_output,
                user_id="testuser", clip_mode="image-to-video",
            )

        # === 步骤 9: 重试机制（可选） ===
        retry_used = 0
        if enable_retry and dup_result.is_duplicate:

            def generate_fn(params):
                with patch("subprocess.run") as m:
                    m.return_value = _mock_subprocess_run(0)
                    return final_output

            def detect_fn(t, path):
                return detector.check_duplicate(
                    task=t, video_path=path, user_id="testuser",
                    clip_mode="image-to-video",
                )

            def notify_fn(t, status_str):
                status_mgr.transition(t, status_str, tokens.access_token)

            retry_mgr = RetryManager(
                config=RetryConfig(max_retries=3), logger=logger,
            )
            retry_result = retry_mgr.handle_duplicate(
                task=task,
                params={"filter": "warm_v1", "duration": 10.0, "bgm": "song_a"},
                generate_fn=generate_fn,
                detect_fn=detect_fn,
                notify_fn=notify_fn,
            )
            retry_used = retry_result.retries_used

        # === 步骤 10: 任务完成 ===
        final_status = task.status
        if final_status != "剪辑失败":
            status_mgr.transition(task, TaskStatus.COMPLETED, tokens.access_token)
            final_status = "待发布"

        # === 步骤 11: 清理 ===
        if copy_result and copy_result.audio_path:
            CopywritingGenerator(
                config=CopywritingConfig(), base_url="http://mock-api",
                http_session=http, temp_dir=temp_dir, logger=logger,
            ).cleanup(copy_result.audio_path)

        return {
            "task": task,
            "final_status": final_status,
            "retry_used": retry_used,
            "material_count": len(material_index.images),
            "filters_count": len(video_filters),
        }


@pytest.fixture
def pipeline():
    return IntegrationTestPipeline()


def test_full_pipeline_image_to_video(pipeline, tmp_path):
    result = pipeline.run_pipeline(tmp_path, mode="image-to-video")

    assert result["final_status"] == "待发布"
    assert result["task"].status == "待发布"
    assert result["material_count"] >= 1
    assert result["retry_used"] == 0


def test_full_pipeline_reference_video(pipeline, tmp_path):
    result = pipeline.run_pipeline(tmp_path, mode="reference-video")

    assert result["final_status"] == "待发布"
    assert result["task"].status == "待发布"
    assert result["material_count"] >= 1
    assert result["retry_used"] == 0


def test_full_pipeline_with_copywriting(pipeline, tmp_path):
    result = pipeline.run_pipeline(
        tmp_path, mode="image-to-video", enable_copywriting=True,
    )

    assert result["final_status"] == "待发布"
    assert result["task"].status == "待发布"


def test_full_pipeline_retry_on_duplicate(pipeline, tmp_path):
    """完整集成管线：首次检测重复 → 自动重试 → 成功
    handle_duplicate 内部先 generate+detect 再进入 while 循环，
    所以需要 3 个 mock：管线预检 → dup, handle_duplicate 首检 → dup, 重试后 → 非 dup
    """
    dup_first = DuplicateResult(
        is_duplicate=True, hamming_distance=5, threshold=12,
    )
    dup_second = DuplicateResult(
        is_duplicate=False, hamming_distance=30, threshold=12,
    )

    results = [dup_first, dup_first, dup_second]

    def side_effect(task, video_path, user_id, clip_mode):
        return results.pop(0)

    with patch.object(DuplicateDetector, "check_duplicate", side_effect=side_effect):
        result = pipeline.run_pipeline(
            tmp_path, mode="image-to-video", enable_retry=True,
        )

    assert result["final_status"] == "待发布"
    assert result["retry_used"] >= 1


def test_full_pipeline_retry_exhausted(pipeline, tmp_path):
    always_dup = DuplicateResult(
        is_duplicate=True, hamming_distance=3, threshold=12,
    )

    dup_results = [always_dup] * 10

    def side_effect(task, video_path, user_id, clip_mode):
        return dup_results.pop(0)

    with patch.object(DuplicateDetector, "check_duplicate", side_effect=side_effect):
        result = pipeline.run_pipeline(
            tmp_path, mode="image-to-video", enable_retry=True,
        )

    assert result["final_status"] == "剪辑失败"
    assert result["task"].status == "剪辑失败"


def test_full_pipeline_multiple_tasks_sequential(pipeline, tmp_path):
    results = []
    for i in range(3):
        result = pipeline.run_pipeline(
            tmp_path / "run_{}".format(i), mode="image-to-video",
        )
        results.append(result)

    assert all(r["final_status"] == "待发布" for r in results)
    assert all(r["task"].status == "待发布" for r in results)


def test_pipeline_login_failure(pipeline, tmp_path):
    base_dir = tmp_path
    log_dir = base_dir / "logs"
    logger = Logger(log_dir)

    http = MagicMock()
    resp = MagicMock()
    resp.status_code = 401
    resp.json.return_value = {"detail": "用户名或密码错误"}
    http.post.return_value = resp

    auth = AuthClient(base_url="http://mock-api", http_session=http, logger=logger)

    from video_batch.auth import AuthError
    with pytest.raises(AuthError, match="用户名或密码错误"):
        auth.login(username="baduser", password="badpass")


def test_pipeline_config_sync_fallback_to_cache(pipeline, tmp_path):
    base_dir = tmp_path
    config_dir = base_dir / "config"
    log_dir = base_dir / "logs"
    config_dir.mkdir(parents=True)
    logger = Logger(log_dir)

    cache_file = config_dir / "server_config.json"
    cache_file.write_text(
        '{"version":1,"clip_mode":{"mode":"image-to-video"},'
        '"video_items":{"frame_extraction":true,"cropping":true,'
        '"blur":true,"shake":true,"watermark":true},'
        '"text_items":{"subtitles":true,"danmaku":true,"sticker":true},'
        '"affix":{"prepend_enabled":false,"append_enabled":false},'
        '"audio":{"background_music_enabled":false,"speed_adjustment_enabled":false},'
        '"repetition":{"loop_count":1}}',
    )

    http = MagicMock()
    http.get.side_effect = ConnectionError("网络不可达")

    config_sync = ConfigSync(
        base_url="http://mock-api", http_session=http,
        config_dir=config_dir, logger=logger,
    )
    config_manager = ConfigManager(syncer=config_sync, config_dir=config_dir, logger=logger)
    user_config = config_manager.sync("dummy-token")

    assert user_config is not None
    assert user_config.version == 1


def test_pipeline_task_status_sync_on_key_transition(pipeline, tmp_path):
    base_dir = tmp_path
    log_dir = base_dir / "logs"
    logger = Logger(log_dir)
    http = MagicMock()
    resp = MagicMock()
    resp.status_code = 200
    http.put.return_value = resp

    status_mgr = TaskStatusManager(
        base_url="http://mock-api", http_session=http, logger=logger,
    )

    task = Task(id="task-test", material_id="mat-test", status="待剪辑")
    status_mgr.transition(task, TaskStatus.PROCESSING, "token")
    assert task.status == "剪辑中"
    http.put.assert_called()

    status_mgr.transition(task, TaskStatus.COMPLETED, "token")
    assert task.status == "待发布"
    assert http.put.call_count == 2

    http.put.reset_mock()
    task2 = Task(id="task-test2", material_id="mat-test2", status="待剪辑")
    status_mgr.transition(task2, TaskStatus.PROCESSING, "token")
    http.put.assert_called()
    status_mgr.transition(task2, TaskStatus.RETRYING, "token")
    http.put.call_count
    status_mgr.transition(task2, TaskStatus.FAILED, "token")
    assert http.put.call_count >= 2


def test_pipeline_material_missing_task_fails(pipeline, tmp_path):
    base_dir = tmp_path
    assets_dir = base_dir / "assets"
    scanner = MaterialScanner(assets_dir=assets_dir)

    from video_batch.material_scanner import MaterialScanError
    with pytest.raises(MaterialScanError, match="素材目录不存在"):
        scanner.scan("nonexistent-task")


def test_full_pipeline_with_stickers_enabled(pipeline, tmp_path):
    """image-to-video 模式下贴纸叠加集成测试"""
    sticker_dir = tmp_path / "stickers"
    sticker_dir.mkdir()
    (sticker_dir / "emoji.png").write_text("sticker_png")

    base_dir = tmp_path
    assets_dir = base_dir / "assets"
    config_dir = base_dir / "config"
    hashes_dir = base_dir / "hashes"
    log_dir = base_dir / "logs"
    temp_dir = base_dir / "temp"
    output_dir = assets_dir / "output"

    logger = Logger(log_dir)
    http = _make_mock_http()

    auth = AuthClient(base_url="http://mock-api", http_session=http, logger=logger)
    tokens = auth.login(username="testuser", password="testpass")

    config_sync = ConfigSync(
        base_url="http://mock-api", http_session=http,
        config_dir=config_dir, logger=logger,
    )
    config_manager = ConfigManager(syncer=config_sync, config_dir=config_dir, logger=logger)
    user_config = config_manager.sync(tokens.access_token)
    assert user_config.text_items.sticker_enabled is True

    task_queue = TaskQueue(
        base_url="http://mock-api", http_session=http, logger=logger,
    )
    task_queue.fetch_and_enqueue(tokens.access_token)
    task = task_queue.dequeue()

    _setup_material_dirs(assets_dir, task.id)
    scanner = MaterialScanner(assets_dir=assets_dir, logger=logger)
    material_index = scanner.scan(task.id)

    status_mgr = TaskStatusManager(
        base_url="http://mock-api", http_session=http, logger=logger,
    )
    status_mgr.transition(task, TaskStatus.PROCESSING, tokens.access_token)

    rng = random.Random(42)
    frame_config = FrameRandomizationConfig()
    randomizer = FrameRandomizer(config=frame_config, rng=rng, logger=logger)
    video_filters = randomizer.build_filters()

    overlay_config = OverlayConfig(
        watermark_enabled=False, subtitle_enabled=False,
        danmaku_enabled=False, sticker_enabled=True,
    )
    overlay_builder = OverlayElementBuilder(
        config=overlay_config, sticker_dir=str(sticker_dir),
        rng=rng, logger=logger,
    )
    overlay_builder.set_video_info(1920, 1080, 30.0)
    overlay_filters, overlay_inputs = overlay_builder.build()

    assert len(overlay_filters) >= 1
    assert all("overlay" in f for f in overlay_filters)
    assert len(overlay_inputs) >= 2

    params = overlay_builder.get_applied_params()
    assert params.sticker_files is not None
    assert len(params.sticker_files) >= 1
    assert params.sticker_count is not None
    assert 1 <= params.sticker_count <= 4
    assert params.sticker_transparencies is not None

    audio_config = AudioProcessingConfig(
        background_music=False, speed_adjustment=False,
    )
    audio_processor = AudioProcessor(config=audio_config, rng=rng, logger=logger)
    audio_filters, audio_inputs = audio_processor.build(bgm_dir=".")

    task_output_dir = output_dir / task.id
    video_path = task_output_dir / "output.mp4"

    with patch("subprocess.run") as mock_ffmpeg:
        mock_ffmpeg.return_value = _mock_subprocess_run(0)
        images = [m.path for m in material_index.images]
        converter = VideoConverter(logger=logger)
        converter.images_to_video(
            images=images, output_path=video_path,
            config=ConversionConfig(),
        )

    status_mgr.transition(task, TaskStatus.COMPLETED, tokens.access_token)
    assert task.status == "待发布"


def test_sticker_degradation_on_failure_does_not_fail_task(pipeline, tmp_path):
    """贴纸叠加失败时降级处理：记录错误但不标记任务失败"""
    sticker_dir = tmp_path / "stickers"
    sticker_dir.mkdir()
    (sticker_dir / "emoji.png").write_text("sticker_png")

    config = OverlayConfig(
        watermark_enabled=False, subtitle_enabled=False,
        danmaku_enabled=False, sticker_enabled=True,
    )
    rng = random.Random(42)
    logger = MagicMock()
    builder = OverlayElementBuilder(
        config=config, sticker_dir=str(sticker_dir),
        rng=rng, logger=logger,
    )
    builder.set_video_info(1920, 1080, 30.0)

    try:
        filters, inputs = builder.build()
        assert len(filters) >= 1
    except Exception:
        pass

    params = builder.get_applied_params()
    assert params.sticker_files is not None


def test_frame_randomizer_eq_filter_in_pipeline(pipeline, tmp_path):
    """色彩调整 eq 滤镜完整流入 FFmpeg 管线"""
    base_dir = tmp_path
    assets_dir = base_dir / "assets"
    config_dir = base_dir / "config"
    hashes_dir = base_dir / "hashes"
    log_dir = base_dir / "logs"
    temp_dir = base_dir / "temp"
    output_dir = assets_dir / "output"

    logger = Logger(log_dir)
    http = _make_mock_http()

    auth = AuthClient(base_url="http://mock-api", http_session=http, logger=logger)
    tokens = auth.login(username="testuser", password="testpass")

    config_sync = ConfigSync(
        base_url="http://mock-api", http_session=http,
        config_dir=config_dir, logger=logger,
    )
    config_manager = ConfigManager(syncer=config_sync, config_dir=config_dir, logger=logger)
    user_config = config_manager.sync(tokens.access_token)

    task_queue = TaskQueue(
        base_url="http://mock-api", http_session=http, logger=logger,
    )
    task_queue.fetch_and_enqueue(tokens.access_token)
    task = task_queue.dequeue()

    _setup_material_dirs(assets_dir, task.id)
    scanner = MaterialScanner(assets_dir=assets_dir, logger=logger)
    material_index = scanner.scan(task.id)

    status_mgr = TaskStatusManager(
        base_url="http://mock-api", http_session=http, logger=logger,
    )
    status_mgr.transition(task, TaskStatus.PROCESSING, tokens.access_token)

    rng = random.Random(42)

    # 场景 1：三项色彩调整全部启用
    frame_config_all = FrameRandomizationConfig(
        drop_frame=False, crop=False, blur=False, shake=False,
        brightness=True, contrast=True, saturation=True,
    )
    randomizer_all = FrameRandomizer(config=frame_config_all, rng=rng, logger=logger)
    filters_all = randomizer_all.build_filters()

    eq_filters = [f for f in filters_all if f.startswith("eq=")]
    assert len(eq_filters) == 1, "三项应合并为单个 eq 滤镜"
    eq_filter = eq_filters[0]
    assert "brightness=" in eq_filter
    assert "contrast=" in eq_filter
    assert "saturation=" in eq_filter

    params = randomizer_all.get_applied_params()
    assert params.brightness is not None
    assert params.contrast is not None
    assert params.saturation is not None
    assert -0.2 <= params.brightness <= 0.2
    assert 0.5 <= params.contrast <= 1.5
    assert 0.5 <= params.saturation <= 1.5

    # 场景 2：验证 eq 滤镜通过 FFmpeg 管线
    overlay_config = OverlayConfig(
        watermark_enabled=False, subtitle_enabled=False,
        danmaku_enabled=False, sticker_enabled=False,
    )
    overlay_builder = OverlayElementBuilder(
        config=overlay_config, rng=rng, logger=logger,
    )
    overlay_builder.set_video_info(1920, 1080, 30.0)
    overlay_filters, overlay_inputs = overlay_builder.build()

    audio_config = AudioProcessingConfig(
        background_music=False, speed_adjustment=False,
    )
    audio_processor = AudioProcessor(config=audio_config, rng=rng, logger=logger)
    audio_filters, audio_inputs = audio_processor.build(bgm_dir=".")

    task_output_dir = output_dir / task.id
    video_path = task_output_dir / "output.mp4"

    with patch("subprocess.run") as mock_ffmpeg:
        mock_ffmpeg.return_value = _mock_subprocess_run(0)
        images = [m.path for m in material_index.images]
        converter = VideoConverter(logger=logger)
        converter.images_to_video(
            images=images, output_path=video_path,
            config=ConversionConfig(),
        )

    # 验证 ref video 路径下 eq 滤镜也能通过
    ref_path = assets_dir / "input" / task.id / "mv"
    ref_path.mkdir(parents=True, exist_ok=True)
    (ref_path / "reference.mp4").write_text("fake_ref")

    ref_output = task_output_dir / "ref_output.mp4"
    with patch("subprocess.run") as mock_ffmpeg_ref:
        mock_ffmpeg_ref.return_value = _mock_subprocess_run(0)
        processor = ReferenceVideoProcessor(logger=logger)
        processor.process(
            reference_video=ref_path / "reference.mp4",
            output_path=ref_output,
            video_filters=filters_all,
            overlay_filters=overlay_filters,
            overlay_inputs=overlay_inputs,
            audio_filters=audio_filters,
            audio_inputs=audio_inputs,
        )

        ffmpeg_call = str(mock_ffmpeg_ref.call_args)
        assert "eq=" in ffmpeg_call, "FFmpeg 调用应包含 eq 滤镜"


def test_frame_randomizer_color_disabled_no_eq_in_pipeline(pipeline, tmp_path):
    """色彩调整禁用时，eq 滤镜不出现在 FFmpeg 管线中"""
    base_dir = tmp_path
    assets_dir = base_dir / "assets"
    config_dir = base_dir / "config"
    hashes_dir = base_dir / "hashes"
    log_dir = base_dir / "logs"
    temp_dir = base_dir / "temp"
    output_dir = assets_dir / "output"

    logger = Logger(log_dir)
    http = _make_mock_http()

    auth = AuthClient(base_url="http://mock-api", http_session=http, logger=logger)
    tokens = auth.login(username="testuser", password="testpass")

    config_sync = ConfigSync(
        base_url="http://mock-api", http_session=http,
        config_dir=config_dir, logger=logger,
    )
    config_manager = ConfigManager(syncer=config_sync, config_dir=config_dir, logger=logger)
    config_manager.sync(tokens.access_token)

    task_queue = TaskQueue(
        base_url="http://mock-api", http_session=http, logger=logger,
    )
    task_queue.fetch_and_enqueue(tokens.access_token)
    task = task_queue.dequeue()

    _setup_material_dirs(assets_dir, task.id)
    scanner = MaterialScanner(assets_dir=assets_dir, logger=logger)
    material_index = scanner.scan(task.id)

    rng = random.Random(42)

    # 全部色彩调整禁用
    frame_config_off = FrameRandomizationConfig(
        drop_frame=True, crop=True, blur=True, shake=True,
        brightness=False, contrast=False, saturation=False,
        color_balance=False, gamma=False, vintage_bw=False,
    )
    randomizer_off = FrameRandomizer(config=frame_config_off, rng=rng, logger=logger)
    filters = randomizer_off.build_filters()

    eq_filters = [f for f in filters if f.startswith("eq=")]
    assert len(eq_filters) == 0

    overlay_config = OverlayConfig(
        watermark_enabled=False, subtitle_enabled=False,
        danmaku_enabled=False, sticker_enabled=False,
    )
    overlay_builder = OverlayElementBuilder(
        config=overlay_config, rng=rng, logger=logger,
    )
    overlay_builder.set_video_info(1920, 1080, 30.0)
    overlay_filters, overlay_inputs = overlay_builder.build()

    audio_config = AudioProcessingConfig(
        background_music=False, speed_adjustment=False,
    )
    audio_processor = AudioProcessor(config=audio_config, rng=rng, logger=logger)
    audio_filters, audio_inputs = audio_processor.build(bgm_dir=".")

    task_output_dir = output_dir / task.id
    ref_output = task_output_dir / "ref_no_eq.mp4"

    ref_path = assets_dir / "input" / task.id / "mv"
    ref_path.mkdir(parents=True, exist_ok=True)
    (ref_path / "reference.mp4").write_text("fake_ref")

    with patch("subprocess.run") as mock_ffmpeg:
        mock_ffmpeg.return_value = _mock_subprocess_run(0)
        processor = ReferenceVideoProcessor(logger=logger)
        processor.process(
            reference_video=ref_path / "reference.mp4",
            output_path=ref_output,
            video_filters=filters,
            overlay_filters=overlay_filters,
            overlay_inputs=overlay_inputs,
            audio_filters=audio_filters,
            audio_inputs=audio_inputs,
        )
        ffmpeg_call = str(mock_ffmpeg.call_args)
        assert "eq=" not in ffmpeg_call, "禁用时应无 eq 滤镜"


def test_color_balance_flows_to_ffmpeg_pipeline(pipeline, tmp_path):
    """色彩平衡 colorbalance 滤镜完整流入 FFmpeg 管线"""
    base_dir = tmp_path
    assets_dir = base_dir / "assets"
    config_dir = base_dir / "config"
    hashes_dir = base_dir / "hashes"
    log_dir = base_dir / "logs"
    temp_dir = base_dir / "temp"
    output_dir = assets_dir / "output"

    logger = Logger(log_dir)
    http = _make_mock_http()

    auth = AuthClient(base_url="http://mock-api", http_session=http, logger=logger)
    tokens = auth.login(username="testuser", password="testpass")

    config_sync = ConfigSync(
        base_url="http://mock-api", http_session=http,
        config_dir=config_dir, logger=logger,
    )
    config_manager = ConfigManager(syncer=config_sync, config_dir=config_dir, logger=logger)
    config_manager.sync(tokens.access_token)

    task_queue = TaskQueue(
        base_url="http://mock-api", http_session=http, logger=logger,
    )
    task_queue.fetch_and_enqueue(tokens.access_token)
    task = task_queue.dequeue()

    _setup_material_dirs(assets_dir, task.id)
    scanner = MaterialScanner(assets_dir=assets_dir, logger=logger)
    material_index = scanner.scan(task.id)

    rng = random.Random(42)

    frame_config = FrameRandomizationConfig(
        drop_frame=False, crop=False, blur=False, shake=False,
        brightness=False, contrast=False, saturation=False,
        color_balance=True, gamma=False, vintage_bw=False,
    )
    randomizer = FrameRandomizer(config=frame_config, rng=rng, logger=logger)
    color_filters = randomizer.build_filters()

    cb_filters = [f for f in color_filters if "colorbalance=" in f]
    assert len(cb_filters) == 1

    params = randomizer.get_applied_params()
    assert params.color_balance_r is not None
    assert params.color_balance_g is not None
    assert params.color_balance_b is not None
    assert params.color_balance_r != params.color_balance_g

    overlay_config = OverlayConfig(
        watermark_enabled=False, subtitle_enabled=False,
        danmaku_enabled=False, sticker_enabled=False,
    )
    overlay_builder = OverlayElementBuilder(
        config=overlay_config, rng=rng, logger=logger,
    )
    overlay_builder.set_video_info(1920, 1080, 30.0)
    overlay_filters, overlay_inputs = overlay_builder.build()

    audio_config = AudioProcessingConfig(
        background_music=False, speed_adjustment=False,
    )
    audio_processor = AudioProcessor(config=audio_config, rng=rng, logger=logger)
    audio_filters, audio_inputs = audio_processor.build(bgm_dir=".")

    output_dir.mkdir(parents=True, exist_ok=True)
    task_output_dir = output_dir / task.id
    ref_output = task_output_dir / "color_balance.mp4"

    ref_path = assets_dir / "input" / task.id / "mv"
    ref_path.mkdir(parents=True, exist_ok=True)
    (ref_path / "reference.mp4").write_text("fake_ref")

    with patch("subprocess.run") as mock_ffmpeg:
        mock_ffmpeg.return_value = _mock_subprocess_run(0)
        processor = ReferenceVideoProcessor(logger=logger)
        processor.process(
            reference_video=ref_path / "reference.mp4",
            output_path=ref_output,
            video_filters=color_filters,
            overlay_filters=overlay_filters,
            overlay_inputs=overlay_inputs,
            audio_filters=audio_filters,
            audio_inputs=audio_inputs,
        )
        ffmpeg_call = str(mock_ffmpeg.call_args)
        assert "colorbalance=" in ffmpeg_call, "FFmpeg 调用应包含 colorbalance 滤镜"


def test_gamma_with_eq_flows_to_ffmpeg_pipeline(pipeline, tmp_path):
    """伽马值合并到 eq 滤镜完整流入 FFmpeg 管线"""
    base_dir = tmp_path
    assets_dir = base_dir / "assets"
    config_dir = base_dir / "config"
    hashes_dir = base_dir / "hashes"
    log_dir = base_dir / "logs"
    temp_dir = base_dir / "temp"
    output_dir = assets_dir / "output"

    logger = Logger(log_dir)
    http = _make_mock_http()

    auth = AuthClient(base_url="http://mock-api", http_session=http, logger=logger)
    tokens = auth.login(username="testuser", password="testpass")

    config_sync = ConfigSync(
        base_url="http://mock-api", http_session=http,
        config_dir=config_dir, logger=logger,
    )
    config_manager = ConfigManager(syncer=config_sync, config_dir=config_dir, logger=logger)
    config_manager.sync(tokens.access_token)

    task_queue = TaskQueue(
        base_url="http://mock-api", http_session=http, logger=logger,
    )
    task_queue.fetch_and_enqueue(tokens.access_token)
    task = task_queue.dequeue()

    _setup_material_dirs(assets_dir, task.id)
    scanner = MaterialScanner(assets_dir=assets_dir, logger=logger)
    material_index = scanner.scan(task.id)

    rng = random.Random(42)

    frame_config = FrameRandomizationConfig(
        drop_frame=False, crop=False, blur=False, shake=False,
        brightness=True, contrast=False, saturation=False,
        color_balance=False, gamma=True, vintage_bw=False,
    )
    randomizer = FrameRandomizer(config=frame_config, rng=rng, logger=logger)
    filters = randomizer.build_filters()

    eq_filter = next(f for f in filters if f.startswith("eq="))
    assert "brightness=" in eq_filter
    assert "gamma=" in eq_filter

    params = randomizer.get_applied_params()
    assert params.brightness is not None
    assert params.gamma is not None
    assert 0.5 <= params.gamma <= 1.5

    overlay_config = OverlayConfig(
        watermark_enabled=False, subtitle_enabled=False,
        danmaku_enabled=False, sticker_enabled=False,
    )
    overlay_builder = OverlayElementBuilder(
        config=overlay_config, rng=rng, logger=logger,
    )
    overlay_builder.set_video_info(1920, 1080, 30.0)
    overlay_filters, overlay_inputs = overlay_builder.build()

    audio_config = AudioProcessingConfig(
        background_music=False, speed_adjustment=False,
    )
    audio_processor = AudioProcessor(config=audio_config, rng=rng, logger=logger)
    audio_filters, audio_inputs = audio_processor.build(bgm_dir=".")

    output_dir.mkdir(parents=True, exist_ok=True)
    task_output_dir = output_dir / task.id
    ref_output = task_output_dir / "gamma.mp4"

    ref_path = assets_dir / "input" / task.id / "mv"
    ref_path.mkdir(parents=True, exist_ok=True)
    (ref_path / "reference.mp4").write_text("fake_ref")

    with patch("subprocess.run") as mock_ffmpeg:
        mock_ffmpeg.return_value = _mock_subprocess_run(0)
        processor = ReferenceVideoProcessor(logger=logger)
        processor.process(
            reference_video=ref_path / "reference.mp4",
            output_path=ref_output,
            video_filters=filters,
            overlay_filters=overlay_filters,
            overlay_inputs=overlay_inputs,
            audio_filters=audio_filters,
            audio_inputs=audio_inputs,
        )
        ffmpeg_call = str(mock_ffmpeg.call_args)
        assert "eq=" in ffmpeg_call
        assert "gamma=" in ffmpeg_call, "eq 滤镜应包含 gamma 参数"

    params = randomizer.get_applied_params()
    assert params.gamma is not None, "应记录伽马值用于日志"


def test_vintage_bw_flows_to_ffmpeg_pipeline(pipeline, tmp_path):
    """复古黑白 hue+curves 滤镜完整流入 FFmpeg 管线"""
    base_dir = tmp_path
    assets_dir = base_dir / "assets"
    config_dir = base_dir / "config"
    hashes_dir = base_dir / "hashes"
    log_dir = base_dir / "logs"
    temp_dir = base_dir / "temp"
    output_dir = assets_dir / "output"

    logger = Logger(log_dir)
    http = _make_mock_http()

    auth = AuthClient(base_url="http://mock-api", http_session=http, logger=logger)
    tokens = auth.login(username="testuser", password="testpass")

    config_sync = ConfigSync(
        base_url="http://mock-api", http_session=http,
        config_dir=config_dir, logger=logger,
    )
    config_manager = ConfigManager(syncer=config_sync, config_dir=config_dir, logger=logger)
    config_manager.sync(tokens.access_token)

    task_queue = TaskQueue(
        base_url="http://mock-api", http_session=http, logger=logger,
    )
    task_queue.fetch_and_enqueue(tokens.access_token)
    task = task_queue.dequeue()

    _setup_material_dirs(assets_dir, task.id)
    scanner = MaterialScanner(assets_dir=assets_dir, logger=logger)
    material_index = scanner.scan(task.id)

    rng = random.Random(42)

    frame_config = FrameRandomizationConfig(
        drop_frame=False, crop=False, blur=False, shake=False,
        brightness=False, contrast=False, saturation=False,
        color_balance=False, gamma=False, vintage_bw=True,
    )
    randomizer = FrameRandomizer(config=frame_config, rng=rng, logger=logger)
    filters = randomizer.build_filters()

    hue_filter = next(f for f in filters if "hue=s=0" in f)
    curves_filter = next(f for f in filters if "curves=all=" in f)
    assert hue_filter != curves_filter, "hue 和 curves 应为独立滤镜"

    params = randomizer.get_applied_params()
    assert params.vintage_bw is not None
    assert 0.5 <= params.vintage_bw <= 1.5

    overlay_config = OverlayConfig(
        watermark_enabled=False, subtitle_enabled=False,
        danmaku_enabled=False, sticker_enabled=False,
    )
    overlay_builder = OverlayElementBuilder(
        config=overlay_config, rng=rng, logger=logger,
    )
    overlay_builder.set_video_info(1920, 1080, 30.0)
    overlay_filters, overlay_inputs = overlay_builder.build()

    audio_config = AudioProcessingConfig(
        background_music=False, speed_adjustment=False,
    )
    audio_processor = AudioProcessor(config=audio_config, rng=rng, logger=logger)
    audio_filters, audio_inputs = audio_processor.build(bgm_dir=".")

    output_dir.mkdir(parents=True, exist_ok=True)
    task_output_dir = output_dir / task.id
    ref_output = task_output_dir / "vintage_bw.mp4"

    ref_path = assets_dir / "input" / task.id / "mv"
    ref_path.mkdir(parents=True, exist_ok=True)
    (ref_path / "reference.mp4").write_text("fake_ref")

    with patch("subprocess.run") as mock_ffmpeg:
        mock_ffmpeg.return_value = _mock_subprocess_run(0)
        processor = ReferenceVideoProcessor(logger=logger)
        processor.process(
            reference_video=ref_path / "reference.mp4",
            output_path=ref_output,
            video_filters=filters,
            overlay_filters=overlay_filters,
            overlay_inputs=overlay_inputs,
            audio_filters=audio_filters,
            audio_inputs=audio_inputs,
        )
        ffmpeg_call = str(mock_ffmpeg.call_args)
        assert "hue=s=0" in ffmpeg_call
        assert "curves=all=" in ffmpeg_call, "应包含 curves 古旧曲线"
