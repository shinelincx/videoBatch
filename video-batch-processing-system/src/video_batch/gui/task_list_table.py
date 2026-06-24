from PySide6.QtCore import Signal
from PySide6.QtWidgets import (
    QCheckBox,
    QComboBox,
    QHBoxLayout,
    QHeaderView,
    QPushButton,
    QTableWidget,
    QTableWidgetItem,
    QVBoxLayout,
    QWidget,
)

from video_batch.gui.task_item import TaskItem

_COLUMNS = ["任务ID", "素材ID", "配置ID", "任务状态", "重复检测"]
_COL_ID = 0
_COL_MATERIAL = 1
_COL_CONFIG = 2
_COL_STATUS = 3
_COL_DUPLICATE = 4
_COL_VIEW_MATERIAL = 5
_COL_VIEW_VIDEO = 6

_STATUS_FILTER_MAP: dict[str, str | None] = {
    "全部": None,
    "待剪辑": "待剪辑",
    "剪辑中": "剪辑中",
    "重试中": "retrying",
    "待发布": "待发布",
    "剪辑失败": "剪辑失败",
}


class TaskListTable(QWidget):
    """任务列表表格组件，展示任务并支持筛选和操作。

    信号:
        refresh_requested: 点击刷新按钮
        view_material_requested(task_id, material_id): 点击素材查看
        view_video_requested(task_id, material_id): 点击视频查看
    """

    refresh_requested = Signal()
    batch_process_requested = Signal()
    auto_refresh_toggled = Signal(bool)
    view_material_requested = Signal(str, str)
    view_video_requested = Signal(str, str)

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._tasks: list[TaskItem] = []
        self._setup_ui()

    def _setup_ui(self) -> None:
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(8)

        toolbar = QHBoxLayout()

        self._status_filter = QComboBox()
        self._status_filter.setObjectName("status_filter")
        self._status_filter.addItems(list(_STATUS_FILTER_MAP.keys()))
        self._status_filter.currentTextChanged.connect(self._apply_filter)
        toolbar.addWidget(self._status_filter)

        toolbar.addStretch()

        self._refresh_button = QPushButton("刷新")
        self._refresh_button.setObjectName("refresh_button")
        self._refresh_button.clicked.connect(self.refresh_requested.emit)
        toolbar.addWidget(self._refresh_button)

        self._auto_refresh_checkbox = QCheckBox("自动刷新(15s)")
        self._auto_refresh_checkbox.setObjectName("auto_refresh_checkbox")
        self._auto_refresh_checkbox.toggled.connect(self.auto_refresh_toggled.emit)
        toolbar.addWidget(self._auto_refresh_checkbox)

        self._batch_process_button = QPushButton("开始处理")
        self._batch_process_button.setObjectName("batch_process_button")
        self._batch_process_button.clicked.connect(self.batch_process_requested.emit)
        toolbar.addWidget(self._batch_process_button)

        layout.addLayout(toolbar)

        total_cols = len(_COLUMNS) + 2
        self._table = QTableWidget(0, total_cols)
        self._table.setHorizontalHeaderLabels(_COLUMNS + ["", ""])
        self._table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self._table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self._table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        layout.addWidget(self._table)

    @property
    def tasks(self) -> list[TaskItem]:
        return self._tasks

    @property
    def auto_refresh_enabled(self) -> bool:
        return self._auto_refresh_checkbox.isChecked()

    def set_tasks(self, tasks: list[TaskItem]) -> None:
        self._tasks = tasks
        self._apply_filter()

    def _apply_filter(self) -> None:
        filter_status = _STATUS_FILTER_MAP.get(
            self._status_filter.currentText(), None
        )

        filtered = self._tasks
        if filter_status is not None:
            filtered = [t for t in self._tasks if t.status == filter_status]

        self._table.setRowCount(0)
        for row, task in enumerate(filtered):
            self._table.insertRow(row)
            self._table.setItem(row, _COL_ID, QTableWidgetItem(task.id))
            self._table.setItem(row, _COL_MATERIAL, QTableWidgetItem(task.productId))
            self._table.setItem(row, _COL_CONFIG, QTableWidgetItem(task.config_id or ""))
            self._table.setItem(row, _COL_STATUS, QTableWidgetItem(task.status_display))
            self._table.setItem(row, _COL_DUPLICATE, QTableWidgetItem(task.duplicate_display()))

            view_material_btn = QPushButton("素材查看")
            view_material_btn.clicked.connect(
                lambda checked=False, tid=task.id, mid=task.productId:
                self.view_material_requested.emit(tid, mid)
            )
            self._table.setCellWidget(row, _COL_VIEW_MATERIAL, view_material_btn)

            view_video_btn = QPushButton("视频查看")
            view_video_btn.setEnabled(task.can_view_video())
            view_video_btn.clicked.connect(
                lambda checked=False, tid=task.id, mid=task.productId:
                self.view_video_requested.emit(tid, mid)
            )
            self._table.setCellWidget(row, _COL_VIEW_VIDEO, view_video_btn)
