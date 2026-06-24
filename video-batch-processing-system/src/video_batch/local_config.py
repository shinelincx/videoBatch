import json
from dataclasses import dataclass
from pathlib import Path

from video_batch.randomization_config import RandomizationConfig


@dataclass
class MaterialPathsConfig:
    base_dir: str = "assets"
    image_dir: str = "assets/input/{task_id}/img"
    video_dir: str = "assets/input/{task_id}/mv"
    bgm_dir: str = "assets/bgm"
    output_dir: str = "assets/output/{task_id}"
    watermark_dir: str = "assets/watermark"
    sticker_dir: str = "assets/sticker"
    prepend_dir: str = "assets/prepend"
    append_dir: str = "assets/append"

    @staticmethod
    def from_dict(data: dict) -> "MaterialPathsConfig":
        return MaterialPathsConfig(
            base_dir=data.get("base_dir", "assets"),
            image_dir=data.get("image_dir", "assets/input/{task_id}/img"),
            video_dir=data.get("video_dir", "assets/input/{task_id}/mv"),
            bgm_dir=data.get("bgm_dir", "assets/bgm"),
            output_dir=data.get("output_dir", "assets/output/{task_id}"),
            watermark_dir=data.get("watermark_dir", "assets/watermark"),
            sticker_dir=data.get("sticker_dir", "assets/sticker"),
            prepend_dir=data.get("prepend_dir", "assets/prepend"),
            append_dir=data.get("append_dir", "assets/append"),
        )

    def to_dict(self) -> dict:
        return {
            "base_dir": self.base_dir,
            "image_dir": self.image_dir,
            "video_dir": self.video_dir,
            "bgm_dir": self.bgm_dir,
            "output_dir": self.output_dir,
            "watermark_dir": self.watermark_dir,
            "sticker_dir": self.sticker_dir,
            "prepend_dir": self.prepend_dir,
            "append_dir": self.append_dir,
        }


@dataclass
class AudioParamsConfig:
    voice_type: str = "female"
    speech_speed: float = 1.0

    @staticmethod
    def from_dict(data: dict) -> "AudioParamsConfig":
        return AudioParamsConfig(
            voice_type=data.get("voice_type", "female"),
            speech_speed=float(data.get("speech_speed", 1.0)),
        )

    def to_dict(self) -> dict:
        return {
            "voice_type": self.voice_type,
            "speech_speed": self.speech_speed,
        }


@dataclass
class LocalConfig:
    material_paths: MaterialPathsConfig | None = None
    randomization: RandomizationConfig | None = None
    audio_params: AudioParamsConfig | None = None

    def __post_init__(self):
        if self.material_paths is None:
            self.material_paths = MaterialPathsConfig()
        if self.randomization is None:
            self.randomization = RandomizationConfig()
        if self.audio_params is None:
            self.audio_params = AudioParamsConfig()

    @staticmethod
    def from_dict(data: dict) -> "LocalConfig":
        return LocalConfig(
            material_paths=MaterialPathsConfig.from_dict(
                data.get("material_paths", {}),
            ),
            randomization=RandomizationConfig.from_dict(
                data.get("randomization", {}),
            ),
            audio_params=AudioParamsConfig.from_dict(
                data.get("audio_params", {}),
            ),
        )

    def to_dict(self) -> dict:
        return {
            "material_paths": self.material_paths.to_dict(),
            "randomization": self.randomization.to_dict(),
            "audio_params": self.audio_params.to_dict(),
        }

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            json.dumps(self.to_dict(), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    @staticmethod
    def load(path: Path) -> "LocalConfig":
        if not path.exists():
            return LocalConfig()
        raw = json.loads(path.read_text(encoding="utf-8"))
        return LocalConfig.from_dict(raw)