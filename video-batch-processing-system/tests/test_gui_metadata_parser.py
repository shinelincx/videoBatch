import json

import pytest

from video_batch.metadata_config import (
    MetadataParseError,
    MetadataConfig,
    parse_metadata,
)


class TestParseMetadata:
    """解析 config/metadata.json"""

    def test_parses_all_optional_dirs(self, tmp_path):
        data = {
            "bgm_dir": "assets/bgm",
            "prepend_dir": "assets/prepend",
            "append_dir": "assets/append",
        }
        meta_file = tmp_path / "metadata.json"
        meta_file.write_text(json.dumps(data))

        result = parse_metadata(tmp_path)

        assert result.bgm_dir == "assets/bgm"
        assert result.prepend_dir == "assets/prepend"
        assert result.append_dir == "assets/append"

    def test_handles_missing_keys_as_none(self, tmp_path):
        data = {"bgm_dir": "assets/bgm"}
        meta_file = tmp_path / "metadata.json"
        meta_file.write_text(json.dumps(data))

        result = parse_metadata(tmp_path)

        assert result.bgm_dir == "assets/bgm"
        assert result.prepend_dir is None
        assert result.append_dir is None

    def test_empty_json_returns_all_none(self, tmp_path):
        meta_file = tmp_path / "metadata.json"
        meta_file.write_text("{}")

        result = parse_metadata(tmp_path)

        assert result.bgm_dir is None
        assert result.prepend_dir is None
        assert result.append_dir is None

    def test_missing_file_returns_all_none(self, tmp_path):
        result = parse_metadata(tmp_path)

        assert result.bgm_dir is None
        assert result.prepend_dir is None
        assert result.append_dir is None

    def test_invalid_json_raises_error(self, tmp_path):
        meta_file = tmp_path / "metadata.json"
        meta_file.write_text("not valid json")

        with pytest.raises(MetadataParseError, match="metadata.json 解析失败"):
            parse_metadata(tmp_path)


class TestMetadataConfig:
    """MetadataConfig 数据类"""

    def test_defaults(self):
        config = MetadataConfig()
        assert config.bgm_dir is None
        assert config.prepend_dir is None
        assert config.append_dir is None

    def test_custom_values(self):
        config = MetadataConfig(
            bgm_dir="bgm",
            prepend_dir="pre",
            append_dir="app",
        )
        assert config.bgm_dir == "bgm"
        assert config.prepend_dir == "pre"
        assert config.append_dir == "app"
