from unittest.mock import MagicMock, patch

import pytest

from video_batch.auth import SessionExpiredError, TokenPair


class TestUserPanelController:
    """用户面板控制器测试"""

    @pytest.fixture
    def mock_window(self, qapp):
        window = MagicMock()
        window.user_panel = MagicMock()
        window.user_panel.material_dir_widget = MagicMock()
        window.user_panel.task_table = MagicMock()
        window.login_page = MagicMock()
        return window

    @pytest.fixture
    def mock_auth_client(self):
        return MagicMock()

    @pytest.fixture
    def mock_app_config(self):
        config = MagicMock()
        config.material_dir = ""
        return config

    @pytest.fixture
    def mock_logger(self):
        return MagicMock()

    @pytest.fixture
    def valid_token(self):
        return TokenPair(access_token="at", refresh_token="rt")

    def _create_controller(self, mock_window, mock_auth_client,
                           mock_app_config, mock_logger, valid_token):
        mock_auth_client.fetch_tasks.reset_mock()
        with patch("video_batch.gui.user_panel_controller.QMessageBox.warning"):
            from video_batch.gui.user_panel_controller import UserPanelController
            return UserPanelController(
                window=mock_window,
                auth_client=mock_auth_client,
                access_token=valid_token.access_token,
                app_config=mock_app_config,
                logger=mock_logger,
            )

    def test_on_refresh_fetches_tasks(
        self, mock_window, mock_auth_client, mock_app_config,
        mock_logger, valid_token
    ):
        mock_auth_client.fetch_tasks.return_value = [
            {"id": "t1", "productId": "m1", "material_id": "m1", "status": "待剪辑"},
        ]
        mock_auth_client.fetch_tasks.reset_mock()

        controller = self._create_controller(
            mock_window, mock_auth_client, mock_app_config,
            mock_logger, valid_token
        )
        mock_auth_client.fetch_tasks.reset_mock()

        controller.on_refresh()

        mock_auth_client.fetch_tasks.assert_called_once_with(valid_token.access_token)
        tasks = mock_window.user_panel.task_table.set_tasks.call_args[0][0]
        assert len(tasks) == 1
        assert tasks[0].id == "t1"

    def test_on_refresh_handles_error(
        self, mock_window, mock_auth_client, mock_app_config,
        mock_logger, valid_token
    ):
        mock_auth_client.fetch_tasks.side_effect = Exception("网络错误")
        mock_auth_client.fetch_tasks.reset_mock()

        controller = self._create_controller(
            mock_window, mock_auth_client, mock_app_config,
            mock_logger, valid_token
        )
        mock_auth_client.fetch_tasks.reset_mock()

        controller.on_refresh()

    def test_on_refresh_emits_session_expired(
        self, mock_window, mock_auth_client, mock_app_config,
        mock_logger, valid_token
    ):
        mock_auth_client.fetch_tasks.return_value = []
        controller = self._create_controller(
            mock_window, mock_auth_client, mock_app_config,
            mock_logger, valid_token
        )
        emitted = []
        controller.session_expired.connect(emitted.append)
        mock_auth_client.fetch_tasks.reset_mock()
        mock_auth_client.fetch_tasks.side_effect = SessionExpiredError("登录已过期，请重新登录")

        controller.on_refresh()

        assert emitted == ["登录已过期，请重新登录"]

    def test_on_material_dir_changed_saves_config(
        self, mock_window, mock_auth_client, mock_app_config,
        mock_logger, valid_token
    ):
        controller = self._create_controller(
            mock_window, mock_auth_client, mock_app_config,
            mock_logger, valid_token
        )
        mock_app_config.save.reset_mock()

        controller._on_material_dir_changed("D:\\materials")

        assert mock_app_config.material_dir == "D:\\materials"
        mock_app_config.save.assert_called_once()

    def test_init_loads_saved_material_dir(
        self, mock_window, mock_auth_client, mock_app_config,
        mock_logger, valid_token
    ):
        mock_app_config.material_dir = "D:\\existing"

        self._create_controller(
            mock_window, mock_auth_client, mock_app_config,
            mock_logger, valid_token
        )

        mock_window.user_panel.material_dir_widget.set_path.assert_called_with(
            "D:\\existing"
        )

    def test_on_view_material_opens_viewer(
        self, mock_window, mock_auth_client, mock_app_config,
        mock_logger, valid_token
    ):
        mock_app_config.material_dir = "D:\\materials"

        with patch("os.path.exists", return_value=True):
            controller = self._create_controller(
                mock_window, mock_auth_client, mock_app_config,
                mock_logger, valid_token
            )

            controller._on_view_material("task-001", "mat-001")

            assert controller._viewer is not None

    def test_on_view_video_opens_viewer(
        self, mock_window, mock_auth_client, mock_app_config,
        mock_logger, valid_token
    ):
        mock_app_config.material_dir = "D:\\materials"

        with patch("os.path.exists", return_value=True):
            controller = self._create_controller(
                mock_window, mock_auth_client, mock_app_config,
                mock_logger, valid_token
            )

            controller._on_view_video("task-001", "mat-001")

            assert controller._viewer is not None

    def test_on_view_file_not_found(
        self, mock_window, mock_auth_client, mock_app_config,
        mock_logger, valid_token
    ):
        mock_app_config.material_dir = "D:\\materials"

        controller = self._create_controller(
            mock_window, mock_auth_client, mock_app_config,
            mock_logger, valid_token
        )

        with patch("os.path.exists", return_value=False):
            controller._open_media_file("task-001", "mat-001", "素材")

    def test_auto_refresh_on_init(
        self, mock_window, mock_auth_client, mock_app_config,
        mock_logger, valid_token
    ):
        mock_auth_client.fetch_tasks.return_value = []
        mock_auth_client.fetch_tasks.reset_mock()

        self._create_controller(
            mock_window, mock_auth_client, mock_app_config,
            mock_logger, valid_token
        )

        mock_auth_client.fetch_tasks.assert_called()


class TestRefactoredUserPanelPage:
    """重构后的 UserPanelPage 集成测试"""

    @pytest.fixture
    def page(self, qapp):
        from video_batch.gui.user_panel_page import UserPanelPage
        return UserPanelPage()

    def test_has_material_dir_widget(self, page):
        from video_batch.gui.material_dir_widget import MaterialDirWidget
        assert isinstance(page.material_dir_widget, MaterialDirWidget)

    def test_has_task_table(self, page):
        from video_batch.gui.task_list_table import TaskListTable
        assert isinstance(page.task_table, TaskListTable)

    def test_has_logout_button(self, page):
        from PySide6.QtWidgets import QPushButton
        found = page.findChild(QPushButton, "logout_button")
        assert found is not None

    def test_has_welcome_label(self, page):
        from PySide6.QtWidgets import QLabel
        found = page.findChild(QLabel, "welcome_label")
        assert found is not None

    def test_set_username_updates_label(self, page):
        page.set_username("myuser")
        from PySide6.QtWidgets import QLabel
        label = page.findChild(QLabel, "welcome_label")
        assert "myuser" in label.text()
