from pathlib import Path
from unittest.mock import MagicMock, patch

from video_batch.config_sync import (
    AffixToggleConfig,
    AudioToggleConfig,
    ClipDurationConfig,
    ClipModeConfig,
    RepetitionConfig,
    ServerConfig,
    TextItemConfig,
    VideoItemConfig,
)
from video_batch.generate_media import GeneratedMediaResult
from video_batch.gui.task_processor import TaskProcessorWorker
from video_batch.local_config import LocalConfig
from video_batch.gui.task_processor import _find_config_id_for_mode


def _server_config(
    subtitles=True,
    subtitles_mode="text",
    mode="reference-video",
    img_video_position="none",
    loop_count=1,
):
    return ServerConfig(
        version=1,
        clip_mode=ClipModeConfig(mode=mode, img_video_position=img_video_position),
        video_items=VideoItemConfig(
            frame_extraction=False,
            cropping=False,
            blur=False,
            shake=False,
            watermark=False,
        ),
        text_items=TextItemConfig(subtitles=subtitles, danmaku=False),
        subtitles_mode=subtitles_mode,
        affix=AffixToggleConfig(prepend_enabled=False, append_enabled=False),
        audio=AudioToggleConfig(
            background_music_enabled=False,
            speed_adjustment_enabled=False,
            pitch_enabled=False,
        ),
        repetition=RepetitionConfig(loop_count=loop_count),
        clip_duration=ClipDurationConfig(default_duration_per_image=2.0),
    )


def test_worker_generates_srt_and_mp3_when_subtitles_enabled(qapp, tmp_path):
    config_dir = tmp_path / "config"
    local_config_path = config_dir / "local_config.json"
    config_manager = MagicMock()
    config_manager._local_config_path = local_config_path
    config_manager.sync.return_value = _server_config(subtitles=True)
    config_manager.load_local_config.return_value = LocalConfig()

    material_index = MagicMock()
    material_index.images = []
    material_index.videos = [MagicMock(path=tmp_path / "ref.mp4")]
    material_index.is_empty.return_value = False

    srt_path = tmp_path / "generated.srt"
    mp3_path = tmp_path / "generated.mp3"
    generated = GeneratedMediaResult(srt_path=srt_path, mp3_path=mp3_path)

    worker = TaskProcessorWorker()
    worker.configure(
        logger=MagicMock(),
        config_manager=config_manager,
        material_dir=str(tmp_path),
        access_token="login-token",
        scratch_dir=tmp_path / "scratch",
    )

    captured_ctx = {}

    def run_pipeline(ctx):
        captured_ctx["ctx"] = ctx
        output = tmp_path / "out.mp4"
        output.write_text("video")
        return output

    with patch("video_batch.gui.task_processor.MaterialScanner") as scanner_cls, patch(
        "video_batch.gui.task_processor.GenerateApiConfig.load"
    ) as load_config, patch(
        "video_batch.gui.task_processor.GenerateMediaClient"
    ) as client_cls, patch(
        "video_batch.gui.task_processor.VideoEditingPipeline"
    ) as pipeline_cls:
        scanner_cls.return_value.scan.return_value = material_index
        load_config.return_value = MagicMock(base_url="http://generate.example")
        client_cls.return_value.generate.return_value = generated
        pipeline_cls.return_value.run.side_effect = run_pipeline

        worker._run_pipeline(
            MagicMock(
                id="task-001",
                productId="product-001",
                config_id="cfg-001",
                mode="reference-video",
                status="pending",
                productCategoryName="女装",
                productTitle="夏季纯棉套装",
            ),
        )

    load_config.assert_called_once_with(config_dir / "generate_api_config.json")
    _, client_kwargs = client_cls.call_args
    assert client_kwargs["base_url"] == "http://generate.example"
    client_cls.return_value.generate.assert_called_once()
    _, kwargs = client_cls.return_value.generate.call_args
    assert kwargs["task_id"] == "task-001"
    assert kwargs["product_id"] == "product-001"
    assert kwargs["config_id"] == "cfg-001"
    assert kwargs["duration"] == 0.0
    assert kwargs["category"] == "女装"
    assert kwargs["title"] == "夏季纯棉套装"
    assert kwargs["selling_points"] == "夏季纯棉套装"
    assert captured_ctx["ctx"].subtitle_srt_path == srt_path
    assert captured_ctx["ctx"].replacement_audio_path == mp3_path


