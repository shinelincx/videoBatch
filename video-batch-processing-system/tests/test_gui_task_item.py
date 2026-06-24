import pytest

from video_batch.gui.task_item import TaskItem


class TestTaskItemFromDict:
    """TaskItem 从字典解析"""

    def test_parses_basic_fields(self):
        data = {
            "id": "task-001",
            "material_id": "mat-001",
            "config_id": "cfg-001",
            "status": "待剪辑",
        }
        item = TaskItem.from_dict(data)
        assert item.id == "task-001"
        assert item.material_id == "mat-001"
        assert item.config_id == "cfg-001"
        assert item.status == "待剪辑"

    def test_handles_missing_config_id(self):
        data = {"id": "t1", "material_id": "m1", "status": "待发布"}
        item = TaskItem.from_dict(data)
        assert item.config_id is None

    def test_maps_clip_config_code(self):
        data = {
            "id": "t1",
            "productId": "p1",
            "status": "待剪辑",
            "clipConfigCode": "cfg-ref-v3",
        }
        item = TaskItem.from_dict(data)
        assert item.config_id == "cfg-ref-v3"

    def test_preserves_product_copy_fields(self):
        data = {
            "id": "t1",
            "productId": "p1",
            "status": "待剪辑",
            "productCategoryName": "女装",
            "productTitle": "夏季纯棉套装",
        }
        item = TaskItem.from_dict(data)
        assert item.productCategoryName == "女装"
        assert item.productTitle == "夏季纯棉套装"

    def test_handles_hamming_distance(self):
        data = {"id": "t1", "material_id": "m1", "status": "待剪辑",
                "hamming_distance": 5}
        item = TaskItem.from_dict(data)
        assert item.hamming_distance == 5

    def test_hamming_distance_defaults_to_none(self):
        data = {"id": "t1", "material_id": "m1", "status": "待剪辑"}
        item = TaskItem.from_dict(data)
        assert item.hamming_distance is None


class TestDuplicateStatus:
    """重复检测列显示逻辑"""

    def test_returns_dash_when_no_hamming_distance(self):
        item = TaskItem("t1", "m1", "待剪辑", hamming_distance=None)
        assert item.duplicate_display() == "-"

    def test_returns_pass_when_distance_gt_threshold(self):
        item = TaskItem("t1", "m1", "待剪辑", hamming_distance=20)
        assert item.duplicate_display() == "通过"

    def test_returns_actual_value_when_lte_threshold(self):
        item = TaskItem("t1", "m1", "待剪辑", hamming_distance=5)
        assert item.duplicate_display() == "5"

    def test_custom_threshold(self):
        item = TaskItem("t1", "m1", "待剪辑", hamming_distance=10)
        assert item.duplicate_display(threshold=10) == "10"
        assert item.duplicate_display(threshold=9) == "通过"


class TestStatusDisplay:
    """任务状态中文显示"""

    def test_status_display_pending(self):
        item = TaskItem("t1", "m1", "待剪辑")
        assert item.status_display == "待剪辑"

    def test_status_display_processing(self):
        item = TaskItem("t1", "m1", "剪辑中")
        assert item.status_display == "剪辑中"

    def test_status_display_completed(self):
        item = TaskItem("t1", "m1", "待发布")
        assert item.status_display == "待发布"

    def test_status_display_failed(self):
        item = TaskItem("t1", "m1", "剪辑失败")
        assert item.status_display == "剪辑失败"

    def test_status_display_retrying(self):
        item = TaskItem("t1", "m1", "retrying")
        assert item.status_display == "重试中"

    def test_status_display_unknown(self):
        item = TaskItem("t1", "m1", "unknown_status")
        assert item.status_display == "unknown_status"


class TestCanViewVideo:
    """视频查看按钮启用条件"""

    def test_cannot_view_video_when_pending(self):
        item = TaskItem("t1", "m1", "待剪辑")
        assert item.can_view_video() is False

    def test_cannot_view_video_when_processing(self):
        item = TaskItem("t1", "m1", "剪辑中")
        assert item.can_view_video() is False

    def test_cannot_view_video_when_retrying(self):
        item = TaskItem("t1", "m1", "retrying")
        assert item.can_view_video() is False

    def test_can_view_video_when_completed(self):
        item = TaskItem("t1", "m1", "待发布")
        assert item.can_view_video() is True

    def test_can_view_video_when_failed(self):
        item = TaskItem("t1", "m1", "剪辑失败")
        assert item.can_view_video() is True
