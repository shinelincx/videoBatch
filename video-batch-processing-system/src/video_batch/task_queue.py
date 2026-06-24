"""
任务队列模块 - 远程任务获取与本地队列管理

负责从远程 API 获取待处理任务列表，按优先级排序后维护在本地队列中，
支持任务的出队、查看等操作。
"""

from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from video_batch.logger import Logger


class TaskQueueError(Exception):
    """任务队列异常"""
    pass


@dataclass
class Task:
    """
    任务数据模型

    表示一个待处理的视频处理任务，包含任务 ID、素材 ID、状态、优先级等信息。
    """
    id: str              # 任务唯一标识
    productId: str      # 关联的产品 ID
    status: str = "待剪辑"      # 任务状态（待剪辑/剪辑中/待发布/剪辑失败/retrying）
    config_id: str | None = None # 关联的配置 ID
    mode: str | None = None      # 任务模式（如 image_to_video、reference_video）
    priority: int = 0            # 任务优先级，数值越大优先级越高
    retry_count: int = 0         # 已重试次数
    productCategoryName: str | None = None
    productTitle: str | None = None
    created_at: str | None = None # 任务创建时间

    @staticmethod
    def from_dict(data: dict) -> "Task":
        """
        从字典数据创建 Task 实例

        参数:
            data: 包含任务字段的字典

        返回:
            Task: 新创建的任务实例
        """
        return Task(
            id=data["id"],
            productId=data.get("productId") or data["material_id"],
            status=data.get("status", "待剪辑"),
            config_id=data.get("config_id") or data.get("configId") or data.get("clipConfigCode"),
            mode=data.get("mode"),
            priority=data.get("priority", 0),
            retry_count=data.get("retry_count", 0),
            created_at=data.get("created_at"),
            productCategoryName=data.get("productCategoryName"),
            productTitle=data.get("productTitle"),
        )


class TaskQueue:
    """
    任务队列管理器

    从远程 API 获取任务列表，按优先级和时间排序后维护在本地队列中，
    提供任务的入队、出队、查看等操作接口。
    """

    def __init__(
        self,
        base_url: str,               # 远程 API 基础 URL
        http_session,                 # HTTP 客户端会话
        logger: "Logger | None" = None, # 日志记录器
    ) -> None:
        self._base_url = base_url
        self._http = http_session
        self._logger = logger
        self._queue: list[Task] = []  # 本地任务队列

    def fetch_tasks(self, access_token: str) -> list[Task]:
        """
        从远程 API 获取任务列表

        参数:
            access_token: 认证访问令牌

        返回:
            任务列表

        异常:
            TaskQueueError: 网络异常或 API 返回非 200 状态时抛出
        """
        url = f"{self._base_url}/clip_record/pending_clip/list"
        try:
            if self._logger:
                self._logger.info(
                    task_id="task_queue",
                    module="任务队列",
                    message=f"请求任务列表: GET {url}",
                )
            response = self._http.get(
                url,
                headers={"Authorization": f"Bearer {access_token}"},
            )
        except Exception as e:
            if self._logger:
                self._logger.error(
                    task_id="task_queue",
                    module="任务队列",
                    message=f"获取任务列表失败: {e}",
                )
            raise TaskQueueError(f"获取任务列表失败: {e}") from e

        # 检查 HTTP 响应状态码
        if response.status_code != 200:
            body_preview = response.text[:200] if response.text else "(empty)"
            if self._logger:
                self._logger.error(
                    task_id="task_queue",
                    module="任务队列",
                    message=f"获取任务列表 HTTP {response.status_code} | 响应: {body_preview}",
                )
            raise TaskQueueError(f"获取任务列表 HTTP {response.status_code}")

        # 解析 JSON 响应并转换为 Task 对象列表
        raw = response.json()
        task_list = self._unwrap_response(raw)
        return [Task.from_dict(item) for item in task_list]

    def fetch_and_enqueue(self, access_token: str) -> None:
        """
        获取任务并建立本地队列

        从远程 API 获取任务后，按优先级降序、创建时间升序排序。

        参数:
            access_token: 认证访问令牌
        """
        tasks = self.fetch_tasks(access_token)
        # 优先级高的在前，同优先级按创建时间排序
        tasks.sort(key=lambda t: (-t.priority, t.created_at or ""))
        self._queue = tasks

        # 记录队列建立信息
        if self._logger:
            self._logger.info(
                task_id="task_queue",
                module="任务队列",
                message=f"任务队列已建立，共 {len(tasks)} 个任务",
            )

    def dequeue(self) -> Task:
        """
        从队列头部取出一个任务（先进先出）

        返回:
            队列头部的任务

        异常:
            TaskQueueError: 队列为空时抛出
        """
        if not self._queue:
            raise TaskQueueError("队列为空")
        return self._queue.pop(0)

    def peek(self) -> Task:
        """
        查看队列头部的任务（不移除）

        返回:
            队列头部的任务

        异常:
            TaskQueueError: 队列为空时抛出
        """
        if not self._queue:
            raise TaskQueueError("队列为空")
        return self._queue[0]

    def is_empty(self) -> bool:
        """
        检查队列是否为空

        返回:
            队列为空时返回 True，否则返回 False
        """
        return len(self._queue) == 0

    def size(self) -> int:
        """
        获取队列中的任务数量

        返回:
            队列中的任务总数
        """
        return len(self._queue)

    @staticmethod
    def _unwrap_response(body):
        if isinstance(body, dict) and "code" in body and "data" in body:
            data = body.get("data")
            if isinstance(data, list):
                return data
        return body
