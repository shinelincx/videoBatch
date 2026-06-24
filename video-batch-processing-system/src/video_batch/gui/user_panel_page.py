from PySide6.QtCore import Signal
from PySide6.QtWidgets import (
    QLabel,
    QPushButton,
    QVBoxLayout,
    QWidget,
)

from video_batch.gui.material_dir_widget import MaterialDirWidget
from video_batch.gui.task_list_table import TaskListTable


class UserPanelPage(QWidget):
    """用户面板页面，登录成功后的主操作界面。

    包含素材根目录配置区、任务列表表格和退出登录按钮。
    发出 logout_requested() 信号供控制器处理。
    """

    logout_requested = Signal()

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._setup_ui()

    def _setup_ui(self) -> None:
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(12)

        header = QLabel("视频智能剪辑客户端")
        header.setStyleSheet("font-size: 20px; font-weight: bold;")
        layout.addWidget(header)

        self._welcome_label = QLabel("欢迎，用户")
        self._welcome_label.setObjectName("welcome_label")
        self._welcome_label.setStyleSheet("font-size: 14px; color: gray;")
        layout.addWidget(self._welcome_label)

        section_label = QLabel("素材根目录")
        section_label.setStyleSheet("font-size: 13px; font-weight: bold;")
        layout.addWidget(section_label)

        self.material_dir_widget = MaterialDirWidget()
        layout.addWidget(self.material_dir_widget)

        task_label = QLabel("任务列表")
        task_label.setStyleSheet("font-size: 13px; font-weight: bold; margin-top: 8px;")
        layout.addWidget(task_label)

        self.task_table = TaskListTable()
        layout.addWidget(self.task_table, stretch=1)

        self._logout_button = QPushButton("退出登录")
        self._logout_button.setObjectName("logout_button")
        self._logout_button.clicked.connect(self.logout_requested.emit)
        layout.addWidget(self._logout_button)

    def set_username(self, username: str) -> None:
        self._welcome_label.setText(f"欢迎，{username}")
