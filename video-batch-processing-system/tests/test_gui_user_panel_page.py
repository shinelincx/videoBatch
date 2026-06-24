import pytest
from PySide6.QtWidgets import QLabel, QPushButton, QWidget


class TestUserPanelPageWidgets:
    """UserPanelPage 组件存在性和属性测试"""

    @pytest.fixture
    def page(self, qapp):
        from video_batch.gui.user_panel_page import UserPanelPage
        return UserPanelPage()

    def test_is_qwidget(self, page):
        assert isinstance(page, QWidget)

    def test_has_welcome_label(self, page):
        found = page.findChild(QLabel, "welcome_label")
        assert found is not None

    def test_welcome_label_shows_username(self, page):
        page.set_username("testuser")
        label = page.findChild(QLabel, "welcome_label")
        assert "testuser" in label.text()

    def test_default_welcome_text(self, page):
        label = page.findChild(QLabel, "welcome_label")
        assert "用户" in label.text()

    def test_has_logout_button(self, page):
        found = page.findChild(QPushButton, "logout_button")
        assert found is not None

    def test_logout_button_text(self, page):
        btn = page.findChild(QPushButton, "logout_button")
        assert btn.text() == "退出登录"


class TestUserPanelPageSignal:
    """UserPanelPage 信号测试"""

    @pytest.fixture
    def page(self, qapp):
        from video_batch.gui.user_panel_page import UserPanelPage
        return UserPanelPage()

    def test_logout_click_emits_logout_requested(self, page):
        received = []

        def on_logout():
            received.append(True)

        page.logout_requested.connect(on_logout)

        btn = page.findChild(QPushButton, "logout_button")
        btn.click()

        assert len(received) == 1
