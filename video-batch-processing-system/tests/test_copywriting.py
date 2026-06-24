from pathlib import Path
from unittest.mock import MagicMock

from video_batch.copywriting import (
    CopywritingConfig,
    CopywritingError,
    CopywritingGenerator,
    CopywritingResult,
)


def _mock_response(status_code=200, json_data=None, content=b""):
    resp = MagicMock()
    resp.status_code = status_code
    resp.json.return_value = json_data or {}
    resp.content = content
    return resp


def test_disabled_returns_empty_result():
    """文案生成未启用时返回空结果"""
    config = CopywritingConfig(enabled=False, style="正式")
    http = MagicMock()
    generator = CopywritingGenerator(
        config=config, base_url="http://test", http_session=http,
        temp_dir=Path("/tmp"),
    )

    result = generator.generate(access_token="token123")

    assert result.text == ""
    assert result.audio_path is None
    http.post.assert_not_called()


def test_generate_calls_copywriting_api(tmp_path):
    """生成文案时调用 /api/copywriting 并传递风格参数"""
    config = CopywritingConfig(enabled=True, style="幽默")
    http = MagicMock()
    http.post.return_value = _mock_response(
        200, json_data={"text": "这是一条幽默的营销文案"},
    )

    generator = CopywritingGenerator(
        config=config, base_url="http://test", http_session=http,
        temp_dir=tmp_path / "temp",
    )

    generator.generate(access_token="token123")

    copywriting_call = http.post.call_args_list[0]
    args, kwargs = copywriting_call
    assert "/api/copywriting" in args[0]
    assert kwargs["json"]["style"] == "幽默"
    assert kwargs["headers"]["Authorization"] == "Bearer token123"


def test_generate_calls_tts_api_with_text(tmp_path):
    """生成文案后调用 TTS 接口将文案转为音频"""
    config = CopywritingConfig(enabled=True, style="正式")
    http = MagicMock()
    http.post.side_effect = [
        _mock_response(200, json_data={"text": "营销文案内容"}),
        _mock_response(200, content=b"fake_audio_bytes"),
    ]

    generator = CopywritingGenerator(
        config=config, base_url="http://test", http_session=http,
        temp_dir=tmp_path / "temp",
    )

    generator.generate(access_token="token123")

    assert http.post.call_count >= 2
    tts_call = http.post.call_args_list[1]
    args, kwargs = tts_call
    assert "/api/tts" in args[0]
    assert kwargs["json"]["text"] == "营销文案内容"


def test_saves_audio_to_temp_dir(tmp_path):
    """TTS 音频保存到 temp/audio/ 目录"""
    audio_dir = tmp_path / "temp" / "audio"

    config = CopywritingConfig(enabled=True, style="正式")
    http = MagicMock()
    http.post.side_effect = [
        _mock_response(200, json_data={"text": "文案"}),
        _mock_response(200, content=b"audio_data"),
    ]

    generator = CopywritingGenerator(
        config=config, base_url="http://test", http_session=http,
        temp_dir=tmp_path / "temp",
    )

    result = generator.generate(access_token="token123")

    assert audio_dir.exists()
    assert result.audio_path is not None
    assert result.audio_path.exists()
    assert result.audio_path.read_bytes() == b"audio_data"


def test_result_contains_text_and_audio_path(tmp_path):
    """返回结果包含文案文本和音频路径"""
    config = CopywritingConfig(enabled=True, style="亲切")
    http = MagicMock()
    http.post.side_effect = [
        _mock_response(200, json_data={"text": "亲切的文案内容..."}),
        _mock_response(200, content=b"audio"),
    ]

    generator = CopywritingGenerator(
        config=config, base_url="http://test", http_session=http,
        temp_dir=tmp_path / "temp",
    )

    result = generator.generate(access_token="token123")

    assert result.text == "亲切的文案内容..."
    assert result.audio_path is not None
    assert result.audio_path.suffix == ".mp3"


def test_copywriting_api_failure_raises_error():
    """AI 接口调用失败抛出 CopywritingError"""
    config = CopywritingConfig(enabled=True, style="正式")
    http = MagicMock()
    http.post.return_value = _mock_response(500)

    generator = CopywritingGenerator(
        config=config, base_url="http://test", http_session=http,
        temp_dir=Path("/tmp"),
    )

    try:
        generator.generate(access_token="token123")
        assert False, "should have raised"
    except CopywritingError as e:
        assert "文案生成失败" in str(e)


def test_copywriting_api_non_200_raises_error():
    """文案 API 返回非 200 状态码时抛出 CopywritingError"""
    config = CopywritingConfig(enabled=True, style="正式")
    http = MagicMock()
    http.post.return_value = _mock_response(400, json_data={"detail": "参数错误"})

    generator = CopywritingGenerator(
        config=config, base_url="http://test", http_session=http,
        temp_dir=Path("/tmp"),
    )

    try:
        generator.generate(access_token="token123")
        assert False, "should have raised"
    except CopywritingError as e:
        assert "参数错误" in str(e)


