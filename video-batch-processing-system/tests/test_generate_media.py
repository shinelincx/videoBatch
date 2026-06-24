from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from video_batch.generate_media import (
    GenerateApiConfig,
    GenerateApiConfigError,
    GenerateMediaClient,
    GenerateMediaError,
    build_generate_duration,
)


def _response(status_code=200, json_data=None):
    resp = MagicMock()
    resp.status_code = status_code
    resp.json.return_value = json_data or {}
    resp.text = "body"
    return resp


def _config(**overrides):
    data = {
        "api_token": "token-123",
        "oss": {
            "access_key_id": "ak",
            "access_key_secret": "sk",
            "endpoint": "https://oss-cn-test.aliyuncs.com",
            "bucket": "bucket-name",
        },
    }
    data.update(overrides)
    return GenerateApiConfig.from_dict(data)


def _mock_local_generators():
    speech_patch = patch("video_batch.generate_media.generate_speech")
    srt_patch = patch("video_batch.generate_media.generate_srt")
    speech = speech_patch.start()
    srt = srt_patch.start()
    speech.return_value = [{"text": "copy", "offset": 0, "duration": 10_000_000}]
    srt.side_effect = lambda _boundaries, output_path, _language: Path(output_path).write_text(
        "1\n00:00:00,000 --> 00:00:01,000\ncopy\n\n",
        encoding="utf-8",
    )
    return speech_patch, srt_patch, speech, srt


def test_load_generate_api_config(tmp_path):
    config_path = tmp_path / "generate_api_config.json"
    config_path.write_text(
        """
        {
          "base_url": "http://generate.example:9000/",
          "api_token": "token-123",
          "copy_endpoint": "/custom/copy",
          "image_copy_endpoint": "/custom/copy/images",
          "oss": {
            "access_key_id": "ak",
            "access_key_secret": "sk",
            "endpoint": "https://oss-cn-test.aliyuncs.com",
            "bucket": "bucket-name"
          }
        }
        """,
        encoding="utf-8",
    )

    config = GenerateApiConfig.load(config_path)

    assert config.api_token == "token-123"
    assert config.base_url == "http://generate.example:9000"
    assert config.copy_endpoint == "/custom/copy"
    assert config.image_copy_endpoint == "/custom/copy/images"
    assert config.oss.access_key_id == "ak"
    assert config.oss.bucket == "bucket-name"


def test_load_generate_api_config_defaults_base_url_and_v2_endpoints(tmp_path):
    config_path = tmp_path / "generate_api_config.json"
    config_path.write_text(
        """
        {
          "api_token": "token-123",
          "oss": {
            "access_key_id": "ak",
            "access_key_secret": "sk",
            "endpoint": "https://oss-cn-test.aliyuncs.com",
            "bucket": "bucket-name"
          }
        }
        """,
        encoding="utf-8",
    )

    config = GenerateApiConfig.load(config_path)

    assert config.base_url == "http://localhost:8000"
    assert config.copy_endpoint == "/api/v2/generate-copy"
    assert config.image_copy_endpoint == "/api/v2/generate-copy/images"


def test_load_generate_api_config_normalizes_blank_base_url(tmp_path):
    config = GenerateApiConfig.from_dict(
        {
            "base_url": "   ",
            "api_token": "token-123",
            "oss": {
                "access_key_id": "ak",
                "access_key_secret": "sk",
                "endpoint": "https://oss-cn-test.aliyuncs.com",
                "bucket": "bucket-name",
            },
        },
    )

    assert config.base_url == "http://localhost:8000"


def test_load_generate_api_config_requires_token(tmp_path):
    config_path = tmp_path / "generate_api_config.json"
    config_path.write_text(
        """
        {
          "api_token": "",
          "oss": {
            "access_key_id": "ak",
            "access_key_secret": "sk",
            "endpoint": "https://oss-cn-test.aliyuncs.com",
            "bucket": "bucket-name"
          }
        }
        """,
        encoding="utf-8",
    )

    with pytest.raises(GenerateApiConfigError, match="api_token"):
        GenerateApiConfig.load(config_path)


