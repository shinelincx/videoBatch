from PySide6.QtWidgets import (
    QMainWindow,
    QStackedWidget,
    QWidget,
)

from video_batch.gui.login_page import LoginPage
from video_batch.gui.user_panel_page import UserPanelPage


class MainWindow(QMainWindow):
    """视频智能剪辑客户端主窗口，管理登录页和用户面板之间的页面路由。

    使用 QStackedWidget 实现页面切换，登录页和用户面板各占一个索引。
    """

    def __init__(self) -> None:
        super().__init__()
        self.setWindowTitle("视频智能剪辑客户端")
        self.resize(600, 450)

        self._stack = QStackedWidget()
        self._stack.setObjectName("page_stack")

        self.login_page = LoginPage()
        self.user_panel = UserPanelPage()

        self._stack.addWidget(self.login_page)
        self._stack.addWidget(self.user_panel)

        self.setCentralWidget(self._stack)

    def show_login(self) -> None:
        self._stack.setCurrentWidget(self.login_page)
        self.login_page.clear_inputs()

    def show_user_panel(self, username: str) -> None:
        self.user_panel.set_username(username)
        self._stack.setCurrentWidget(self.user_panel)