def test_tts_failure_raises_error():
    """TTS 音频生成失败抛出 CopywritingError"""
    config = CopywritingConfig(enabled=True, style="正式")
    http = MagicMock()
    http.post.side_effect = [
        _mock_response(200, json_data={"text": "文案内容"}),
        _mock_response(500),
    ]

    generator = CopywritingGenerator(
        config=config, base_url="http://test", http_session=http,
        temp_dir=Path("/tmp"),
    )

    try:
        generator.generate(access_token="token123")
        assert False, "should have raised"
    except CopywritingError as e:
        assert "音频生成失败" in str(e)


def test_cleanup_removes_audio_file(tmp_path):
    """任务完成后清理临时音频文件"""
    audio_dir = tmp_path / "temp" / "audio"
    audio_dir.mkdir(parents=True)
    audio_file = audio_dir / "tts_output.mp3"
    audio_file.write_text("audio")

    config = CopywritingConfig(enabled=True, style="正式")
    http = MagicMock()

    generator = CopywritingGenerator(
        config=config, base_url="http://test", http_session=http,
        temp_dir=tmp_path / "temp",
    )

    generator.cleanup(audio_file)

    assert not audio_file.exists()


def test_cleanup_does_not_crash_on_missing_file():
    """清理不存在的文件时不崩溃"""
    config = CopywritingConfig(enabled=True, style="正式")
    http = MagicMock()

    generator = CopywritingGenerator(
        config=config, base_url="http://test", http_session=http,
        temp_dir=Path("/tmp"),
    )

    generator.cleanup(Path("/nonexistent/audio.mp3"))


def test_logs_key_events(tmp_path):
    """关键流程节点记录日志"""
    config = CopywritingConfig(enabled=True, style="正式")
    http = MagicMock()
    http.post.side_effect = [
        _mock_response(200, json_data={"text": "文案内容"}),
        _mock_response(200, content=b"audio"),
    ]
    logger = MagicMock()

    generator = CopywritingGenerator(
        config=config, base_url="http://test", http_session=http,
        temp_dir=tmp_path / "temp", logger=logger,
    )

    generator.generate(access_token="token123")

    logger.info.assert_called()
    call_args = str(logger.info.call_args)
    assert "文案" in call_args


def test_logs_when_disabled(tmp_path):
    """文案未启用时记录跳过信息"""
    config = CopywritingConfig(enabled=False, style="正式")
    http = MagicMock()
    logger = MagicMock()

    generator = CopywritingGenerator(
        config=config, base_url="http://test", http_session=http,
        temp_dir=tmp_path / "temp", logger=logger,
    )

    generator.generate(access_token="token123")

    logger.info.assert_called()
    call_args = str(logger.info.call_args)
    assert "跳过" in call_args


def test_supports_all_four_styles(tmp_path):
    """支持全部四种文案风格"""
    styles = ["幽默", "正式", "亲切", "悬疑"]

    for style in styles:
        config = CopywritingConfig(enabled=True, style=style)
        http = MagicMock()
        http.post.return_value = _mock_response(
            200, json_data={"text": "文案内容"},
        )

        generator = CopywritingGenerator(
            config=config, base_url="http://test", http_session=http,
            temp_dir=tmp_path / "temp",
        )

        generator.generate(access_token="token123")

        call_args = http.post.call_args_list[0]
        assert call_args[1]["json"]["style"] == style


def test_temp_dir_created_automatically(tmp_path):
    """temp/audio 目录不存在时自动创建"""
    config = CopywritingConfig(enabled=True, style="正式")
    http = MagicMock()
    http.post.side_effect = [
        _mock_response(200, json_data={"text": "文案"}),
        _mock_response(200, content=b"audio"),
    ]

    audio_dir = tmp_path / "temp" / "audio"
    assert not audio_dir.exists()

    generator = CopywritingGenerator(
        config=config, base_url="http://test", http_session=http,
        temp_dir=tmp_path / "temp",
    )

    generator.generate(access_token="token123")

    assert audio_dir.exists()


def test_network_error_on_copywriting_raises_error():
    """文案生成网络异常时抛出 CopywritingError"""
    config = CopywritingConfig(enabled=True, style="正式")
    http = MagicMock()
    http.post.side_effect = ConnectionError("网络不可达")

    generator = CopywritingGenerator(
        config=config, base_url="http://test", http_session=http,
        temp_dir=Path("/tmp"),
    )

    try:
        generator.generate(access_token="token123")
        assert False, "should have raised"
    except CopywritingError as e:
        assert "网络" in str(e) or "接口" in str(e)