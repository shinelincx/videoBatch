from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

from video_batch.token_manager import TokenManager, ReAuthNeeded
from video_batch.token_store import TokenStore
from video_batch.auth import TokenPair


def test_ensure_valid_token_returns_stored_when_not_near_expiry(tmp_path):
    """token 未接近过期时直接返回存储的 token"""
    store = TokenStore(storage_dir=tmp_path)
    mock_refresh = MagicMock()
    mock_logger = MagicMock()
    manager = TokenManager(store=store, refresh_func=mock_refresh, logger=mock_logger)

    store.save(TokenPair(access_token="at-valid", refresh_token="rt-valid"))
    result = manager.ensure_valid_token()

    assert result.access_token == "at-valid"
    mock_refresh.assert_not_called()


def test_ensure_valid_token_verifies_session_when_enabled(tmp_path):
    """后台 session 模式下，每次检查都调用刷新函数校验登录态。"""
    store = TokenStore(storage_dir=tmp_path)
    mock_refresh = MagicMock(
        return_value=TokenPair(access_token="at-checked", refresh_token="rt-checked")
    )
    mock_logger = MagicMock()
    manager = TokenManager(
        store=store,
        refresh_func=mock_refresh,
        logger=mock_logger,
        verify_on_check=True,
    )

    store.save(TokenPair(access_token="at-valid", refresh_token="rt-valid"))
    result = manager.ensure_valid_token()

    mock_refresh.assert_called_once_with("rt-valid")
    assert result.access_token == "at-checked"


def test_ensure_valid_token_refreshes_when_near_expiry(tmp_path):
    """接近过期时自动静默刷新"""
    past_time = datetime.now(timezone.utc) - timedelta(hours=23.5)

    with patch("video_batch.token_store.datetime") as mock_dt:
        mock_dt.now.return_value = past_time
        store = TokenStore(storage_dir=tmp_path)
        store.save(TokenPair(access_token="at-old", refresh_token="rt-old"))

    mock_refresh = MagicMock(return_value=TokenPair(access_token="at-new", refresh_token="rt-new"))
    mock_logger = MagicMock()
    manager = TokenManager(store=store, refresh_func=mock_refresh, logger=mock_logger)

    result = manager.ensure_valid_token()

    mock_refresh.assert_called_once_with("rt-old")
    assert result.access_token == "at-new"
    assert result.refresh_token == "rt-new"

    stored = store.load()
    assert stored is not None
    assert stored.access_token == "at-new"


def test_ensure_valid_token_raises_when_refresh_fails(tmp_path):
    """刷新失败时抛出 ReAuthNeeded"""
    past_time = datetime.now(timezone.utc) - timedelta(hours=23.5)

    with patch("video_batch.token_store.datetime") as mock_dt:
        mock_dt.now.return_value = past_time
        store = TokenStore(storage_dir=tmp_path)
        store.save(TokenPair(access_token="at-old", refresh_token="rt-old"))

    mock_refresh = MagicMock(side_effect=Exception("refresh failed"))
    mock_logger = MagicMock()
    manager = TokenManager(store=store, refresh_func=mock_refresh, logger=mock_logger)

    try:
        manager.ensure_valid_token()
        assert False, "should have raised"
    except ReAuthNeeded as e:
        assert "refresh failed" in str(e)


def test_ensure_valid_token_raises_when_refresh_token_expired(tmp_path):
    """RefreshToken 过期时抛出 ReAuthNeeded"""
    past_time = datetime.now(timezone.utc) - timedelta(days=8)

    with patch("video_batch.token_store.datetime") as mock_dt:
        mock_dt.now.return_value = past_time
        store = TokenStore(storage_dir=tmp_path)
        store.save(TokenPair(access_token="at-old", refresh_token="rt-old"))

    mock_refresh = MagicMock()
    mock_logger = MagicMock()
    manager = TokenManager(store=store, refresh_func=mock_refresh, logger=mock_logger)

    try:
        manager.ensure_valid_token()
        assert False, "should have raised"
    except ReAuthNeeded:
        pass

    mock_refresh.assert_not_called()


def test_ensure_valid_token_logs_on_refresh(tmp_path):
    """刷新时记录日志"""
    past_time = datetime.now(timezone.utc) - timedelta(hours=23.5)

    with patch("video_batch.token_store.datetime") as mock_dt:
        mock_dt.now.return_value = past_time
        store = TokenStore(storage_dir=tmp_path)
        store.save(TokenPair(access_token="at-old", refresh_token="rt-old"))

    mock_refresh = MagicMock(return_value=TokenPair(access_token="at-new", refresh_token="rt-new"))
    mock_logger = MagicMock()
    manager = TokenManager(store=store, refresh_func=mock_refresh, logger=mock_logger)

    manager.ensure_valid_token()

    mock_logger.info.assert_called()
