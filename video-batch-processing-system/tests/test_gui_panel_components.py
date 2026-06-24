from unittest.mock import MagicMock, patch

import pytest
from PySide6.QtWidgets import QLineEdit, QPushButton, QWidget

from video_batch.gui.task_item import TaskItem


class TestMaterialDirWidget:
    """素材根目录配置组件测试"""

    @pytest.fixture
    def widget(self, qapp):
        from video_batch.gui.material_dir_widget import MaterialDirWidget
        return MaterialDirWidget()

    def test_is_qwidget(self, widget):
        assert isinstance(widget, QWidget)

    def test_has_path_input(self, widget):
        found = widget.findChild(QLineEdit, "material_dir_input")
        assert found is not None

    def test_has_browse_button(self, widget):
        found = widget.findChild(QPushButton, "browse_button")
        assert found is not None
        assert found.text() == "浏览"

    def test_get_path_returns_input_text(self, widget):
        inp = widget.findChild(QLineEdit, "material_dir_input")
        inp.setText("D:\\materials")
        assert widget.get_path() == "D:\\materials"

    def test_set_path_updates_input(self, widget):
        widget.set_path("D:\\materials")
        inp = widget.findChild(QLineEdit, "material_dir_input")
        assert inp.text() == "D:\\materials"

    def test_browse_click_opens_directory_dialog(self, widget, qapp):
        inp = widget.findChild(QLineEdit, "material_dir_input")
        btn = widget.findChild(QPushButton, "browse_button")

        with patch("PySide6.QtWidgets.QFileDialog.getExistingDirectory",
                   return_value="D:\\selected") as mock_dialog:
            btn.click()

        mock_dialog.assert_called_once()
        assert inp.text() == "D:\\selected"

    def test_path_changed_signal_emitted(self, widget, qapp):
        received = []

        def on_changed(path):
            received.append(path)

        widget.path_changed.connect(on_changed)

        inp = widget.findChild(QLineEdit, "material_dir_input")
        inp.setText("D:\\newpath")

        assert received == ["D:\\newpath"]


