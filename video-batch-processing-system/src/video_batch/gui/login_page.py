from PySide6.QtCore import Signal
from PySide6.QtWidgets import (
    QCheckBox,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QPushButton,
    QVBoxLayout,
    QWidget,
)


class LoginPage(QWidget):
    """登录页面，包含用户名、密码输入和登录按钮。

    发出 login_requested(username, password, remember) 信号供控制器处理。
    """

    login_requested = Signal(str, str, bool)

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._setup_ui()

    def _setup_ui(self) -> None:
        layout = QVBoxLayout(self)
        layout.setContentsMargins(100, 60, 100, 60)
        layout.setSpacing(16)

        title = QLabel("视频智能剪辑客户端")
        title.setStyleSheet("font-size: 20px; font-weight: bold;")
        layout.addWidget(title)
        layout.addSpacing(24)

        username_label = QLabel("用户名")
        layout.addWidget(username_label)

        self._username_input = QLineEdit()
        self._username_input.setObjectName("username_input")
        self._username_input.setPlaceholderText("请输入用户名")
        layout.addWidget(self._username_input)

        password_label = QLabel("密码")
        layout.addWidget(password_label)

        self._password_input = QLineEdit()
        self._password_input.setObjectName("password_input")
        self._password_input.setEchoMode(QLineEdit.EchoMode.Password)
        self._password_input.setPlaceholderText("请输入密码")
        layout.addWidget(self._password_input)

        self._remember_checkbox = QCheckBox("记住用户名")
        self._remember_checkbox.setObjectName("remember_checkbox")
        layout.addWidget(self._remember_checkbox)

        layout.addSpacing(12)

        self._login_button = QPushButton("登录")
        self._login_button.setObjectName("login_button")
        self._login_button.setMinimumHeight(36)
        self._login_button.clicked.connect(self._on_login_clicked)
        layout.addWidget(self._login_button)

        layout.addStretch()

    def _on_login_clicked(self) -> None:
        self.login_requested.emit(
            self._username_input.text(),
            self._password_input.text(),
            self._remember_checkbox.isChecked(),
        )

    def get_username(self) -> str:
        return self._username_input.text()

    def get_password(self) -> str:
        return self._password_input.text()

    def is_remember_checked(self) -> bool:
        return self._remember_checkbox.isChecked()

    def set_remembered_username(self, username: str) -> None:
        self._username_input.setText(username)
        self._remember_checkbox.setChecked(True)

    def clear_inputs(self) -> None:
        self._username_input.clear()
        self._password_input.clear()
