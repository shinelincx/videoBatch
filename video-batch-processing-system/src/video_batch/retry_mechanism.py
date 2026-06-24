"""
重试机制模块 - 参数扰动与自动重试

负责在检测到视频重复时，通过参数扰动（切换滤镜、调整时长、更换 BGM 等）
生成差异化参数并自动重试，直至生成非重复视频或达到最大重试次数。
"""

import random
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any, Callable

from video_batch.task_status import TaskStatus

if TYPE_CHECKING:
    from video_batch.duplicate_detection import DuplicateResult
    from video_batch.logger import Logger
    from video_batch.task_queue import Task
    from video_batch.task_status import TaskStatusManager


# ============================================================
# 数据模型
# ============================================================

@dataclass
class RetryConfig:
    """重试配置"""
    max_retries: int = 3  # 最大重试次数


@dataclass
class RetryResult:
    """重试结果"""
    success: bool                        # 是否成功（未重复）
    retries_used: int                    # 实际使用重试次数
    final_params: dict | None            # 最终使用的参数（成功时有效）
    perturbation_log: list[dict[str, Any]] # 参数扰动变更日志


# ============================================================
# 参数扰动器
# ============================================================

class ParameterPerturber:
    """
    参数扰动器

    提供多种参数扰动方法，用于在重试时生成差异化的视频处理参数，
    包括滤镜切换、时长微调、BGM 更换和文字样式调整。
    """
    # 滤镜类别映射
    FILTER_CATEGORIES: dict[str, list[str]] = {
        "warm": ["warm_v1", "warm_v2"],
        "cool": ["cool_v1", "cool_v2"],
        "vintage": ["vintage_v1", "vintage_v2"],
        "bw": ["bw_v1", "bw_v2"],
    }

    def __init__(self) -> None:
        self.filter_categories = dict(self.FILTER_CATEGORIES)

    @staticmethod
    def _get_filter_category(filter_categories: dict[str, list[str]], filter_name: str) -> str | None:
        """
        获取指定滤镜所属的类别

        参数:
            filter_categories: 滤镜类别映射
            filter_name: 滤镜名称

        返回:
            滤镜所属类别名称，未找到返回 None
        """
        for category, filters in filter_categories.items():
            if filter_name in filters:
                return category
        return None

    def perturb_filter(self, current: str) -> str:
        """
        切换到不同类别的滤镜

        从当前滤镜所在类别以外的其他类别中随机选择一个滤镜。

        参数:
            current: 当前使用的滤镜名称

        返回:
            新选择的滤镜名称，无法切换时返回原滤镜
        """
        categories = self.filter_categories
        current_category = self._get_filter_category(categories, current)
        # 收集其他类别的所有滤镜
        other_filters = []
        for category, filters in categories.items():
            if category != current_category:
                other_filters.extend(filters)
        if not other_filters:
            return current
        return random.choice(other_filters)

    @staticmethod
    def perturb_duration(current: float, min_d: float = 5.0, max_d: float = 60.0) -> float:
        """
        对视频时长进行 ±10% 微调

        将结果限制在安全范围内（默认 5~60 秒）。

        参数:
            current: 当前时长
            min_d: 最小安全时长
            max_d: 最大安全时长

        返回:
            扰动后的时长
        """
        factor = random.uniform(0.9, 1.1)
        return max(min_d, min(max_d, current * factor))

    @staticmethod
    def perturb_bgm(current: str, used: list[str], available: list[str]) -> str:
        """
        从可用 BGM 列表中选择一个未使用过的背景音乐

        优先选择既不是当前使用、也未在已使用列表中的 BGM。

        参数:
            current: 当前使用的 BGM
            used: 已使用过的 BGM 列表
            available: 可用 BGM 列表

        返回:
            新选择的 BGM，无可用选择时返回当前或首个可用 BGM
        """
        excluded = set(used) | {current}
        candidates = [b for b in available if b not in excluded]
        if not candidates:
            return available[0] if available else current
        return random.choice(candidates)

    @staticmethod
    def perturb_text_style(
        current: dict[str, str],
        available: list[dict[str, str]],
    ) -> dict[str, str]:
        """
        选择与原方案差异最大的文字样式

        遍历候选样式，计算与当前样式在 font、color、position 三个维度的差异数，
        选择差异最大的样式。

        参数:
            current: 当前使用的文字样式
            available: 候选文字样式列表

        返回:
            差异最大的文字样式，无候选时返回原样式
        """
        if not available:
            return current

        best = available[0]
        best_score = -1

        for candidate in available:
            score = sum(
                1 for key in ("font", "color", "position")
                if candidate.get(key) != current.get(key)
            )
            if score > best_score:
                best_score = score
                best = candidate

        return best

    @staticmethod
    def perturb_params(
        params: dict[str, Any],
        perturber: "ParameterPerturber | None" = None,
    ) -> tuple[dict[str, Any], dict[str, Any]]:
        """
        对所有可扰动参数进行扰动

        依次扰动滤镜、时长、BGM 和文字样式参数，记录所有变更。

        参数:
            params: 当前参数字典
            perturber: 参数扰动器实例，未提供则创建新实例

        返回:
            元组 (new_params, changes)：
            - new_params: 扰动后的新参数字典
            - changes: 变更记录字典
        """
        perturber = perturber or ParameterPerturber()
        new_params = dict(params)
        changes: dict[str, Any] = {}

        # 扰动滤镜参数
        if "filter" in new_params and ParameterPerturber.FILTER_CATEGORIES:
            old = new_params["filter"]
            new_params["filter"] = perturber.perturb_filter(old)
            changes["filter"] = {"old": old, "new": new_params["filter"]}

        # 扰动时长参数
        if "duration" in new_params:
            old = new_params["duration"]
            new_params["duration"] = perturber.perturb_duration(old)
            changes["duration"] = {"old": old, "new": new_params["duration"]}

        # 扰动 BGM 参数
        if "bgm" in new_params:
            old = new_params["bgm"]
            used_bgms = params.get("_used_bgms", [])
            available_bgms = params.get("_bgm_pool", [old])
            new_bgm = perturber.perturb_bgm(old, used_bgms, available_bgms)
            new_params["bgm"] = new_bgm
            new_params["_used_bgms"] = used_bgms + [old]
            changes["bgm"] = {"old": old, "new": new_bgm}

        # 扰动文字样式参数（font、font_color、font_position）
        if all(k in new_params for k in ("font", "font_color", "font_position")):
            available_styles = params.get("_text_style_pool", [])
            if available_styles:
                current_style = {
                    "font": new_params["font"],
                    "color": new_params["font_color"],
                    "position": new_params["font_position"],
                }
                new_style = perturber.perturb_text_style(current_style, available_styles)
                for key in ("font", "color", "position"):
                    old = new_params.get({"font": "font", "color": "font_color", "position": "font_position"}[key])
                    new = new_style[key]
                    new_params[{"font": "font", "color": "font_color", "position": "font_position"}[key]] = new
                    if old != new:
                        changes[{"font": "font", "color": "font_color", "position": "font_position"}[key]] = {"old": old, "new": new}

        return new_params, changes


