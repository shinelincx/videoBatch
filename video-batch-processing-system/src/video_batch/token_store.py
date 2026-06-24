"""Token 存储模块 - 使用 AES-256 加密安全存储认证令牌。

TokenStore 类提供加密的 token 持久化存储：
  - 使用 Fernet (AES-256-CBC) 对称加密
  - 加密密钥存储在 key.key 文件中，首次使用时自动生成
  - token 数据以 JSON 格式加密后存储在 token.enc 文件中
  - 支持判断 token 是否临近过期或已过期

过期策略:
  - access_token: 23 小时后认为临近过期（后台 cookie session 场景会额外校验）
  - refresh_token: 7 天后认为已过期
"""
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

from cryptography.fernet import Fernet

from video_batch.auth import TokenPair

# 加密相关文件名称
_KEY_FILE = "key.key"           # 加密密钥文件
_TOKEN_FILE = "token.enc"       # 加密 token 文件
# 过期时间配置
_ACCESS_EXPIRY_HOURS = 23       # access_token 临近过期阈值（小时）
_REFRESH_EXPIRY_DAYS = 7        # refresh_token 彻底过期阈值（天）


class TokenStore:
    """加密 Token 存储器，负责 token 的安全持久化和过期检查。

    使用 Fernet 对称加密确保 token 文件不会被明文存储。
    密钥文件 (key.key) 和 token 文件 (token.enc) 都存储在 storage_dir 目录下。

    属性:
        _dir: 存储目录路径
        _fernet: Fernet 加密器实例
    """

    def __init__(self, storage_dir: Path) -> None:
        """初始化 TokenStore，创建存储目录和加密器。

        参数:
            storage_dir: 用于存储加密 token 的目录路径
        """
        self._dir = Path(storage_dir)
        self._dir.mkdir(parents=True, exist_ok=True)
        self._fernet = self._get_or_create_fernet()

    def save(self, tokens: TokenPair) -> None:
        """加密并保存 token 对到文件。

        将 token 数据序列化为 JSON，添加当前时间戳，然后使用 Fernet 加密后写入文件。

        参数:
            tokens: 要保存的 TokenPair 对象
        """
        saved_at = datetime.now(timezone.utc)
        data = {
            "access_token": tokens.access_token,
            "refresh_token": tokens.refresh_token,
            "saved_at": saved_at.isoformat(),
        }
        encrypted = self._fernet.encrypt(json.dumps(data).encode())
        (self._dir / _TOKEN_FILE).write_bytes(encrypted)

    def load(self) -> TokenPair | None:
        """加载并解密存储的 token。

        读取 token.enc 文件，解密后解析为 TokenPair 对象。
        如果文件不存在，返回 None。

        返回:
            解密后的 TokenPair 对象，如果文件不存在则返回 None
        """
        token_path = self._dir / _TOKEN_FILE
        if not token_path.exists():
            return None
        decrypted = self._fernet.decrypt(token_path.read_bytes())
        data = json.loads(decrypted)
        return TokenPair(
            access_token=data["access_token"],
            refresh_token=data["refresh_token"],
            saved_at=datetime.fromisoformat(data["saved_at"]),
        )

    def clear(self) -> None:
        """清除本地保存的 token。"""
        token_path = self._dir / _TOKEN_FILE
        if token_path.exists():
            token_path.unlink()

    def is_access_near_expiry(self) -> bool:
        """检查 access_token 是否临近过期。

        如果 token 保存时间已超过 _ACCESS_EXPIRY_HOURS 小时，则认为临近过期。

        返回:
            True 表示临近过期，需要刷新；False 表示正常或无 token
        """
        token = self.load()
        if token is None or token.saved_at is None:
            return False
        elapsed = datetime.now(timezone.utc) - token.saved_at
        return elapsed > timedelta(hours=_ACCESS_EXPIRY_HOURS)

    def is_refresh_expired(self) -> bool:
        """检查 refresh_token 是否已彻底过期。

        如果 token 保存时间已超过 _REFRESH_EXPIRY_DAYS 天，则认为 refresh_token 过期，
        无法再用于刷新 access_token，需要重新登录。

        返回:
            True 表示 refresh_token 已过期，需要重新登录；False 表示仍可使用
        """
        token = self.load()
        if token is None or token.saved_at is None:
            return False
        elapsed = datetime.now(timezone.utc) - token.saved_at
        return elapsed > timedelta(days=_REFRESH_EXPIRY_DAYS)

    def _get_or_create_fernet(self) -> Fernet:
        """获取或创建 Fernet 加密器。

        检查 key.key 文件是否存在：
        - 存在：读取已有密钥
        - 不存在：生成新密钥并写入文件

        返回:
            配置好的 Fernet 加密器实例
        """
        key_path = self._dir / _KEY_FILE
        if key_path.exists():
            return Fernet(key_path.read_bytes())
        key = Fernet.generate_key()
        key_path.write_bytes(key)
        return Fernet(key)
