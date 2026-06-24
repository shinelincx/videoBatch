from unittest.mock import patch

from video_batch.environment import check_ffmpeg


def test_check_ffmpeg_returns_true_when_available():
    """FFmpeg 可用时返回 True"""
    with patch("subprocess.run") as mock_run:
        mock_run.return_value.returncode = 0
        assert check_ffmpeg() is True
        mock_run.assert_called_once()


def test_check_ffmpeg_returns_false_when_not_found():
    """FFmpeg 未安装时返回 False"""
    with patch("subprocess.run") as mock_run:
        mock_run.side_effect = FileNotFoundError()
        assert check_ffmpeg() is False


def test_check_ffmpeg_returns_false_on_nonzero_exit():
    """FFmpeg 执行失败时返回 False"""
    with patch("subprocess.run") as mock_run:
        mock_run.return_value.returncode = 1
        assert check_ffmpeg() is False