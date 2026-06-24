"""
任务监控模块 - 任务状态展示与监控面板

负责维护任务列表的实时状态，提供任务类型映射、步骤更新、
错误记录和统计摘要等监控功能，用于前端监控界面展示。
"""

from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from video_batch.logger import Logger
    from video_batch.task_queue import Task


@dataclass
class TaskDisplayInfo:
    """任务显示信息数据模型，用于监控界面展示"""
    task_id: str                        # 任务 ID
    task_type: str                      # 任务类型（如 图生视频、原视频参考）
    status: str                         # 当前状态
    current_step: str = ""              # 当前执行步骤
    error_message: str = ""             # 错误信息
    video_preview_path: str = ""        # 视频预览文件路径


class TaskMonitor:
    """
    任务监控器

    维护任务列表的实时状态信息，提供任务显示信息构建、步骤更新、
    错误记录和统计摘要等功能，用于监控界面的数据展示。
    """

    def __init__(
        self,
        tasks: list["Task"],            # 被监控的任务列表
        logger: "Logger | None" = None, # 日志记录器
    ) -> None:
        self._tasks = tasks
        self._logger = logger
        self._steps: dict[str, str] = {}       # 任务 ID -> 当前步骤
        self._errors: dict[str, str] = {}      # 任务 ID -> 错误信息
        self._previews: dict[str, str] = {}    # 任务 ID -> 预览路径

    def _get_task_type(self, task: "Task") -> str:
        """
        根据任务模式获取中文任务类型名称

        参数:
            task: 任务对象

        返回:
            中文任务类型字符串，未知模式返回 "未知类型"
        """
        type_map = {
            "image_to_video": "图生视频",
            "reference_video": "原视频参考",
        }
        return type_map.get(task.mode or "", "未知类型")

    def _build_display_info(self, task: "Task") -> TaskDisplayInfo:
        """
        构建单个任务的显示信息

        对于已完成或失败的任务，当前步骤显示为空。

        参数:
            task: 任务对象

        返回:
            TaskDisplayInfo: 任务显示信息对象
        """
        # 终端状态（completed/failed）不显示当前步骤
        is_terminal = task.status in ("待发布", "剪辑失败")
        current_step = "" if is_terminal else self._steps.get(task.id, "")

        return TaskDisplayInfo(
            task_id=task.id,
            task_type=self._get_task_type(task),
            status=task.status,
            current_step=current_step,
            error_message=self._errors.get(task.id, ""),
            video_preview_path=self._previews.get(task.id, ""),
        )

    def get_task_list(self) -> list[TaskDisplayInfo]:
        """
        获取所有任务的显示信息列表

        返回:
            包含所有任务显示信息的列表
        """
        return [self._build_display_info(t) for t in self._tasks]

    def refresh(self) -> list[TaskDisplayInfo]:
        """
        刷新任务监控界面数据

        返回:
            最新的任务显示信息列表
        """
        if self._logger:
            self._logger.info(
                task_id="monitor",
                module="任务监控",
                message="刷新任务监控界面",
            )
        return self.get_task_list()

    def update_step(self, task_id: str, step: str) -> None:
        """
        更新指定任务的当前执行步骤

        参数:
            task_id: 任务 ID
            step: 当前步骤描述
        """
        # 验证任务是否在监控列表中
        if task_id not in {t.id for t in self._tasks}:
            if self._logger:
                self._logger.error(
                    task_id=task_id,
                    module="任务监控",
                    message=f"update_step: 任务 {task_id} 不在监控列表中",
                )
            return

        self._steps[task_id] = step

        # 记录步骤更新日志
        if self._logger:
            self._logger.info(
                task_id=task_id,
                module="任务监控",
                message=f"步骤更新: {step}",
            )

    def update_error(self, task_id: str, error_message: str) -> None:
        """
        更新指定任务的错误信息

        参数:
            task_id: 任务 ID
            error_message: 错误信息描述
        """
        # 验证任务是否在监控列表中
        if task_id not in {t.id for t in self._tasks}:
            if self._logger:
                self._logger.error(
                    task_id=task_id,
                    module="任务监控",
                    message=f"update_error: 任务 {task_id} 不在监控列表中",
                )
            return

        self._errors[task_id] = error_message

        # 记录错误日志
        if self._logger:
            self._logger.error(
                task_id=task_id,
                module="任务监控",
                message=f"任务失败: {error_message}",
            )

    def set_video_preview(self, task_id: str, path: str) -> None:
        """
        设置指定任务的视频预览路径

        参数:
            task_id: 任务 ID
            path: 视频预览文件路径
        """
        # 验证任务是否在监控列表中
        if task_id not in {t.id for t in self._tasks}:
            if self._logger:
                self._logger.error(
                    task_id=task_id,
                    module="任务监控",
                    message=f"set_video_preview: 任务 {task_id} 不在监控列表中",
                )
            return

        self._previews[task_id] = path

        # 记录预览路径设置日志
        if self._logger:
            self._logger.info(
                task_id=task_id,
                module="任务监控",
                message=f"视频预览设置: {path}",
            )

    def get_summary(self) -> dict[str, int]:
        """
        获取任务状态统计摘要

        返回:
            包含各状态任务数量的字典，键为状态名，值为任务数量
        """
        summary: dict[str, int] = {
            "total": len(self._tasks),
            "待剪辑": 0,
            "剪辑中": 0,
            "retrying": 0,
            "待发布": 0,
            "剪辑失败": 0,
        }
        for t in self._tasks:
            if t.status in summary:
                summary[t.status] += 1
        return summary
