from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from video_batch.token_store import TokenStore
from video_batch.auth import TokenPair


def test_save_and_load_returns_same_token_pair(tmp_path):
    """加密保存后加载出相同的 TokenPair"""
    store = TokenStore(storage_dir=tmp_path)

    original = TokenPair(access_token="at-abc123", refresh_token="rt-xyz789")
    store.save(original)

    loaded = store.load()

    assert loaded is not None
    assert loaded.access_token == "at-abc123"
    assert loaded.refresh_token == "rt-xyz789"


def test_load_returns_none_when_no_saved_token(tmp_path):
    """从未保存过时 load 返回 None"""
    store = TokenStore(storage_dir=tmp_path)
    assert store.load() is None


def test_stored_file_is_not_plaintext(tmp_path):
    """保存的文件不是明文"""
    store = TokenStore(storage_dir=tmp_path)
    store.save(TokenPair(access_token="sensitive-data", refresh_token="secret"))

    token_file = tmp_path / "token.enc"
    raw = token_file.read_bytes()
    assert b"sensitive-data" not in raw
    assert b"secret" not in raw


def test_key_is_reused_on_second_instance(tmp_path):
    """加密密钥首次生成后，第二个实例可复用"""
    store1 = TokenStore(storage_dir=tmp_path)
    store1.save(TokenPair(access_token="first", refresh_token="r1"))

    store2 = TokenStore(storage_dir=tmp_path)
    loaded = store2.load()

    assert loaded is not None
    assert loaded.access_token == "first"


def test_load_includes_saved_at_timestamp(tmp_path):
    """load 返回的 TokenPair 包含保存时间"""
    frozen_now = datetime(2026, 5, 19, 12, 0, 0, tzinfo=timezone.utc)

    with patch("video_batch.token_store.datetime") as mock_dt:
        mock_dt.now.return_value = frozen_now
        store = TokenStore(storage_dir=tmp_path)
        store.save(TokenPair(access_token="at", refresh_token="rt"))

    loaded = store.load()
    assert loaded is not None
    assert loaded.saved_at == frozen_now


def test_is_access_near_expiry_within_one_hour(tmp_path):
    """保存超过 23 小时后，is_access_near_expiry 返回 True"""
    past_time = datetime.now(timezone.utc) - timedelta(hours=23.5)

    with patch("video_batch.token_store.datetime") as mock_dt:
        mock_dt.now.return_value = past_time
        store = TokenStore(storage_dir=tmp_path)
        store.save(TokenPair(access_token="at", refresh_token="rt"))

    assert store.is_access_near_expiry() is True


def test_is_access_not_near_expiry_when_recent(tmp_path):
    """刚保存时 is_access_near_expiry 返回 False"""
    store = TokenStore(storage_dir=tmp_path)
    store.save(TokenPair(access_token="at", refresh_token="rt"))

    assert store.is_access_near_expiry() is False


def test_is_refresh_expired_after_seven_days(tmp_path):
    """保存超过 7 天后 is_refresh_expired 返回 True"""
    past_time = datetime.now(timezone.utc) - timedelta(days=8)

    with patch("video_batch.token_store.datetime") as mock_dt:
        mock_dt.now.return_value = past_time
        store = TokenStore(storage_dir=tmp_path)
        store.save(TokenPair(access_token="at", refresh_token="rt"))

    assert store.is_refresh_expired() is True


def test_is_refresh_not_expired_within_seven_days(tmp_path):
    """保存不到 7 天时 is_refresh_expired 返回 False"""
    store = TokenStore(storage_dir=tmp_path)
    store.save(TokenPair(access_token="at", refresh_token="rt"))

    assert store.is_refresh_expired() is False