def test_worker_skips_generate_when_subtitles_disabled(qapp, tmp_path):
    config_manager = MagicMock()
    config_manager._local_config_path = tmp_path / "config" / "local_config.json"
    config_manager.sync.return_value = _server_config(subtitles=False)
    config_manager.load_local_config.return_value = LocalConfig()

    material_index = MagicMock()
    material_index.images = []
    material_index.videos = [MagicMock(path=tmp_path / "ref.mp4")]
    material_index.is_empty.return_value = False

    worker = TaskProcessorWorker()
    worker.configure(
        logger=MagicMock(),
        config_manager=config_manager,
        material_dir=str(tmp_path),
        access_token="login-token",
        scratch_dir=tmp_path / "scratch",
    )

    with patch("video_batch.gui.task_processor.MaterialScanner") as scanner_cls, patch(
        "video_batch.gui.task_processor.GenerateMediaClient"
    ) as client_cls, patch(
        "video_batch.gui.task_processor.VideoEditingPipeline"
    ) as pipeline_cls:
        scanner_cls.return_value.scan.return_value = material_index
        output = tmp_path / "out.mp4"
        output.write_text("video")
        pipeline_cls.return_value.run.return_value = output

        worker._run_pipeline(
            MagicMock(
                id="task-001",
                productId="product-001",
                config_id="cfg-001",
                mode="reference-video",
                status="pending",
            ),
        )

    client_cls.assert_not_called()


def test_worker_derives_mode_from_config_when_task_mode_empty(qapp, tmp_path):
    config_manager = MagicMock()
    config_manager._local_config_path = tmp_path / "config" / "local_config.json"
    config_manager.sync.return_value = _server_config(
        subtitles=False,
        mode="image-to-video",
    )
    config_manager.load_local_config.return_value = LocalConfig()

    material_index = MagicMock()
    material_index.images = [MagicMock(path=tmp_path / "image.png")]
    material_index.videos = []
    material_index.is_empty.return_value = False

    worker = TaskProcessorWorker()
    worker.configure(
        logger=MagicMock(),
        config_manager=config_manager,
        material_dir=str(tmp_path),
        access_token="login-token",
        scratch_dir=tmp_path / "scratch",
    )

    captured_ctx = {}

    def run_pipeline(ctx):
        captured_ctx["ctx"] = ctx
        output = tmp_path / "out.mp4"
        output.write_text("video")
        return output

    with patch("video_batch.gui.task_processor.MaterialScanner") as scanner_cls, patch(
        "video_batch.gui.task_processor.VideoEditingPipeline"
    ) as pipeline_cls:
        scanner_cls.return_value.scan.return_value = material_index
        pipeline_cls.return_value.run.side_effect = run_pipeline

        worker._run_pipeline(
            MagicMock(
                id="task-001",
                productId="product-001",
                config_id="cfg-img-v2",
                mode="",
                status="pending",
            ),
        )

    assert captured_ctx["ctx"].task.mode == "image-to-video"


