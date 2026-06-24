from unittest.mock import MagicMock

from video_batch.offline_tracker import OfflineTracker


def test_offline_tracker_starts_online():
    """初始状态为在线"""
    logger = MagicMock()
    tracker = OfflineTracker(logger=logger)
    assert tracker.is_offline is False


def test_mark_offline_sets_state_and_logs():
    """标记离线后状态变更并记录日志"""
    logger = MagicMock()
    tracker = OfflineTracker(logger=logger)

    tracker.mark_offline()

    assert tracker.is_offline is True
    logger.warning.assert_called_once()
    call_args = str(logger.warning.call_args)
    assert "离线" in call_args


def test_mark_online_restores_state_and_logs():
    """标记在线恢复状态并记录日志"""
    logger = MagicMock()
    tracker = OfflineTracker(logger=logger)
    tracker.mark_offline()
    logger.reset_mock()

    tracker.mark_online()

    assert tracker.is_offline is False
    logger.info.assert_called_once()
    call_args = str(logger.info.call_args)
    assert "恢复" in call_args


def test_mark_offline_is_idempotent(tmp_path):
    """重复标记离线不报错"""
    logger = MagicMock()
    tracker = OfflineTracker(logger=logger)

    tracker.mark_offline()
    tracker.mark_offline()

    assert tracker.is_offline is True