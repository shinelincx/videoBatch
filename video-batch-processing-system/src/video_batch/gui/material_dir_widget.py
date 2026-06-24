from PySide6.QtCore import Signal
from PySide6.QtWidgets import (
    QFileDialog,
    QHBoxLayout,
    QLineEdit,
    QPushButton,
    QWidget,
)


class MaterialDirWidget(QWidget):
    """素材根目录配置组件，提供路径输入和目录选择功能。

    发出 path_changed(str) 信号通知路径变更。
    """

    path_changed = Signal(str)

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._setup_ui()

    def _setup_ui(self) -> None:
        layout = QHBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)

        self._path_input = QLineEdit()
        self._path_input.setObjectName("material_dir_input")
        self._path_input.setPlaceholderText("请选择素材根目录...")
        self._path_input.textChanged.connect(self.path_changed.emit)
        layout.addWidget(self._path_input)

        self._browse_button = QPushButton("浏览")
        self._browse_button.setObjectName("browse_button")
        self._browse_button.clicked.connect(self._on_browse)
        layout.addWidget(self._browse_button)

    def _on_browse(self) -> None:
        path = QFileDialog.getExistingDirectory(self, "选择素材根目录")
        if path:
            self._path_input.setText(path)

    def get_path(self) -> str:
        return self._path_input.text()

    def set_path(self, path: str) -> None:
        self._path_input.setText(path)
