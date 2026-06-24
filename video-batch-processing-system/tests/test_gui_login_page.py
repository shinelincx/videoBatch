import pytest
from PySide6.QtCore import Signal
from PySide6.QtWidgets import QCheckBox, QLineEdit, QPushButton, QWidget


class TestLoginPageWidgets:
    """LoginPage 组件存在性和属性测试"""

    @pytest.fixture
    def login_page(self, qapp):
        from video_batch.gui.login_page import LoginPage
        return LoginPage()

    def test_has_username_input(self, login_page):
        found = login_page.findChild(QLineEdit, "username_input")
        assert found is not None

    def test_has_password_input(self, login_page):
        found = login_page.findChild(QLineEdit, "password_input")
        assert found is not None

    def test_password_input_echo_mode_is_password(self, login_page):
        pw = login_page.findChild(QLineEdit, "password_input")
        assert pw.echoMode() == QLineEdit.EchoMode.Password

    def test_has_remember_checkbox(self, login_page):
        found = login_page.findChild(QCheckBox, "remember_checkbox")
        assert found is not None

    def test_remember_checkbox_text(self, login_page):
        cb = login_page.findChild(QCheckBox, "remember_checkbox")
        assert cb.text() == "记住用户名"

    def test_has_login_button(self, login_page):
        found = login_page.findChild(QPushButton, "login_button")
        assert found is not None

    def test_login_button_text(self, login_page):
        btn = login_page.findChild(QPushButton, "login_button")
        assert btn.text() == "登录"

    def test_is_qwidget(self, login_page):
        assert isinstance(login_page, QWidget)


class TestLoginPageValues:
    """LoginPage 值设置和获取测试"""

    @pytest.fixture
    def login_page(self, qapp):
        from video_batch.gui.login_page import LoginPage
        return LoginPage()

    def test_get_username_returns_input_text(self, login_page):
        username = login_page.findChild(QLineEdit, "username_input")
        username.setText("testuser")
        assert login_page.get_username() == "testuser"

    def test_get_password_returns_input_text(self, login_page):
        pw = login_page.findChild(QLineEdit, "password_input")
        pw.setText("secret123")
        assert login_page.get_password() == "secret123"

    def test_is_remember_checked(self, login_page):
        cb = login_page.findChild(QCheckBox, "remember_checkbox")
        cb.setChecked(True)
        assert login_page.is_remember_checked() is True

    def test_is_remember_unchecked_by_default(self, login_page):
        assert login_page.is_remember_checked() is False

    def test_set_remembered_username(self, login_page):
        login_page.set_remembered_username("saveduser")
        username = login_page.findChild(QLineEdit, "username_input")
        assert username.text() == "saveduser"
        cb = login_page.findChild(QCheckBox, "remember_checkbox")
        assert cb.isChecked() is True

    def test_clear_inputs(self, login_page):
        username = login_page.findChild(QLineEdit, "username_input")
        pw = login_page.findChild(QLineEdit, "password_input")
        username.setText("user")
        pw.setText("pass")

        login_page.clear_inputs()

        assert username.text() == ""
        assert pw.text() == ""


class TestLoginPageSignal:
    """LoginPage 信号测试"""

    @pytest.fixture
    def login_page(self, qapp):
        from video_batch.gui.login_page import LoginPage
        return LoginPage()

    def test_login_button_click_emits_login_requested(self, login_page, qapp):
        received = []

        def on_login_requested(username, password, remember):
            received.append((username, password, remember))

        login_page.login_requested.connect(on_login_requested)

        username = login_page.findChild(QLineEdit, "username_input")
        pw = login_page.findChild(QLineEdit, "password_input")
        cb = login_page.findChild(QCheckBox, "remember_checkbox")

        username.setText("myuser")
        pw.setText("mypass")
        cb.setChecked(True)

        btn = login_page.findChild(QPushButton, "login_button")
        btn.click()

        assert len(received) == 1
        assert received[0] == ("myuser", "mypass", True)
