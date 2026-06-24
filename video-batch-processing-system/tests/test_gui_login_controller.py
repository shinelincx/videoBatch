from unittest.mock import MagicMock, patch

import pytest
from PySide6.QtCore import QTimer

from video_batch.auth import AuthError, TokenPair
from video_batch.token_manager import ReAuthNeeded


@pytest.fixture
def mock_window(qapp):
    from video_batch.gui.main_window import MainWindow
    window = MagicMock(spec=MainWindow)
    window.login_page = MagicMock()
    window.user_panel = MagicMock()
    return window


@pytest.fixture
def mock_auth_client():
    return MagicMock()


@pytest.fixture
def mock_token_store():
    store = MagicMock()
    store.load.return_value = None
    store.is_access_near_expiry.return_value = False
    store.is_refresh_expired.return_value = False
    return store


@pytest.fixture
def mock_token_manager():
    mgr = MagicMock()
    mgr.ensure_valid_token.side_effect = ReAuthNeeded("默认无有效token")
    return mgr


@pytest.fixture
def mock_app_config():
    config = MagicMock()
    config.remember_username = False
    config.saved_username = ""
    return config


@pytest.fixture
def mock_logger():
    return MagicMock()


def _create_controller(mock_window, mock_auth_client, mock_token_store,
                       mock_token_manager, mock_app_config, mock_logger):
    from video_batch.gui.login_controller import LoginController
    return LoginController(
        window=mock_window,
        auth_client=mock_auth_client,
        token_store=mock_token_store,
        token_manager=mock_token_manager,
        app_config=mock_app_config,
        logger=mock_logger,
    )


class TestLoginSuccess:
    """登录成功流程测试"""

    def test_login_success_saves_token_and_switches_page(
        self, mock_window, mock_auth_client, mock_token_store,
        mock_token_manager, mock_app_config, mock_logger
    ):
        token_pair = TokenPair(access_token="at-1", refresh_token="rt-1")
        mock_auth_client.login.return_value = token_pair

        controller = _create_controller(
            mock_window, mock_auth_client, mock_token_store,
            mock_token_manager, mock_app_config, mock_logger
        )

        controller._on_login_requested("user", "pass", False)

        mock_auth_client.login.assert_called_once_with("user", "pass")
        mock_token_store.save.assert_called_once_with(token_pair)
        mock_window.show_user_panel.assert_called_once_with("user")

    def test_login_success_with_remember_saves_username(
        self, mock_window, mock_auth_client, mock_token_store,
        mock_token_manager, mock_app_config, mock_logger
    ):
        mock_auth_client.login.return_value = TokenPair(access_token="at", refresh_token="rt")

        controller = _create_controller(
            mock_window, mock_auth_client, mock_token_store,
            mock_token_manager, mock_app_config, mock_logger
        )

        controller._on_login_requested("user", "pass", True)

        assert mock_app_config.remember_username is True
        assert mock_app_config.saved_username == "user"
        mock_app_config.save.assert_called_once()

    def test_login_success_without_remember_clears_saved_username(
        self, mock_window, mock_auth_client, mock_token_store,
        mock_token_manager, mock_app_config, mock_logger
    ):
        mock_auth_client.login.return_value = TokenPair(access_token="at", refresh_token="rt")

        controller = _create_controller(
            mock_window, mock_auth_client, mock_token_store,
            mock_token_manager, mock_app_config, mock_logger
        )

        controller._on_login_requested("user", "pass", False)

        assert mock_app_config.remember_username is False
        assert mock_app_config.saved_username == ""


class TestLoginFailure:
    """登录失败流程测试"""

    def test_login_failure_shows_error_dialog(
        self, mock_window, mock_auth_client, mock_token_store,
        mock_token_manager, mock_app_config, mock_logger
    ):
        mock_auth_client.login.side_effect = AuthError("用户名或密码错误")

        controller = _create_controller(
            mock_window, mock_auth_client, mock_token_store,
            mock_token_manager, mock_app_config, mock_logger
        )

        with patch("PySide6.QtWidgets.QMessageBox.warning") as mock_warning:
            controller._on_login_requested("user", "wrong", False)

        mock_warning.assert_called_once()
        args = mock_warning.call_args
        assert "登录失败" in str(args[0][1])
        assert "用户名或密码错误" in str(args[0][2])

        mock_token_store.save.assert_not_called()
        mock_window.show_user_panel.assert_not_called()

    def test_login_failure_does_not_switch_page(
        self, mock_window, mock_auth_client, mock_token_store,
        mock_token_manager, mock_app_config, mock_logger
    ):
        mock_auth_client.login.side_effect = AuthError("error")

        controller = _create_controller(
            mock_window, mock_auth_client, mock_token_store,
            mock_token_manager, mock_app_config, mock_logger
        )

        with patch("PySide6.QtWidgets.QMessageBox.warning"):
            controller._on_login_requested("user", "wrong", False)

        mock_window.show_user_panel.assert_not_called()


