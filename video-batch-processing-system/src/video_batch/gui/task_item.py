from dataclasses import dataclass

_DEFAULT_THRESHOLD = 12
_STATUS_MAP: dict[str, str] = {
    "pending": "待剪辑",
    "待剪辑": "待剪辑",
    "processing": "剪辑中",
    "剪辑中": "剪辑中",
    "completed": "待发布",
    "待发布": "待发布",
    "failed": "剪辑失败",
    "剪辑失败": "剪辑失败",
    "retrying": "重试中",
}
_VIDEO_VIEWABLE_STATUSES = {"待发布", "剪辑失败", "completed", "failed"}


@dataclass
class TaskItem:
    """任务展示数据模型，封装表格所需的全部字段和显示逻辑。

    属性:
        id: 任务 ID
        productId: 产品 ID
        status: 任务状态 (待剪辑/剪辑中/待发布/剪辑失败/retrying)
        config_id: 关联配置 ID（可选）
        mode: 剪辑模式（image-to-video / reference-video）
        hamming_distance: 最近一次重复检测的汉明距离（可选）
    """

    id: str
    productId: str
    status: str
    config_id: str | None = None
    mode: str | None = None
    hamming_distance: int | None = None
    created_at: str | None = None
    productCategoryName: str | None = None
    productTitle: str | None = None

    @property
    def status_display(self) -> str:
        return _STATUS_MAP.get(self.status, self.status)

    def duplicate_display(self, threshold: int = _DEFAULT_THRESHOLD) -> str:
        if self.hamming_distance is None:
            return "-"
        if self.hamming_distance > threshold:
            return "通过"
        return str(self.hamming_distance)

    def can_view_video(self) -> bool:
        return self.status in _VIDEO_VIEWABLE_STATUSES

    @staticmethod
    def from_dict(data: dict) -> "TaskItem":
        return TaskItem(
            id=data["id"],
            productId=data.get("productId") or data["material_id"],
            status=data.get("status", "待剪辑"),
            config_id=data.get("config_id") or data.get("configId") or data.get("clipConfigCode"),
            mode=data.get("mode"),
            hamming_distance=data.get("hamming_distance"),
            created_at=data.get("createTime") or data.get("created_at"),
            productCategoryName=data.get("productCategoryName"),
            productTitle=data.get("productTitle"),
        )
