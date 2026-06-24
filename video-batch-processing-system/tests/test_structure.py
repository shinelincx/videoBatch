from pathlib import Path

from video_batch.structure import setup_project_structure


EXPECTED_DIRS = [
    "assets",
    "config",
    "hashes",
    "temp/audio",
    "logs",
]


def test_setup_creates_all_required_directories(tmp_path):
    """创建项目必需的目录结构"""
    setup_project_structure(tmp_path)

    for dir_path in EXPECTED_DIRS:
        full_path = tmp_path / dir_path
        assert full_path.exists(), f"目录未创建: {dir_path}"
        assert full_path.is_dir(), f"路径不是目录: {dir_path}"


def test_setup_is_idempotent(tmp_path):
    """重复调用不会出错"""
    setup_project_structure(tmp_path)
    setup_project_structure(tmp_path)

    for dir_path in EXPECTED_DIRS:
        assert (tmp_path / dir_path).is_dir()