def test_generate_client_posts_v2_copy_and_generates_local_srt_and_mp3(tmp_path):
    config = _config()
    http = MagicMock()
    http.post.return_value = _response(200, {"marketing_copy": {"text": "copy text"}})
    speech_patch, srt_patch, speech, srt = _mock_local_generators()

    try:
        with patch("video_batch.generate_media.oss2.Bucket") as bucket_cls:
            client = GenerateMediaClient(
                config=config,
                base_url="http://localhost:8000",
                http_session=http,
                scratch_dir=tmp_path,
            )
            result = client.generate(
                task_id="task-001",
                product_id="product-001",
                config_id="cfg-001",
                duration=12.5,
            )
    finally:
        speech_patch.stop()
        srt_patch.stop()

    args, kwargs = http.post.call_args
    assert args[0] == "http://localhost:8000/api/v2/generate-copy"
    assert kwargs["headers"]["Authorization"] == "Bearer token-123"
    assert kwargs["json"]["category"] == GenerateMediaClient.CATEGORY
    assert kwargs["json"]["title"] == GenerateMediaClient.TITLE
    assert kwargs["json"]["selling_points"] == GenerateMediaClient.SELLING_POINTS
    assert kwargs["json"]["duration"] == 13
    assert kwargs["json"]["platform"] == GenerateMediaClient.PLATFORM
    assert kwargs["json"]["language"] == "zh"
    assert kwargs["json"]["voice"] == ""

    assert speech.call_args.kwargs["text"] == "copy text"
    assert speech.call_args.kwargs["output_path"].name == "generated_task-001.mp3"
    assert srt.call_args.args[0] == speech.return_value
    assert srt.call_args.args[1].name == "generated_task-001.srt"
    bucket_cls.assert_not_called()
    assert result.srt_path.name == "generated_task-001.srt"
    assert result.mp3_path.name == "generated_task-001.mp3"
    assert result.srt_path.exists()


def test_generate_client_accepts_top_level_text_response(tmp_path):
    config = _config()
    http = MagicMock()
    http.post.return_value = _response(200, {"text": "top-level copy"})
    speech_patch, srt_patch, speech, _srt = _mock_local_generators()

    try:
        client = GenerateMediaClient(
            config=config,
            base_url="http://localhost:8000",
            http_session=http,
            scratch_dir=tmp_path,
        )
        result = client.generate(
            task_id="task-001",
            product_id="product-001",
            config_id="cfg-001",
            duration=12.5,
        )
    finally:
        speech_patch.stop()
        srt_patch.stop()

    assert result.mp3_path.name == "generated_task-001.mp3"
    assert speech.call_args.kwargs["text"] == "top-level copy"


def test_generate_client_uses_configured_v2_endpoints(tmp_path):
    config = _config(copy_endpoint="/copy/custom")
    http = MagicMock()
    http.post.return_value = _response(200, {"text": "copy"})
    speech_patch, srt_patch, _speech, _srt = _mock_local_generators()

    try:
        client = GenerateMediaClient(
            config=config,
            base_url="http://localhost:8000",
            http_session=http,
            scratch_dir=tmp_path,
        )
        client.generate(
            task_id="task-001",
            product_id="product-001",
            config_id="cfg-001",
            duration=12.5,
        )
    finally:
        speech_patch.stop()
        srt_patch.stop()

    assert http.post.call_args.args[0] == "http://localhost:8000/copy/custom"


def test_generate_client_falls_back_to_legacy_generate_when_v2_method_not_allowed(tmp_path):
    config = _config()
    http = MagicMock()
    http.post.side_effect = [
        _response(405, {"detail": "Method Not Allowed"}),
        _response(200, {"marketing_copy": {"text": "legacy copy"}}),
    ]
    speech_patch, srt_patch, speech, _srt = _mock_local_generators()

    try:
        client = GenerateMediaClient(
            config=config,
            base_url="http://localhost:8000",
            http_session=http,
            scratch_dir=tmp_path,
        )
        client.generate(
            task_id="task-001",
            product_id="product-001",
            config_id="cfg-001",
            duration=12.5,
        )
    finally:
        speech_patch.stop()
        srt_patch.stop()

    assert http.post.call_args_list[0].args[0] == "http://localhost:8000/api/v2/generate-copy"
    assert http.post.call_args_list[1].args[0] == "http://localhost:8000/api/generate"
    assert speech.call_args.kwargs["text"] == "legacy copy"


def test_generate_client_posts_image_mode_to_v2_as_multipart(tmp_path):
    config = _config()
    image_path = tmp_path / "front.png"
    image_path.write_bytes(b"image-bytes")
    http = MagicMock()
    http.post.return_value = _response(200, {"marketing_copy": {"text": "image copy"}})
    speech_patch, srt_patch, _speech, _srt = _mock_local_generators()

    try:
        client = GenerateMediaClient(
            config=config,
            base_url="http://localhost:8000",
            http_session=http,
            scratch_dir=tmp_path,
        )
        client.generate(
            task_id="task-001",
            product_id="product-001",
            config_id="cfg-001",
            duration=12,
            category="category",
            title="title",
            image_path=image_path,
        )
    finally:
        speech_patch.stop()
        srt_patch.stop()

    args, kwargs = http.post.call_args
    assert args[0] == "http://localhost:8000/api/v2/generate-copy/images"
    assert "json" not in kwargs
    assert kwargs["data"]["category"] == "category"
    assert kwargs["data"]["title"] == "title"
    assert kwargs["data"]["duration"] == "12"
    assert kwargs["headers"]["Authorization"] == "Bearer token-123"
    assert kwargs["files"]["images"][0] == "front.png"


