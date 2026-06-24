import pytest
from PySide6.QtWidgets import QMainWindow, QStackedWidget

from video_batch.gui.login_page import LoginPage
from video_batch.gui.user_panel_page import UserPanelPage


class TestMainWindowProperties:
    """MainWindow 属性测试"""

    @pytest.fixture
    def window(self, qapp):
        from video_batch.gui.main_window import MainWindow
        return MainWindow()

    def test_is_qmainwindow(self, window):
        assert isinstance(window, QMainWindow)

    def test_window_title(self, window):
        assert window.windowTitle() == "视频智能剪辑客户端"

    def test_has_stacked_widget(self, window):
        found = window.findChild(QStackedWidget, "page_stack")
        assert found is not None

    def test_stacked_widget_has_two_pages(self, window):
        stack = window.findChild(QStackedWidget, "page_stack")
        assert stack.count() == 2


class TestMainWindowPageRouting:
    """MainWindow 页面路由测试"""

    @pytest.fixture
    def window(self, qapp):
        from video_batch.gui.main_window import MainWindow
        return MainWindow()

    def test_default_page_is_login(self, window):
        stack = window.findChild(QStackedWidget, "page_stack")
        assert stack.currentWidget() is window.login_page

    def test_show_user_panel_switches_page(self, window):
        window.show_user_panel("testuser")
        stack = window.findChild(QStackedWidget, "page_stack")
        assert stack.currentWidget() is window.user_panel

    def test_show_login_switches_back(self, window):
        window.show_user_panel("testuser")
        window.show_login()
        stack = window.findChild(QStackedWidget, "page_stack")
        assert stack.currentWidget() is window.login_page

    def test_login_page_is_login_page_instance(self, window):
        assert isinstance(window.login_page, LoginPage)

    def test_user_panel_is_user_panel_page_instance(self, window):
        assert isinstance(window.user_panel, UserPanelPage)

    def test_show_user_panel_sets_username(self, window):
        window.show_user_panel("myuser")
        label = window.user_panel.findChild(
            type(window.user_panel).__bases__[0]
        )
        from PySide6.QtWidgets import QLabel
        label = window.user_panel.findChild(QLabel, "welcome_label")
        assert "myuser" in label.text()