class TestLogout:
    """退出登录流程测试"""

    def test_logout_switches_to_login_and_clears_inputs(
        self, mock_window, mock_auth_client, mock_token_store,
        mock_token_manager, mock_app_config, mock_logger
    ):
        controller = _create_controller(
            mock_window, mock_auth_client, mock_token_store,
            mock_token_manager, mock_app_config, mock_logger
        )

        controller._on_logout_requested()

        mock_window.show_login.assert_called_once()


class TestAutoLogin:
    """自动登录流程测试"""

    def test_auto_login_when_valid_token_exists(
        self, mock_window, mock_auth_client, mock_token_store,
        mock_token_manager, mock_app_config, mock_logger
    ):
        valid_token = TokenPair(access_token="at-valid", refresh_token="rt-valid")
        mock_token_manager.ensure_valid_token.side_effect = None
        mock_token_manager.ensure_valid_token.return_value = valid_token
        mock_token_store.is_refresh_expired.return_value = False

        _create_controller(
            mock_window, mock_auth_client, mock_token_store,
            mock_token_manager, mock_app_config, mock_logger
        )

        mock_token_manager.ensure_valid_token.assert_called_once()
        mock_window.show_user_panel.assert_called_once_with("")

    def test_no_auto_login_when_no_token(
        self, mock_window, mock_auth_client, mock_token_store,
        mock_token_manager, mock_app_config, mock_logger
    ):
        mock_token_manager.ensure_valid_token.side_effect = ReAuthNeeded("无token")

        _create_controller(
            mock_window, mock_auth_client, mock_token_store,
            mock_token_manager, mock_app_config, mock_logger
        )

        mock_window.show_user_panel.assert_not_called()

    def test_no_auto_login_when_refresh_expired(
        self, mock_window, mock_auth_client, mock_token_store,
        mock_token_manager, mock_app_config, mock_logger
    ):
        mock_token_manager.ensure_valid_token.side_effect = ReAuthNeeded("过期")

        _create_controller(
            mock_window, mock_auth_client, mock_token_store,
            mock_token_manager, mock_app_config, mock_logger
        )

        mock_window.show_user_panel.assert_not_called()


class TestRememberUsername:
    """记住用户名测试"""

    def test_startup_restores_remembered_username(
        self, mock_window, mock_auth_client, mock_token_store,
        mock_token_manager, mock_app_config, mock_logger
    ):
        mock_app_config.remember_username = True
        mock_app_config.saved_username = "saved_user"
        mock_token_manager.ensure_valid_token.side_effect = ReAuthNeeded("无token")

        _create_controller(
            mock_window, mock_auth_client, mock_token_store,
            mock_token_manager, mock_app_config, mock_logger
        )

        mock_window.login_page.set_remembered_username.assert_called_once_with("saved_user")


class TestTokenRefresh:
    """Token 自动刷新测试"""

    def test_refresh_timer_is_started_after_login(
        self, mock_window, mock_auth_client, mock_token_store,
        mock_token_manager, mock_app_config, mock_logger
    ):
        mock_auth_client.login.return_value = TokenPair(access_token="at", refresh_token="rt")

        controller = _create_controller(
            mock_window, mock_auth_client, mock_token_store,
            mock_token_manager, mock_app_config, mock_logger
        )

        assert controller._refresh_timer is not None
        assert isinstance(controller._refresh_timer, QTimer)

    def test_refresh_timer_triggers_token_refresh(
        self, mock_window, mock_auth_client, mock_token_store,
        mock_token_manager, mock_app_config, mock_logger
    ):
        mock_auth_client.login.return_value = TokenPair(access_token="at", refresh_token="rt")

        controller = _create_controller(
            mock_window, mock_auth_client, mock_token_store,
            mock_token_manager, mock_app_config, mock_logger
        )

        mock_token_manager.ensure_valid_token.reset_mock()
        mock_token_manager.ensure_valid_token.side_effect = None
        mock_token_manager.ensure_valid_token.return_value = TokenPair(
            access_token="at-refreshed", refresh_token="rt-refreshed"
        )

        controller._on_token_refresh_timeout()

        mock_token_manager.ensure_valid_token.assert_called()

    def test_refresh_failure_triggers_relogin(
        self, mock_window, mock_auth_client, mock_token_store,
        mock_token_manager, mock_app_config, mock_logger
    ):
        mock_auth_client.login.return_value = TokenPair(access_token="at", refresh_token="rt")
        mock_token_manager.ensure_valid_token.side_effect = ReAuthNeeded("刷新失败")

        controller = _create_controller(
            mock_window, mock_auth_client, mock_token_store,
            mock_token_manager, mock_app_config, mock_logger
        )

        with patch("PySide6.QtWidgets.QMessageBox.warning") as mock_warning:
            controller._on_token_refresh_timeout()

        mock_warning.assert_called_once()
        args = mock_warning.call_args
        assert "重新登录" in str(args[0][1])
        mock_window.show_login.assert_called_once()
