"""认证模块 - 对接后台登录、签名请求和登录态过期处理。"""
import hashlib
import json
import secrets
import time
from dataclasses import dataclass, field
from datetime import datetime
from typing import TYPE_CHECKING
from urllib.parse import urlparse

if TYPE_CHECKING:
    from video_batch.logger import Logger

_SIGN_KEY = "s.0wl?.i_s43$i1_"
_SESSION_EXPIRED_CODES = {4001, 4433}


@dataclass
class TokenPair:
    """认证 token 对。

    后台实际使用 Shiro session cookie 鉴权，登录接口返回的 token 仅作为
    本地“已登录”凭据保存；refresh_token 复用该 token 以兼容既有流程。
    """

    access_token: str
    refresh_token: str
    saved_at: datetime | None = field(default=None)


class AuthError(Exception):
    """认证或后台 API 异常。"""

    pass


class SessionExpiredError(AuthError):
    """后台登录态已过期，需要重新登录。"""

    pass


class AuthClient:
    """认证客户端，封装后台 Shiro 登录及签名请求。"""

    def __init__(self, base_url: str, http_session, logger: "Logger | None" = None) -> None:
        self._base_url = base_url.rstrip("/")
        self._http = http_session
        self._logger = logger

    def login(self, username: str, password: str) -> TokenPair:
        """用户登录，后台接口为 POST /auth/login，字段为 uname/pwd。"""
        response = self._signed_request(
            "POST",
            "/auth/login",
            json={"uname": username, "pwd": password},
        )
        try:
            data = self._unwrap_response(response)
        except AuthError as e:
            self._log_auth_error(str(e))
            raise

        if not isinstance(data, dict):
            raise AuthError("登录返回格式异常")

        token = data.get("token")
        if token:
            return TokenPair(access_token=str(token), refresh_token=str(token))

        # 兼容旧 mock/测试服务返回的 access_token/refresh_token 结构。
        if data.get("access_token") and data.get("refresh_token"):
            return TokenPair(
                access_token=str(data["access_token"]),
                refresh_token=str(data["refresh_token"]),
            )

        raise AuthError("登录返回缺少 token")

    def refresh_session(self, refresh_token: str) -> TokenPair:
        """校验当前 Shiro session 是否仍有效。

        后台没有 refresh token 接口；访问 /auth/info 成功即表示 cookie session
        有效，返回原 token 以刷新本地保存时间。若 session 失效会抛出
        SessionExpiredError。
        """
        if not refresh_token:
            raise SessionExpiredError("登录已过期，请重新登录")

        response = self._signed_request("GET", "/auth/info")
        self._unwrap_response(response)
        return TokenPair(access_token=refresh_token, refresh_token=refresh_token)

    def logout(self) -> None:
        """退出后台登录态。"""
        response = self._signed_request("POST", "/auth/logout")
        self._unwrap_response(response)

    def fetch_config(self, access_token: str) -> dict:
        """获取服务端配置数据。"""
        response = self._signed_request("GET", "/clip_config/config_map")
        data = self._unwrap_response(response)
        return data if isinstance(data, dict) else {}

    def fetch_tasks(self, access_token: str) -> list[dict]:
        """获取待剪辑任务列表。"""
        if self._logger:
            self._logger.info(
                task_id="tasks",
                module="任务面板",
                message="请求待剪辑任务: GET /clip_record/pending_clip/list",
            )
        response = self._signed_request(
            "GET",
            "/clip_record/pending_clip/list",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        data = self._unwrap_response(response)
        if self._logger:
            self._logger.info(
                task_id="tasks",
                module="任务面板",
                message=f"任务列表响应: {json.dumps(data, ensure_ascii=False)[:500]}",
            )
        if data in (None, {}):
            return []
        if isinstance(data, list):
            tasks = [self._normalize_task(item) for item in data if isinstance(item, dict)]
            if self._logger:
                self._logger.info(
                    task_id="tasks",
                    module="任务面板",
                    message=f"获取到 {len(tasks)} 个待剪辑任务",
                )
            return tasks
        if isinstance(data, dict):
            tasks = [self._normalize_task(data)]
            if self._logger:
                self._logger.info(
                    task_id="tasks",
                    module="任务面板",
                    message=f"获取到 1 个待剪辑任务（单对象格式）",
                )
            return tasks
        return []

    def _signed_request(self, method: str, path: str, **kwargs):
        headers = dict(kwargs.pop("headers", {}) or {})
        if "json" in kwargs and "Content-Type" not in headers:
            headers["Content-Type"] = "application/json"
        headers = {**self._signed_headers(path), **headers}

        request = getattr(self._http, method.lower())
        return request(self._url(path), headers=headers, **kwargs)

    def _url(self, path: str) -> str:
        if path.startswith("http://") or path.startswith("https://"):
            return path
        normalized_path = path if path.startswith("/") else f"/{path}"
        return f"{self._base_url}{normalized_path}"

    def _signed_headers(self, path: str) -> dict[str, str]:
        timestamp = str(int(time.time() * 1000))
        nonce_str = secrets.token_hex(12)
        uri = self._signature_uri(path)
        params = {
            "timestamp": timestamp,
            "nonceStr": nonce_str,
            "uri": uri,
        }
        sign_str = "&".join(f"{key}={params[key]}" for key in sorted(params))
        signature = hashlib.md5(f"{sign_str}&key={_SIGN_KEY}".encode("utf-8")).hexdigest()
        return {
            "signature": signature.lower(),
            "timestamp": timestamp,
            "nonceStr": nonce_str,
            "uri": uri,
        }

    def _signature_uri(self, path: str) -> str:
        parsed = urlparse(path)
        pathname = parsed.path or "/"
        if pathname.startswith("/api/"):
            pathname = pathname[4:]
        elif pathname == "/api":
            pathname = "/"
        if len(pathname) > 1 and pathname.endswith("/"):
            pathname = pathname[:-1]
        return pathname or "/"

    def _unwrap_response(self, response):
        status_code = getattr(response, "status_code", 200)
        body = self._response_json(response)

        if status_code in {302, 401}:
            raise SessionExpiredError(self._message_from_body(body, "登录已过期，请重新登录"))
        if status_code != 200:
            raise AuthError(self._message_from_body(body, f"请求失败：HTTP {status_code}"))

        if not isinstance(body, dict):
            return body

        if "code" not in body:
            return body

        code = self._int_code(body.get("code"))
        msg = str(body.get("msg") or "请求失败")
        if code in _SESSION_EXPIRED_CODES:
            raise SessionExpiredError(msg)
        if code != 0:
            raise AuthError(msg)
        return body.get("data", {})

    def _response_json(self, response):
        try:
            return response.json()
        except Exception as e:
            raise AuthError("服务端返回格式异常") from e

    def _message_from_body(self, body, default: str) -> str:
        if isinstance(body, dict):
            return str(body.get("msg") or body.get("detail") or default)
        return default

    def _int_code(self, code) -> int:
        try:
            return int(code)
        except (TypeError, ValueError):
            return -1

    def _normalize_task(self, task: dict) -> dict:
        normalized = dict(task)
        task_type = self._first_value(task, "type", "taskType") or "task"
        account_id = self._first_value(task, "accountId", "account_id")
        publish_account_id = self._first_value(
            task,
            "publishAccountId",
            "publish_account_id",
        )
        create_time = self._first_value(task, "createTime", "created_at", "create_time")
        product_category_name = self._first_value(task, "productCategoryName")
        product_title = self._first_value(task, "productTitle")

        task_id = self._first_value(task, "id", "taskId", "task_id")
        if task_id is None:
            id_parts = [task_type, account_id or publish_account_id, create_time]
            task_id = "-".join(str(part) for part in id_parts if part not in (None, ""))

        productId = self._first_value(task, "productId", "material_id", "materialId", "material")
        if productId is None:
            productId = account_id or publish_account_id or task_id

        config = task.get("config") if isinstance(task.get("config"), dict) else {}
        config_id = self._first_value(task, "config_id", "configId", "clipConfigCode")
        if config_id is None and config:
            config_id = self._first_value(config, "id", "config_id", "configId", "clipConfigCode")

        normalized["id"] = str(task_id or "")
        normalized["productId"] = str(productId or "")
        normalized["material_id"] = str(productId or "")
        normalized["status"] = str(task.get("status") or "待剪辑")
        if config_id is not None:
            normalized["config_id"] = str(config_id)
        if product_category_name is not None:
            normalized["productCategoryName"] = str(product_category_name)
        if product_title is not None:
            normalized["productTitle"] = str(product_title)
        return normalized

    def _first_value(self, data: dict, *keys: str):
        for key in keys:
            value = data.get(key)
            if value not in (None, ""):
                return value
        return None

    def _log_auth_error(self, message: str) -> None:
        if self._logger:
            self._logger.error(task_id="auth", module="认证", message=message)
