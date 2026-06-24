from video_batch.local_config import (
    AudioParamsConfig,
    LocalConfig,
    MaterialPathsConfig,
)


class TestAudioParamsConfig:
    def test_defaults(self):
        cfg = AudioParamsConfig()
        assert cfg.voice_type == "female"
        assert cfg.speech_speed == 1.0

    def test_custom_values(self):
        cfg = AudioParamsConfig(voice_type="male", speech_speed=1.2)
        assert cfg.voice_type == "male"
        assert cfg.speech_speed == 1.2

    def test_from_dict(self):
        cfg = AudioParamsConfig.from_dict(
            {"voice_type": "male", "speech_speed": 1.2},
        )
        assert cfg.voice_type == "male"
        assert cfg.speech_speed == 1.2

    def test_from_dict_partial(self):
        cfg = AudioParamsConfig.from_dict({"voice_type": "child"})
        assert cfg.voice_type == "child"
        assert cfg.speech_speed == 1.0

    def test_to_dict_roundtrips(self):
        original = AudioParamsConfig(voice_type="child", speech_speed=0.9)
        data = original.to_dict()
        restored = AudioParamsConfig.from_dict(data)
        assert original == restored


class TestMaterialPathsConfig:
    def test_defaults(self):
        cfg = MaterialPathsConfig()
        assert cfg.base_dir == "assets"
        assert cfg.sticker_dir == "assets/sticker"

    def test_image_dir_default_includes_input(self):
        cfg = MaterialPathsConfig()
        assert cfg.image_dir == "assets/input/{task_id}/img"

    def test_video_dir_default_includes_input(self):
        cfg = MaterialPathsConfig()
        assert cfg.video_dir == "assets/input/{task_id}/mv"

    def test_output_dir_default_unchanged(self):
        cfg = MaterialPathsConfig()
        assert cfg.output_dir == "assets/output/{task_id}"

    def test_image_dir_from_dict_default(self):
        cfg = MaterialPathsConfig.from_dict({})
        assert cfg.image_dir == "assets/input/{task_id}/img"

    def test_video_dir_from_dict_default(self):
        cfg = MaterialPathsConfig.from_dict({})
        assert cfg.video_dir == "assets/input/{task_id}/mv"

    def test_output_dir_from_dict_default(self):
        cfg = MaterialPathsConfig.from_dict({})
        assert cfg.output_dir == "assets/output/{task_id}"

    def test_custom_image_dir_from_dict(self):
        cfg = MaterialPathsConfig.from_dict({"image_dir": "custom/img"})
        assert cfg.image_dir == "custom/img"

    def test_custom_sticker_dir(self):
        cfg = MaterialPathsConfig(sticker_dir="custom/stickers")
        assert cfg.sticker_dir == "custom/stickers"

    def test_sticker_dir_from_dict(self):
        cfg = MaterialPathsConfig.from_dict({"sticker_dir": "/data/sticker"})
        assert cfg.sticker_dir == "/data/sticker"

    def test_sticker_dir_default_from_dict(self):
        cfg = MaterialPathsConfig.from_dict({})
        assert cfg.sticker_dir == "assets/sticker"

    def test_sticker_dir_roundtrips(self):
        original = MaterialPathsConfig(sticker_dir="/custom/stickers")
        data = original.to_dict()
        restored = MaterialPathsConfig.from_dict(data)
        assert restored.sticker_dir == "/custom/stickers"


class TestLocalConfig:
    def test_default_values(self):
        cfg = LocalConfig()
        assert isinstance(cfg.material_paths, MaterialPathsConfig)
        assert cfg.material_paths.base_dir == "assets"
        assert cfg.material_paths.watermark_dir == "assets/watermark"
        assert cfg.material_paths.prepend_dir == "assets/prepend"
        assert cfg.material_paths.append_dir == "assets/append"
        assert cfg.material_paths.sticker_dir == "assets/sticker"
        assert cfg.audio_params.voice_type == "female"

    def test_from_dict_full(self):
        data = {
            "material_paths": {
                "base_dir": "/data",
                "image_dir": "/data/img",
                "video_dir": "/data/mv",
                "bgm_dir": "/data/bgm",
                "output_dir": "/data/output",
                "watermark_dir": "/data/wm",
                "sticker_dir": "/data/sticker",
                "prepend_dir": "/data/pre",
                "append_dir": "/data/post",
            },
            "randomization": {
                "frame": {"drop_frame_range": [3, 10]},
                "overlay": {"danmaku_texts": ["你好"]},
                "media_formats": {"audio": ["mp3"]},
                "copywriting_styles": ["幽默"],
            },
            "audio_params": {"voice_type": "child", "speech_speed": 0.8},
        }
        cfg = LocalConfig.from_dict(data)
        assert cfg.material_paths.base_dir == "/data"
        assert cfg.material_paths.watermark_dir == "/data/wm"
        assert cfg.material_paths.sticker_dir == "/data/sticker"
        assert cfg.material_paths.prepend_dir == "/data/pre"
        assert cfg.material_paths.append_dir == "/data/post"
        assert cfg.randomization.frame.drop_frame_min == 3
        assert cfg.audio_params.voice_type == "child"

    def test_from_dict_partial(self):
        cfg = LocalConfig.from_dict({})
        assert cfg.material_paths.base_dir == "assets"
        assert cfg.randomization.frame.drop_frame_min == 5
        assert cfg.audio_params.voice_type == "female"

    def test_to_dict_roundtrips(self):
        original = LocalConfig()
        data = original.to_dict()
        restored = LocalConfig.from_dict(data)
        assert original == restored

    def test_load_and_save_file(self, tmp_path):
        original = LocalConfig()
        filepath = tmp_path / "local_config.json"
        original.save(filepath)
        loaded = LocalConfig.load(filepath)
        assert original == loaded

    def test_load_nonexistent_returns_default(self, tmp_path):
        cfg = LocalConfig.load(tmp_path / "nonexistent.json")
        assert cfg.material_paths.base_dir == "assets"
        assert cfg.audio_params.voice_type == "female"