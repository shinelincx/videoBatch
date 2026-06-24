import pytest
from unittest.mock import MagicMock, patch

from video_batch.retry import NetworkError, with_retry


def test_with_retry_returns_result_on_first_success():
    """首次成功时直接返回结果"""
    func = MagicMock(return_value="result")

    with patch("video_batch.retry.time.sleep"):
        result = with_retry(func, max_retries=3)

    assert result == "result"
    assert func.call_count == 1


def test_with_retry_retries_and_succeeds():
    """前2次失败第3次成功，返回结果"""
    func = MagicMock(
        side_effect=[Exception("fail1"), Exception("fail2"), "result"]
    )

    with patch("video_batch.retry.time.sleep"):
        result = with_retry(func, max_retries=3)

    assert result == "result"
    assert func.call_count == 3


def test_with_retry_raises_network_error_when_exhausted():
    """全部重试耗尽后抛出 NetworkError"""
    func = MagicMock(side_effect=Exception("timeout"))

    with patch("video_batch.retry.time.sleep"):
        with pytest.raises(NetworkError, match="timeout"):
            with_retry(func, max_retries=3)

    assert func.call_count == 3