def test_worker_passes_first_image_when_subtitles_images_mode(qapp, tmp_path):
    config_dir = tmp_path / "config"
    local_config_path = config_dir / "local_config.json"
    config_manager = MagicMock()
    config_manager._local_config_path = local_config_path
    config_manager.sync.return_value = _server_config(
        subtitles=True,
        subtitles_mode="images",
    )
    config_manager.load_local_config.return_value = LocalConfig()

    first_image = tmp_path / "input" / "product-001" / "img" / "001.png"
    second_image = tmp_path / "input" / "product-001" / "img" / "002.png"
    material_index = MagicMock()
    material_index.images = [
        MagicMock(path=first_image),
        MagicMock(path=second_image),
    ]
    material_index.videos = [MagicMock(path=tmp_path / "ref.mp4")]
    material_index.is_empty.return_value = False

    generated = GeneratedMediaResult(
        srt_path=tmp_path / "generated.srt",
        mp3_path=tmp_path / "generated.mp3",
    )

    worker = TaskProcessorWorker()
    worker.configure(
        logger=MagicMock(),
        config_manager=config_manager,
        material_dir=str(tmp_path),
        access_token="login-token",
        scratch_dir=tmp_path / "scratch",
    )

    with patch("video_batch.gui.task_processor.MaterialScanner") as scanner_cls, patch(
        "video_batch.gui.task_processor.GenerateApiConfig.load"
    ), patch(
        "video_batch.gui.task_processor.GenerateMediaClient"
    ) as client_cls, patch(
        "video_batch.gui.task_processor.VideoEditingPipeline"
    ) as pipeline_cls:
        scanner_cls.return_value.scan.return_value = material_index
        client_cls.return_value.generate.return_value = generated
        output = tmp_path / "out.mp4"
        output.write_text("video")
        pipeline_cls.return_value.run.return_value = output

        worker._run_pipeline(
            MagicMock(
                id="task-001",
                productId="product-001",
                config_id="cfg-001",
                mode="reference-video",
                status="pending",
            ),
        )

    _, kwargs = client_cls.return_value.generate.call_args
    assert kwargs["image_path"] == first_image


def test_worker_generates_media_for_total_loop_duration_after_images(qapp, tmp_path):
    config_dir = tmp_path / "config"
    local_config_path = config_dir / "local_config.json"
    config_manager = MagicMock()
    config_manager._local_config_path = local_config_path
    config_manager.sync.return_value = _server_config(
        subtitles=True,
        img_video_position="after",
        loop_count=2,
    )
    config_manager.load_local_config.return_value = LocalConfig()

    material_index = MagicMock()
    material_index.images = [
        MagicMock(path=tmp_path / "img1.png"),
        MagicMock(path=tmp_path / "img2.png"),
    ]
    material_index.videos = [MagicMock(path=tmp_path / "ref.mp4")]
    material_index.is_empty.return_value = False

    generated = GeneratedMediaResult(
        srt_path=tmp_path / "generated.srt",
        mp3_path=tmp_path / "generated.mp3",
    )

    worker = TaskProcessorWorker()
    worker.configure(
        logger=MagicMock(),
        config_manager=config_manager,
        material_dir=str(tmp_path),
        access_token="login-token",
        scratch_dir=tmp_path / "scratch",
    )

    captured_ctx = {}

    def run_pipeline(ctx):
        captured_ctx["ctx"] = ctx
        output = tmp_path / "out.mp4"
        output.write_text("video")
        return output

    with patch("video_batch.gui.task_processor.MaterialScanner") as scanner_cls, patch(
        "video_batch.gui.task_processor.GenerateApiConfig.load"
    ) as load_config, patch(
        "video_batch.gui.task_processor.GenerateMediaClient"
    ) as client_cls, patch(
        "video_batch.gui.task_processor.VideoEditingPipeline"
    ) as pipeline_cls, patch.object(
        worker, "_probe_video_duration", return_value=10.25,
    ):
        scanner_cls.return_value.scan.return_value = material_index
        load_config.return_value = MagicMock(base_url="http://generate.example")
        client_cls.return_value.generate.return_value = generated
        pipeline_cls.return_value.run.side_effect = run_pipeline

        worker._run_pipeline(
            MagicMock(
                id="task-001",
                productId="product-001",
                config_id="cfg-001",
                mode="reference-video",
                status="pending",
            ),
        )

    _, kwargs = client_cls.return_value.generate.call_args
    assert kwargs["duration"] == 28.5
    assert captured_ctx["ctx"].generated_media_covers_loop_count is True


def test_find_config_id_for_mode_reads_cached_config_map(tmp_path):
    config_dir = tmp_path / "config"
    config_dir.mkdir()
    (config_dir / "server_config.json").write_text(
        """
        {
          "cfg-img-v2": {"clip_mode": {"mode": "image-to-video"}},
          "cfg-ref-v3": {"clip_mode": {"mode": "reference-video"}}
        }
        """,
        encoding="utf-8",
    )

    assert _find_config_id_for_mode(config_dir, "reference-video") == "cfg-ref-v3"
