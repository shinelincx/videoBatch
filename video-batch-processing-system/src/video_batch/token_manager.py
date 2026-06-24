"""Token 生命周期管理 - 负责 token 的自动刷新和有效性保障。

TokenManager 类监控 token 状态，在 access_token 临近过期时自动刷新，
在 refresh_token 过期时提示需要重新登录。对后台 Shiro session 场景，
也支持每次检查时访问 /auth/info 验证 cookie 是否仍有效。

依赖关系：
  - TokenStore: 用于加载和保存加密 token
  - refresh_func: 外部传入的刷新函数（通常由 AuthClient 或 HTTP 会话提供）
"""
from collections.abc import Callable

from video_batch.auth import TokenPair
from video_batch.token_store import TokenStore


class ReAuthNeeded(Exception):
    """需要重新登录异常，当 refresh_token 过期或刷新失败时抛出。"""
    pass


class TokenManager:
    """Token 生命周期管理器，自动处理 token 刷新和过期检查。

    工作流程：
      1. 加载当前存储的 token
      2. 检查 refresh_token 是否过期（过期则需要重新登录）
      3. 检查 access_token 是否临近过期（是则自动刷新）
      4. 返回有效的 token

    属性:
        _store: TokenStore 实例，用于 token 持久化
        _refresh: 刷新函数，接收 refresh_token 返回新的 TokenPair
        _logger: 日志记录器
    """

    def __init__(
        self,
        store: TokenStore,
        refresh_func: Callable[[str], TokenPair],
        logger,
        verify_on_check: bool = False,
    ) -> None:
        """初始化 TokenManager。

        参数:
            store: TokenStore 实例，用于 token 的加载和保存
            refresh_func: 刷新函数，签名为 (refresh_token: str) -> TokenPair
            logger: 日志记录器实例
            verify_on_check: 每次 ensure_valid_token 都调用 refresh_func 校验登录态
        """
        self._store = store
        self._refresh = refresh_func
        self._logger = logger
        self._verify_on_check = verify_on_check

    def ensure_valid_token(self) -> TokenPair:
        """确保返回有效的 access_token。

        检查 token 状态并按需刷新：
        - 无 token 或 refresh_token 过期：抛出 ReAuthNeeded
        - access_token 临近过期：自动刷新并保存新 token
        - token 正常：直接返回当前 token

        返回:
            有效的 TokenPair 对象
        抛出:
            ReAuthNeeded: 需要重新登录时抛出
        """
        current = self._store.load()
        if current is None:
            raise ReAuthNeeded("没有已保存的 token")

        if self._store.is_refresh_expired():
            raise ReAuthNeeded("RefreshToken 已过期，需要重新登录")

        if self._verify_on_check or self._store.is_access_near_expiry():
            # access_token 临近过期，或后台 cookie session 需要即时校验。
            try:
                new_tokens = self._refresh(current.refresh_token)
                self._store.save(new_tokens)
                self._logger.info(task_id="auth", module="Token管理", message="登录态已校验")
                return new_tokens
            except Exception as e:
                raise ReAuthNeeded(f"登录态校验失败: {e}") from e

        return current
