"""
离线追踪模块 - 网络状态管理

负责追踪系统的在线/离线状态，在状态变化时记录日志。
"""

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from video_batch.logger import Logger


class OfflineTracker:
    """
    离线状态追踪器

    管理系统的网络在线/离线状态，在状态发生变化时
    记录相应的日志信息。
    """

    def __init__(self, logger: "Logger") -> None:
        """
        初始化离线追踪器

        参数:
            logger: 日志记录器
        """
        self.is_offline = False  # 当前是否处于离线状态
        self._logger = logger

    def mark_offline(self) -> None:
        """
        标记系统进入离线模式

        如果当前已是离线状态则不做任何操作。
        """
        if self.is_offline:
            return
        self.is_offline = True
        self._logger.warning(
            task_id="system", module="网络状态", message="进入离线模式"
        )

    def mark_online(self) -> None:
        """
        标记系统恢复在线状态

        如果当前已是在线状态则不做任何操作。
        """
        if not self.is_offline:
            return
        self.is_offline = False
        self._logger.info(
            task_id="system", module="网络状态", message="网络已恢复"
        )
