from __future__ import annotations

import hashlib
import http.cookiejar
import json
import random
import string
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from auth_store import AuthStore, StoredSession


SIGN_KEY = "s.0wl?.i_s43$i1_"
SESSION_EXPIRED_CODES = {4001, 4401, 4433}


class ApiError(Exception):
    pass


class SessionExpired(ApiError):
    pass


class ApiClient:
    def __init__(self, store: AuthStore) -> None:
        self.store = store
        self.session = store.load()
        self.cookie_jar = http.cookiejar.MozillaCookieJar(str(store.cookie_file))
        if store.cookie_file.exists():
            try:
                self.cookie_jar.load(ignore_discard=True, ignore_expires=True)
            except (OSError, http.cookiejar.LoadError):
                pass
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cookie_jar))

    @property
    def base_url(self) -> str:
        return self.session.api_base_url.rstrip("/")

    def set_base_url(self, base_url: str) -> None:
        self.session.api_base_url = base_url.rstrip("/")
        self.store.save(self.session)

    def login(self, base_url: str, username: str, password: str) -> dict[str, Any]:
        self.set_base_url(base_url)
        response = self.post("/auth/login", {"uname": username, "pwd": password})
        data = response.get("data") or {}
        token = data.get("token") or ""
        if not token:
            raise ApiError(response.get("msg") or "登录失败")
        self.session = StoredSession(
            api_base_url=self.base_url,
            token=token,
            user={
                "uid": data.get("uid"),
                "nick": data.get("nick"),
                "roles": data.get("roles") or [],
                "perms": data.get("perms") or [],
            },
        )
        self.store.save(self.session)
        self._save_cookies()
        return self.session.user

    def validate_session(self) -> dict[str, Any]:
        response = self.get("/auth/info")
        data = response.get("data") or {}
        if data:
            self.session.user.update(data)
            self.store.save(self.session)
        return data

    def logout(self) -> None:
        try:
            self.post("/auth/logout", {})
        finally:
            self.store.clear()
            self.session = StoredSession(api_base_url=self.session.api_base_url)
            self.cookie_jar.clear()

    def update_account(self, account: dict[str, Any]) -> None:
        self.post("/base/account/update", account)

    def sync_publish_account_status(self, account_id: object, status: str) -> None:
        self.post("/publish/account/sync/status", {"accountId": account_id, "status": status})

    def sync_robot_heartbeat(self, payload: dict[str, Any]) -> dict[str, Any]:
        response = self.post("/base/robot/heartbeat", payload)
        data = response.get("data")
        return data if isinstance(data, dict) else {}

    def poll_robot_command(self, payload: dict[str, Any]) -> dict[str, Any]:
        response = self.post("/base/robot/command/poll", payload)
        data = response.get("data")
        return data if isinstance(data, dict) else {}

    def poll_publish_account_task(self) -> dict[str, Any]:
        response = self.get("/publish/account/task/poll")
        data = response.get("data")
        return data if isinstance(data, dict) else {}

    def get(self, path: str) -> dict[str, Any]:
        return self._request("GET", path)

    def post(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        return self._request("POST", path, body)

    def _request(self, method: str, path: str, body: bytes | None = None) -> dict[str, Any]:
        url = self._build_url(path)
        uri = self._uri_for_signature(url)
        headers = self._signature_headers(uri)
        headers["Accept"] = "application/json"
        if body is not None:
            headers["Content-Type"] = "application/json;charset=UTF-8"

        request = urllib.request.Request(url, data=body, headers=headers, method=method)
        try:
            with self.opener.open(request, timeout=30) as response:
                raw = response.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            if exc.code in (401, 302):
                raise SessionExpired("登录已失效，请重新登录") from exc
            detail = exc.read().decode("utf-8", errors="ignore")
            raise ApiError(detail or f"请求失败：HTTP {exc.code}") from exc
        except urllib.error.URLError as exc:
            raise ApiError(f"网络连接失败：{exc.reason}") from exc

        try:
            data = json.loads(raw) if raw else {}
        except json.JSONDecodeError as exc:
            raise ApiError("服务端返回了非 JSON 数据") from exc

        code = int(data.get("code", 0))
        if code in SESSION_EXPIRED_CODES:
            raise SessionExpired(data.get("msg") or "登录已失效，请重新登录")
        if code != 0:
            raise ApiError(data.get("msg") or "请求失败")
        self._save_cookies()
        return data

    def _build_url(self, path: str) -> str:
        if path.startswith("http://") or path.startswith("https://"):
            return path
        return f"{self.base_url}/{path.lstrip('/')}"

    def _uri_for_signature(self, url: str) -> str:
        parsed = urllib.parse.urlparse(url)
        pathname = parsed.path or "/"
        if pathname.startswith("/api"):
            pathname = pathname[4:] or "/"
        return pathname

    def _signature_headers(self, uri: str) -> dict[str, str]:
        timestamp = str(int(time.time() * 1000))
        nonce = self._nonce()
        sign_source = f"nonceStr={nonce}&timestamp={timestamp}&uri={uri}&key={SIGN_KEY}"
        signature = hashlib.md5(sign_source.encode("utf-8")).hexdigest().lower()
        return {
            "signature": signature,
            "timestamp": timestamp,
            "nonceStr": nonce,
            "uri": uri,
        }

    def _nonce(self) -> str:
        alphabet = string.ascii_lowercase + string.digits
        return "".join(random.choice(alphabet) for _ in range(24))

    def _save_cookies(self) -> None:
        try:
            self.cookie_jar.save(ignore_discard=True, ignore_expires=True)
        except OSError:
            pass
