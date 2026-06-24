from pathlib import Path

import pytest

from video_batch.gui.app_config import AppConfig


class TestAppConfigDefaults:
    """默认值测试"""

    def test_default_server_url(self, tmp_path):
        config = AppConfig(config_dir=tmp_path)
        assert config.server_url == "http://localhost:8080"

    def test_default_remember_username_is_false(self, tmp_path):
        config = AppConfig(config_dir=tmp_path)
        assert config.remember_username is False

    def test_default_saved_username_is_empty(self, tmp_path):
        config = AppConfig(config_dir=tmp_path)
        assert config.saved_username == ""

    def test_config_dir_is_created(self, tmp_path):
        nested = tmp_path / "sub" / "config"
        AppConfig(config_dir=nested)
        assert nested.exists()


class TestAppConfigSaveLoad:
    """持久化测试"""

    def test_save_and_load_remember_username(self, tmp_path):
        c1 = AppConfig(config_dir=tmp_path)
        c1.remember_username = True
        c1.saved_username = "testuser"
        c1.save()

        c2 = AppConfig(config_dir=tmp_path)
        c2.load()
        assert c2.remember_username is True
        assert c2.saved_username == "testuser"

    def test_load_returns_defaults_when_no_file(self, tmp_path):
        config = AppConfig(config_dir=tmp_path)
        config.load()
        assert config.remember_username is False
        assert config.saved_username == ""

    def test_save_and_load_server_url(self, tmp_path):
        c1 = AppConfig(config_dir=tmp_path)
        c1.server_url = "https://api.example.com"
        c1.save()

        c2 = AppConfig(config_dir=tmp_path)
        c2.load()
        assert c2.server_url == "https://api.example.com"

    def test_saved_file_is_valid_json(self, tmp_path):
        c1 = AppConfig(config_dir=tmp_path)
        c1.remember_username = True
        c1.saved_username = "user"
        c1.server_url = "https://api.example.com"
        c1.save()

        config_file = tmp_path / "app_config.json"
        assert config_file.exists()

        import json
        data = json.loads(config_file.read_text(encoding="utf-8"))
        assert data["remember_username"] is True
        assert data["saved_username"] == "user"
        assert data["server_url"] == "https://api.example.com"

    def test_save_does_not_store_password(self, tmp_path):
        c1 = AppConfig(config_dir=tmp_path)
        c1.save()

        config_file = tmp_path / "app_config.json"
        data = config_file.read_text(encoding="utf-8")
        assert "password" not in data.lower()


class TestAppConfigMaterialDir:
    """素材根目录配置测试"""

    def test_default_material_dir_is_empty(self, tmp_path):
        config = AppConfig(config_dir=tmp_path)
        assert config.material_dir == ""

    def test_save_and_load_material_dir(self, tmp_path):
        c1 = AppConfig(config_dir=tmp_path)
        c1.material_dir = "D:\\videos\\materials"
        c1.save()

        c2 = AppConfig(config_dir=tmp_path)
        c2.load()
        assert c2.material_dir == "D:\\videos\\materials"

    def test_material_dir_persisted_in_json(self, tmp_path):
        c1 = AppConfig(config_dir=tmp_path)
        c1.material_dir = "D:\\videos\\materials"
        c1.save()

        import json
        config_file = tmp_path / "app_config.json"
        data = json.loads(config_file.read_text(encoding="utf-8"))
        assert data["material_dir"] == "D:\\videos\\materials"

    def test_material_dir_not_in_json_when_empty(self, tmp_path):
        c1 = AppConfig(config_dir=tmp_path)
        c1.save()

        import json
        config_file = tmp_path / "app_config.json"
        data = json.loads(config_file.read_text(encoding="utf-8"))
        assert "material_dir" not in data
