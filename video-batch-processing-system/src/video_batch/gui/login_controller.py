from PySide6.QtCore import QObject, QTimer
from PySide6.QtWidgets import QMessageBox

from video_batch.auth import AuthClient, AuthError
from video_batch.gui.app_config import AppConfig
from video_batch.gui.config_sync_worker import ConfigSyncWorker
from video_batch.gui.login_page import LoginPage
from video_batch.gui.main_window import MainWindow
from video_batch.gui.user_panel_controller import UserPanelController
from video_batch.gui.user_panel_page import UserPanelPage
from video_batch.logger import Logger
from video_batch.token_manager import ReAuthNeeded, TokenManager
from video_batch.token_store import TokenStore

_TOKEN_REFRESH_INTERVAL_MS = 60 * 60 * 1000


class LoginController(QObject):
    """登录控制器，协调认证流程、Token 管理和页面路由。

    职责:
      - 连接登录页/用户面板的信号
      - 处理登录、退出登录流程
      - 管理自动登录（已有有效 Token 时跳过登录页）
      - 定时刷新 Token（每小时一次）
      - 记住用户名功能
    """

    def __init__(
        self,
        window: MainWindow,
        auth_client: AuthClient,
        token_store: TokenStore,
        token_manager: TokenManager,
        app_config: AppConfig,
        logger: Logger,
        user_panel_controller: UserPanelController | None = None,
        config_sync_worker: ConfigSyncWorker | None = None,
    ) -> None:
        super().__init__()
        self._window = window
        self._auth_client = auth_client
        self._token_store = token_store
        self._token_manager = token_manager
        self._app_config = app_config
        self._logger = logger
        self._user_panel_controller = user_panel_controller
        self._config_sync_worker = config_sync_worker

        self._current_username = ""

        self._window.login_page.login_requested.connect(self._on_login_requested)
        self._window.user_panel.logout_requested.connect(self._on_logout_requested)

        self._refresh_timer = QTimer(self)
        self._refresh_timer.setInterval(_TOKEN_REFRESH_INTERVAL_MS)
        self._refresh_timer.timeout.connect(self._on_token_refresh_timeout)

        if self._user_panel_controller is not None:
            self._user_panel_controller.session_expired.connect(self._on_session_expired)

        self._try_auto_login()

    def _on_login_requested(self, username: str, password: str, remember: bool) -> None:
        try:
            token_pair = self._auth_client.login(username, password)
        except AuthError as e:
            QMessageBox.warning(self._window, "登录失败", str(e))
            return

        self._current_username = username
        self._token_store.save(token_pair)

        if remember:
            self._app_config.remember_username = True
            self._app_config.saved_username = username
        else:
            self._app_config.remember_username = False
            self._app_config.saved_username = ""
        self._app_config.save()

        self._show_authenticated(username, token_pair.access_token)

    def _on_logout_requested(self) -> None:
        self._refresh_timer.stop()
        self._current_username = ""
        try:
            self._auth_client.logout()
        except Exception:
            pass
        self._token_store.clear()
        self._window.show_login()

    def _try_auto_login(self) -> None:
        if self._app_config.remember_username and self._app_config.saved_username:
            self._current_username = self._app_config.saved_username
            self._window.login_page.set_remembered_username(
                self._app_config.saved_username
            )

        try:
            token_pair = self._token_manager.ensure_valid_token()
        except ReAuthNeeded:
            self._token_store.clear()
            return

        self._show_authenticated(self._current_username, token_pair.access_token)

    def _on_token_refresh_timeout(self) -> None:
        try:
            self._token_manager.ensure_valid_token()
        except ReAuthNeeded as e:
            self._on_session_expired(str(e))

    def _show_authenticated(self, username: str, access_token: str) -> None:
        if self._user_panel_controller is not None:
            self._user_panel_controller.set_access_token(access_token)
        self._window.show_user_panel(username)
        self._refresh_timer.start()
        if self._config_sync_worker is not None:
            self._config_sync_worker.sync(access_token)

    def _on_session_expired(self, message: str = "") -> None:
        self._refresh_timer.stop()
        self._current_username = ""
        self._token_store.clear()
        QMessageBox.warning(
            self._window,
            "需要重新登录",
            message or "登录已过期，请重新登录。",
        )
        self._window.show_login()
