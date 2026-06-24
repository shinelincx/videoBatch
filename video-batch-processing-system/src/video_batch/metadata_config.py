import json
from dataclasses import dataclass
from pathlib import Path


class MetadataParseError(Exception):
    """metadata.json 解析异常。"""
    pass


@dataclass
class MetadataConfig:
    """从 config/metadata.json 读取的可选素材目录配置。

    属性:
        bgm_dir: 背景音乐目录路径
        prepend_dir: 前贴视频目录路径
        append_dir: 后贴视频目录路径
    """

    bgm_dir: str | None = None
    prepend_dir: str | None = None
    append_dir: str | None = None


def parse_metadata(config_dir: Path) -> MetadataConfig:
    """解析 config/metadata.json 文件。

    文件不存在或缺失字段时返回默认值。JSON 格式错误时抛异常。

    参数:
        config_dir: 包含 metadata.json 的配置目录路径
    返回:
        解析后的 MetadataConfig 对象
    抛出:
        MetadataParseError: JSON 解析失败时抛出
    """
    meta_path = Path(config_dir) / "metadata.json"
    if not meta_path.exists():
        return MetadataConfig()

    try:
        data = json.loads(meta_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        raise MetadataParseError(f"metadata.json 解析失败: {e}") from e

    return MetadataConfig(
        bgm_dir=data.get("bgm_dir"),
        prepend_dir=data.get("prepend_dir"),
        append_dir=data.get("append_dir"),
    )