class TestTaskListTable:
    """任务列表表格组件测试"""

    @pytest.fixture
    def table(self, qapp):
        from video_batch.gui.task_list_table import TaskListTable
        return TaskListTable()

    def test_is_qwidget(self, table):
        assert isinstance(table, QWidget)

    def test_has_seven_columns_including_actions(self, table):
        assert table._table.columnCount() == 7

    def test_column_headers(self, table):
        expected = ["任务ID", "素材ID", "配置ID", "任务状态", "重复检测"]
        for i, name in enumerate(expected):
            assert table._table.horizontalHeaderItem(i).text() == name

    def test_has_status_filter_combo(self, table):
        from PySide6.QtWidgets import QComboBox
        found = table.findChild(QComboBox, "status_filter")
        assert found is not None

    def test_status_filter_default_all(self, table):
        from PySide6.QtWidgets import QComboBox
        combo = table.findChild(QComboBox, "status_filter")
        assert combo.currentText() == "全部"

    def test_status_filter_options(self, table):
        from PySide6.QtWidgets import QComboBox
        combo = table.findChild(QComboBox, "status_filter")
        expected = ["全部", "待剪辑", "剪辑中", "重试中", "待发布", "剪辑失败"]
        actual = [combo.itemText(i) for i in range(combo.count())]
        assert actual == expected

    def test_has_refresh_button(self, table):
        from PySide6.QtWidgets import QPushButton
        found = table.findChild(QPushButton, "refresh_button")
        assert found is not None
        assert found.text() == "刷新"

    def test_refresh_click_emits_signal(self, table, qapp):
        from PySide6.QtWidgets import QPushButton
        received = []

        table.refresh_requested.connect(lambda: received.append(True))

        btn = table.findChild(QPushButton, "refresh_button")
        btn.click()

        assert len(received) == 1

    def test_set_tasks_populates_rows(self, table):
        tasks = [
            TaskItem(id="t1", productId="m1", status="待剪辑", config_id="c1"),
            TaskItem(id="t2", productId="m2", status="待发布", config_id=None),
        ]
        table.set_tasks(tasks)

        assert table._table.rowCount() == 2

    def test_set_tasks_displays_data_correctly(self, table):
        tasks = [
            TaskItem(id="t1", productId="m1", status="待剪辑", config_id="c1",
                     hamming_distance=20),
        ]
        table.set_tasks(tasks)

        assert table._table.item(0, 0).text() == "t1"
        assert table._table.item(0, 1).text() == "m1"
        assert table._table.item(0, 2).text() == "c1"
        assert table._table.item(0, 3).text() == "待剪辑"
        assert table._table.item(0, 4).text() == "通过"

    def test_set_tasks_clears_previous_data(self, table):
        tasks1 = [TaskItem(id="t1", productId="m1", status="待剪辑")]
        tasks2 = [TaskItem(id="t2", productId="m2", status="待发布")]
        table.set_tasks(tasks1)
        table.set_tasks(tasks2)

        assert table._table.rowCount() == 1
        assert table._table.item(0, 0).text() == "t2"

    def test_empty_tasks_clears_table(self, table):
        tasks = [TaskItem(id="t1", productId="m1", status="待剪辑")]
        table.set_tasks(tasks)
        table.set_tasks([])

        assert table._table.rowCount() == 0

    def test_status_filter_filters_tasks(self, table):
        tasks = [
            TaskItem(id="t1", productId="m1", status="待剪辑"),
            TaskItem(id="t2", productId="m2", status="待发布"),
            TaskItem(id="t3", productId="m3", status="待剪辑"),
        ]
        from PySide6.QtWidgets import QComboBox

        table.set_tasks(tasks)
        combo = table.findChild(QComboBox, "status_filter")
        combo.setCurrentText("待剪辑")

        assert table._table.rowCount() == 2
        assert table._table.item(0, 0).text() == "t1"
        assert table._table.item(1, 0).text() == "t3"

    def test_has_view_material_column(self, table):
        tasks = [TaskItem(id="t1", productId="m1", status="待剪辑")]
        table.set_tasks(tasks)

        from PySide6.QtWidgets import QPushButton
        cell_widget = table._table.cellWidget(0, 5)
        assert isinstance(cell_widget, QPushButton)
        assert cell_widget.text() == "素材查看"

    def test_has_view_video_column(self, table):
        tasks = [TaskItem(id="t1", productId="m1", status="待发布")]
        table.set_tasks(tasks)

        from PySide6.QtWidgets import QPushButton
        cell_widget = table._table.cellWidget(0, 6)
        assert isinstance(cell_widget, QPushButton)
        assert cell_widget.text() == "视频查看"

    def test_view_video_button_disabled_for_non_completed(self, table):
        tasks = [TaskItem(id="t1", productId="m1", status="待剪辑")]
        table.set_tasks(tasks)

        from PySide6.QtWidgets import QPushButton
        btn = table._table.cellWidget(0, 6)
        assert not btn.isEnabled()

    def test_view_material_click_emits_signal(self, table, qapp):
        tasks = [TaskItem(id="t1", productId="m1", status="待剪辑")]
        table.set_tasks(tasks)

        received = []
        table.view_material_requested.connect(
            lambda task_id, productId: received.append((task_id, productId))
        )

        btn = table._table.cellWidget(0, 5)
        btn.click()

        assert len(received) == 1
        assert received[0] == ("t1", "m1")

    def test_view_video_click_emits_signal(self, table, qapp):
        tasks = [TaskItem(id="t2", productId="m2", status="待发布")]
        table.set_tasks(tasks)

        received = []
        table.view_video_requested.connect(
            lambda task_id, productId: received.append((task_id, productId))
        )

        btn = table._table.cellWidget(0, 6)
        btn.click()

        assert len(received) == 1
        assert received[0] == ("t2", "m2")


class TestMediaViewer:
    """素材/视频查看独立窗口测试"""

    @pytest.fixture
    def viewer(self, qapp):
        from video_batch.gui.media_viewer import MediaViewer
        v = MediaViewer()
        yield v
        v.close()

    def test_is_qwidget(self, viewer):
        assert isinstance(viewer, QWidget)

    def test_window_title_shows_task_id(self, viewer):
        viewer.show_material("task-001", "material-xyz")
        assert "task-001" in viewer.windowTitle()
        assert "素材查看" in viewer.windowTitle()

    def test_window_title_shows_video(self, viewer):
        viewer.show_video("task-002", "material-xyz")
        assert "task-002" in viewer.windowTitle()
        assert "视频查看" in viewer.windowTitle()

    def test_shows_error_when_file_not_found(self, viewer):
        with patch("PySide6.QtWidgets.QMessageBox.warning") as mock_warn:
            viewer._load_media("D:\\nonexistent\\file.mp4")
        mock_warn.assert_called_once()
