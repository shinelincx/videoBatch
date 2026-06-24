"""授权认证模块 - 动态 API Key 管理"""

import json
import os
import secrets
from datetime import datetime, timezone
from typing import Optional

from fastapi import Header, HTTPException

from app.config import AUTH_ENABLED, TOKEN_FILE


class TokenStore:
    """Token 存储管理：内存缓存 + JSON 文件持久化"""

    def __init__(self, file_path: str):
        self._file_path = file_path
        self._tokens: list[dict] = []
        self._load()

    def _load(self):
        """从 JSON 文件加载 tokens"""
        if os.path.exists(self._file_path):
            try:
                with open(self._file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self._tokens = data.get("tokens", [])
            except (json.JSONDecodeError, IOError):
                self._tokens = []
        else:
            self._tokens = []

    def _save(self):
        """写回 JSON 文件"""
        with open(self._file_path, "w", encoding="utf-8") as f:
            json.dump({"tokens": self._tokens}, f, ensure_ascii=False, indent=2)

    def validate(self, key: str) -> bool:
        """校验 token 是否有效且启用"""
        for t in self._tokens:
            if t["key"] == key and t.get("enabled", True):
                return True
        return False

    def create(self, description: str = "") -> str:
        """创建新 token，返回完整 key"""
        key = "cw-" + secrets.token_hex(16)  # cw- + 32 位 hex
        self._tokens.append({
            "key": key,
            "description": description,
            "created_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "enabled": True,
        })
        self._save()
        return key

    def list_tokens(self) -> list[dict]:
        """列出所有 token（脱敏：只显示前缀）"""
        result = []
        for t in self._tokens:
            key = t["key"]
            masked = key[:8] + "*" * (len(key) - 8) if len(key) > 8 else "****"
            result.append({
                "key_preview": masked,
                "description": t.get("description", ""),
                "created_at": t.get("created_at", ""),
                "enabled": t.get("enabled", True),
            })
        return result

    def revoke(self, key: str) -> bool:
        """禁用指定 token"""
        for t in self._tokens:
            if t["key"] == key:
                t["enabled"] = False
                self._save()
                return True
        return False

    @property
    def is_empty(self) -> bool:
        return len(self._tokens) == 0


# 单例
_token_store: Optional[TokenStore] = None


def get_token_store() -> TokenStore:
    """获取 TokenStore 单例"""
    global _token_store
    if _token_store is None:
        _token_store = TokenStore(TOKEN_FILE)
    return _token_store


# FastAPI 依赖：从 Authorization header 提取并验证 token
async def verify_token(authorization: str = Header(None)) -> str:
    """FastAPI 依赖 - 仅在 AUTH_ENABLED 时校验，否则放行"""
    if not AUTH_ENABLED:
        return "anonymous"

    if not authorization:
        raise HTTPException(status_code=401, detail="缺少 Authorization 请求头")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Authorization 格式错误，应为 Bearer <token>")

    store = get_token_store()
    if not store.validate(token):
        raise HTTPException(status_code=401, detail="Token 无效或已禁用")

    return token


def validate_cli_token(token: str) -> bool:
    """CLI 专用 token 校验"""
    store = get_token_store()
    return store.validate(token)
