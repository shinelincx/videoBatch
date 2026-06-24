import time
from pathlib import Path

from video_batch.cleanup import cleanup_temp


def test_cleanup_temp_removes_expired_files(tmp_path):
    """清理超过24小时的临时文件"""
    temp_dir = tmp_path / "temp"
    temp_dir.mkdir()

    old_file = temp_dir / "old_audio.wav"
    old_file.write_text("stale data")
    old_mtime = time.time() - 25 * 3600
    old_file.touch()
    os_set_mtime(old_file, old_mtime)

    recent_file = temp_dir / "recent_audio.wav"
    recent_file.write_text("fresh data")

    deleted_count = cleanup_temp(temp_dir, max_age_hours=24)

    assert not old_file.exists()
    assert recent_file.exists()
    assert deleted_count == 1


def test_cleanup_temp_returns_zero_when_nothing_expired(tmp_path):
    """所有文件都在24小时内时返回0"""
    temp_dir = tmp_path / "temp"
    temp_dir.mkdir()

    recent_file = temp_dir / "recent.txt"
    recent_file.write_text("data")

    deleted_count = cleanup_temp(temp_dir, max_age_hours=24)

    assert recent_file.exists()
    assert deleted_count == 0


def os_set_mtime(file_path: Path, timestamp: float) -> None:
    import os

    os.utime(str(file_path), (timestamp, timestamp))