import os
from pathlib import Path

from PySide6.QtWidgets import (
    QLabel,
    QMessageBox,
    QVBoxLayout,
    QWidget,
)


class MediaViewer(QWidget):
    """素材/视频查看独立窗口，用于展示和播放媒体文件。

    当前使用简单的文件路径检查验证文件存在性，
    后续可扩展为集成视频播放器。
    """

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.resize(640, 480)
        self._setup_ui()

    def _setup_ui(self) -> None:
        layout = QVBoxLayout(self)
        self._status_label = QLabel("加载中...")
        self._status_label.setStyleSheet("color: gray; font-size: 14px;")
        layout.addWidget(self._status_label)
        layout.addStretch()

    def show_material(self, task_id: str, productId: str) -> None:
        self.setWindowTitle(f"素材查看 - {task_id}")
        self.show()

    def show_video(self, task_id: str, productId: str) -> None:
        self.setWindowTitle(f"视频查看 - {task_id}")
        self.show()

    def _load_media(self, file_path: str) -> None:
        if not os.path.exists(file_path):
            QMessageBox.warning(self, "文件不存在", f"文件不存在:\n{file_path}")
            return
        self._status_label.setText(f"文件: {Path(file_path).name}")
