import hashlib
from unittest.mock import MagicMock

import pytest

from video_batch.auth import AuthClient, AuthError, SessionExpiredError, TokenPair

SIGN_KEY = "s.0wl?.i_s43$i1_"


def _response(body: dict, status_code: int = 200):
    mock_response = MagicMock()
    mock_response.status_code = status_code
    mock_response.json.return_value = body
    return mock_response


def _assert_valid_signature(headers: dict, uri: str) -> None:
    assert headers["uri"] == uri
    sign_str = (
        f"nonceStr={headers['nonceStr']}"
        f"&timestamp={headers['timestamp']}"
        f"&uri={headers['uri']}"
        f"&key={SIGN_KEY}"
    )
    assert headers["signature"] == hashlib.md5(sign_str.encode("utf-8")).hexdigest()


def test_login_posts_backend_contract_and_returns_token_pair():
    """登录成功返回 TokenPair，并按后台规则签名。"""
    mock_session = MagicMock()
    mock_session.post.return_value = _response(
        {
            "code": 0,
            "msg": "操作成功",
            "data": {"token": "backend-token", "uid": "u1", "nick": "测试用户"},
        }
    )

    client = AuthClient(base_url="http://api.example.com/", http_session=mock_session)
    result = client.login(username="testuser", password="testpass")

    assert isinstance(result, TokenPair)
    assert result.access_token == "backend-token"
    assert result.refresh_token == "backend-token"

    mock_session.post.assert_called_once()
    url = mock_session.post.call_args.args[0]
    kwargs = mock_session.post.call_args.kwargs
    assert url == "http://api.example.com/auth/login"
    assert kwargs["json"] == {"uname": "testuser", "pwd": "testpass"}
    assert kwargs["headers"]["Content-Type"] == "application/json"
    _assert_valid_signature(kwargs["headers"], "/auth/login")


def test_login_raises_auth_error_on_backend_failure():
    """后台 code 非 0 时抛出 AuthError。"""
    mock_session = MagicMock()
    mock_session.post.return_value = _response({"code": 5500, "msg": "用户帐号或密码不正确"})

    client = AuthClient(base_url="http://api.example.com", http_session=mock_session)

    with pytest.raises(AuthError, match="用户帐号或密码不正确"):
        client.login(username="wrong", password="wrong")


def test_login_logs_error_on_auth_failure():
    """认证失败时记录错误日志。"""
    mock_session = MagicMock()
    mock_logger = MagicMock()
    mock_session.post.return_value = _response({"code": 5500, "msg": "用户帐号或密码不正确"})

    client = AuthClient(
        base_url="http://api.example.com",
        http_session=mock_session,
        logger=mock_logger,
    )

    with pytest.raises(AuthError):
        client.login(username="wrong", password="wrong")

    mock_logger.error.assert_called_once_with(
        task_id="auth", module="认证", message="用户帐号或密码不正确"
    )


def test_refresh_session_checks_auth_info_and_keeps_token():
    """后台没有刷新接口，校验 /auth/info 成功即可续用本地 token。"""
    mock_session = MagicMock()
    mock_session.get.return_value = _response(
        {"code": 0, "msg": "操作成功", "data": {"name": "user", "nick": "用户"}}
    )

    client = AuthClient(base_url="http://api.example.com", http_session=mock_session)
    tokens = client.refresh_session("backend-token")

    assert tokens.access_token == "backend-token"
    assert tokens.refresh_token == "backend-token"
    url = mock_session.get.call_args.args[0]
    headers = mock_session.get.call_args.kwargs["headers"]
    assert url == "http://api.example.com/auth/info"
    _assert_valid_signature(headers, "/auth/info")


def test_session_expired_code_raises_session_expired_error():
    """4433/4001 都按登录过期处理。"""
    mock_session = MagicMock()
    mock_session.get.return_value = _response({"code": 4433, "msg": "登录已过期，请重新登录"})

    client = AuthClient(base_url="http://api.example.com", http_session=mock_session)

    with pytest.raises(SessionExpiredError, match="登录已过期"):
        client.fetch_tasks(access_token="backend-token")


def test_fetch_config_unwraps_base_response_data():
    """fetch_config 解包后台 BaseResponse。"""
    mock_session = MagicMock()
    mock_session.get.return_value = _response(
        {
            "code": 0,
            "msg": "操作成功",
            "data": {"version": 1, "mode": "image-to-video"},
        }
    )

    client = AuthClient(base_url="http://api.example.com", http_session=mock_session)
    config = client.fetch_config(access_token="backend-token")

    assert config == {"version": 1, "mode": "image-to-video"}
    headers = mock_session.get.call_args.kwargs["headers"]
    _assert_valid_signature(headers, "/config")


def test_fetch_tasks_returns_empty_list_when_no_backend_task():
    """后台没有任务时返回空列表。"""
    mock_session = MagicMock()
    mock_session.get.return_value = _response({"code": 0, "msg": "操作成功", "data": {}})

    client = AuthClient(base_url="http://api.example.com", http_session=mock_session)
    tasks = client.fetch_tasks(access_token="backend-token")

    assert tasks == []


def test_fetch_tasks_normalizes_backend_poll_task():
    """后台轮询返回单个任务 dict，客户端归一化成表格可展示字段。"""
    mock_session = MagicMock()
    mock_session.get.return_value = _response(
        {
            "code": 0,
            "msg": "操作成功",
            "data": {
                "type": "startSelection",
                "publishAccountId": 12,
                "accountId": "acc-001",
                "config": {"id": "cfg-001"},
                "createTime": 1716540000000,
            },
        }
    )

    client = AuthClient(base_url="http://api.example.com", http_session=mock_session)
    tasks = client.fetch_tasks(access_token="backend-token")

    assert tasks == [
        {
            "type": "startSelection",
            "publishAccountId": 12,
            "accountId": "acc-001",
            "config": {"id": "cfg-001"},
            "createTime": 1716540000000,
            "id": "startSelection-acc-001-1716540000000",
            "productId": "acc-001",
            "material_id": "acc-001",
            "status": "待剪辑",
            "config_id": "cfg-001",
        }
    ]
    url = mock_session.get.call_args.args[0]
    headers = mock_session.get.call_args.kwargs["headers"]
    assert url == "http://api.example.com/publish/account/task/poll"
    _assert_valid_signature(headers, "/publish/account/task/poll")


def test_fetch_tasks_maps_clip_config_code_to_config_id():
    mock_session = MagicMock()
    mock_session.get.return_value = _response(
        {
            "code": 0,
            "msg": "操作成功",
            "data": {
                "id": "task-001",
                "productId": "product-001",
                "clipConfigCode": "cfg-ref-v3",
            },
        }
    )

    client = AuthClient(base_url="http://api.example.com", http_session=mock_session)
    tasks = client.fetch_tasks(access_token="backend-token")

    assert tasks[0]["config_id"] == "cfg-ref-v3"


def test_fetch_tasks_preserves_product_copy_fields():
    mock_session = MagicMock()
    mock_session.get.return_value = _response(
        {
            "code": 0,
            "msg": "操作成功",
            "data": {
                "id": "task-001",
                "productId": "product-001",
                "productCategoryName": "女装",
                "productTitle": "夏季纯棉套装",
            },
        }
    )

    client = AuthClient(base_url="http://api.example.com", http_session=mock_session)
    tasks = client.fetch_tasks(access_token="backend-token")

    assert tasks[0]["productCategoryName"] == "女装"
    assert tasks[0]["productTitle"] == "夏季纯棉套装"