def test_generate_client_falls_back_to_legacy_image_generate_when_v2_missing(tmp_path):
    config = _config()
    image_path = tmp_path / "front.png"
    image_path.write_bytes(b"image-bytes")
    http = MagicMock()
    http.post.side_effect = [
        _response(404, {"detail": "Not Found"}),
        _response(200, {"marketing_copy": {"text": "legacy image copy"}}),
    ]
    speech_patch, srt_patch, speech, _srt = _mock_local_generators()

    try:
        client = GenerateMediaClient(
            config=config,
            base_url="http://localhost:8000",
            http_session=http,
            scratch_dir=tmp_path,
        )
        client.generate(
            task_id="task-001",
            product_id="product-001",
            config_id="cfg-001",
            duration=12,
            category="category",
            title="title",
            image_path=image_path,
        )
    finally:
        speech_patch.stop()
        srt_patch.stop()

    assert http.post.call_args_list[0].args[0] == "http://localhost:8000/api/v2/generate-copy/images"
    assert http.post.call_args_list[1].args[0] == "http://localhost:8000/api/generate/images"
    assert speech.call_args.kwargs["text"] == "legacy image copy"


def test_generate_client_uses_task_product_fields(tmp_path):
    config = _config()
    http = MagicMock()
    http.post.return_value = _response(200, {"marketing_copy": {"text": "copy"}})
    speech_patch, srt_patch, _speech, _srt = _mock_local_generators()

    try:
        client = GenerateMediaClient(
            config=config,
            base_url="http://localhost:8000",
            http_session=http,
            scratch_dir=tmp_path,
        )
        client.generate(
            task_id="task-001",
            product_id="product-001",
            config_id="cfg-001",
            duration=12,
            category="category-name",
            title="summer cotton set",
            selling_points="summer cotton set",
        )
    finally:
        speech_patch.stop()
        srt_patch.stop()

    payload = http.post.call_args.kwargs["json"]
    assert payload["category"] == "category-name"
    assert payload["title"] == "summer cotton set"
    assert payload["selling_points"] == ["summer cotton set"]


def test_generate_client_fails_when_response_missing_copy_text(tmp_path):
    config = _config()
    http = MagicMock()
    http.post.return_value = _response(200, {"marketing_copy": {}})

    client = GenerateMediaClient(
        config=config,
        base_url="http://localhost:8000",
        http_session=http,
        scratch_dir=tmp_path,
    )

    with pytest.raises(GenerateMediaError, match="marketing_copy.text"):
        client.generate(
            task_id="task-001",
            product_id="product-001",
            config_id="cfg-001",
            duration=12.5,
        )


def test_generate_client_wraps_speech_failure(tmp_path):
    config = _config()
    http = MagicMock()
    http.post.return_value = _response(200, {"marketing_copy": {"text": "copy"}})

    client = GenerateMediaClient(
        config=config,
        base_url="http://localhost:8000",
        http_session=http,
        scratch_dir=tmp_path,
    )

    with patch("video_batch.generate_media.generate_speech", side_effect=RuntimeError("tts boom")):
        with pytest.raises(GenerateMediaError, match="audio generation failed"):
            client.generate(
                task_id="task-001",
                product_id="product-001",
                config_id="cfg-001",
                duration=12.5,
            )


def test_generate_client_wraps_subtitle_failure(tmp_path):
    config = _config()
    http = MagicMock()
    http.post.return_value = _response(200, {"marketing_copy": {"text": "copy"}})

    client = GenerateMediaClient(
        config=config,
        base_url="http://localhost:8000",
        http_session=http,
        scratch_dir=tmp_path,
    )

    with patch("video_batch.generate_media.generate_speech", return_value=[]), patch(
        "video_batch.generate_media.generate_srt",
        side_effect=RuntimeError("srt boom"),
    ):
        with pytest.raises(GenerateMediaError, match="subtitle generation failed"):
            client.generate(
                task_id="task-001",
                product_id="product-001",
                config_id="cfg-001",
                duration=12.5,
            )


def test_build_generate_duration_for_image_to_video(tmp_path):
    material_index = MagicMock()
    material_index.images = [MagicMock(), MagicMock(), MagicMock()]
    material_index.videos = []

    duration = build_generate_duration(
        mode="image-to-video",
        material_index=material_index,
        image_duration=2.5,
        img_video_position="after",
    )

    assert duration == 7.5


def test_build_generate_duration_includes_loop_count_for_reference_after(tmp_path):
    material_index = MagicMock()
    material_index.images = [MagicMock(), MagicMock()]
    material_index.videos = [MagicMock(path=tmp_path / "ref.mp4")]

    duration = build_generate_duration(
        mode="reference-video",
        material_index=material_index,
        image_duration=2.0,
        img_video_position="after",
        reference_video=tmp_path / "ref.mp4",
        duration_probe=lambda _path: 10.25,
        loop_count=2,
    )

    assert duration == 28.5