# ============================================================
# 重试管理器
# ============================================================

class RetryManager:
    """
    重试管理器

    在视频生成后检测是否重复，若重复则通过参数扰动生成新的参数并重新生成，
    直至生成非重复视频或达到最大重试次数。
    """

    def __init__(
        self,
        config: RetryConfig | None = None,       # 重试配置
        logger: "Logger | None" = None,          # 日志记录器
        status_manager: "TaskStatusManager | None" = None,  # 任务状态管理器
    ) -> None:
        self.config = config or RetryConfig()
        self._logger = logger
        self._status_manager = status_manager

    def handle_duplicate(
        self,
        task: "Task",
        params: dict[str, Any],
        generate_fn: Callable[[dict[str, Any]], str],
        detect_fn: Callable[["Task", str], "DuplicateResult"],
        notify_fn: Callable[["Task", str], None] | None = None,
        access_token: str = "",
    ) -> RetryResult:
        """
        处理视频生成后的重复检测与自动重试

        生成视频后进行重复检测，若检测到重复则通过参数扰动重新生成，
        循环直至生成非重复视频或达到最大重试次数。

        参数:
            task: 当前任务对象
            params: 视频生成参数
            generate_fn: 视频生成函数，接收参数返回视频路径
            detect_fn: 重复检测函数，接收 task 和视频路径返回 DuplicateResult
            notify_fn: 服务端通知函数（可选），接收 task 和状态字符串

        返回:
            RetryResult: 包含成功状态、重试次数和扰动日志的结果对象
        """
        perturbation_log: list[dict[str, Any]] = []
        current_params = dict(params)
        perturber = ParameterPerturber()

        # 首次生成和检测
        video_path = generate_fn(current_params)
        result = detect_fn(task, video_path)

        retries_used = 0
        max_retries = self.config.max_retries

        # 如果检测到重复且未达到最大重试次数，继续重试
        while result.is_duplicate and retries_used < max_retries:
            retries_used += 1

            # 扰动参数生成新配置
            new_params, changes = perturber.perturb_params(current_params)
            perturbation_log.append({"retry": retries_used, "changes": changes})

            # 记录重试信息到日志
            if self._logger:
                self._logger.info(
                    task_id=task.id,
                    module="重试机制",
                    message=f"第 {retries_used} 次重试，变更: {list(changes.keys())}",
                )

            # 使用新参数重新生成和检测
            current_params = new_params
            video_path = generate_fn(current_params)
            result = detect_fn(task, video_path)

        # 达到最大重试次数仍重复，标记任务失败
        if result.is_duplicate:
            if self._status_manager is not None:
                self._status_manager.transition(task, TaskStatus.FAILED, access_token)
            else:
                task.status = TaskStatus.FAILED
            if self._logger:
                self._logger.error(
                    task_id=task.id,
                    module="重试机制",
                    message=f"重试 {max_retries} 次后仍重复，标记任务失败",
                )
            if notify_fn:
                notify_fn(task, TaskStatus.FAILED)
            return RetryResult(
                success=False,
                retries_used=retries_used,
                final_params=None,
                perturbation_log=perturbation_log,
            )

        # 成功生成非重复视频
        return RetryResult(
            success=True,
            retries_used=retries_used,
            final_params=current_params,
            perturbation_log=perturbation_log,
        )
