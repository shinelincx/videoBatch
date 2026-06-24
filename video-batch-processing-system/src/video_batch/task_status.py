"""
任务状态管理模块 - 状态流转控制与超时处理

负责管理任务的生命周期状态流转，提供状态同步、超时控制等功能，
确保任务状态变更的合法性和与服务端的一致性。
"""

import hashlib
import json
import secrets
import threading
import time
from typing import Any, Callable, TYPE_CHECKING
from urllib.parse import urlparse

from video_batch.retry import with_retry

_SIGN_KEY = "s.0wl?.i_s43$i1_"

if TYPE_CHECKING:
    from video_batch.logger import Logger
    from video_batch.task_queue import Task


class TaskStatusError(Exception):
    """任务状态异常"""
    pass


class TaskTimeoutError(Exception):
    """任务执行超时异常"""
    pass


class TaskStatus:
    """
    任务状态常量与状态流转规则

    定义了任务的所有可能状态以及合法的状态转换规则。
    """
    PENDING = "待剪辑"       # 待剪辑
    PROCESSING = "剪辑中" # 剪辑中
    COMPLETED = "待发布"   # 待发布
    FAILED = "剪辑失败"         # 剪辑失败
    RETRYING = "retrying"     # 重试中

    # 合法的状态转换集合
    VALID_TRANSITIONS: set[tuple[str, str]] = {
        (PENDING, PROCESSING),     # 待处理 -> 处理中
        (PROCESSING, COMPLETED),   # 处理中 -> 已完成
        (PROCESSING, FAILED),      # 处理中 -> 已失败
        (PROCESSING, RETRYING),    # 处理中 -> 重试中
        (RETRYING, PROCESSING),    # 重试中 -> 处理中
        (RETRYING, FAILED),        # 重试中 -> 已失败
    }

    # 需要同步到服务端的关键状态转换集合
    KEY_TRANSITIONS: set[tuple[str, str]] = {
        (PENDING, PROCESSING),     # 开始剪辑
        (PROCESSING, COMPLETED),   # 完成剪辑
        (PROCESSING, FAILED),      # 剪辑失败
        (PROCESSING, RETRYING),    # 进入重试
        (RETRYING, FAILED),        # 重试失败
    }

    @staticmethod
    def is_valid_transition(from_status: str, to_status: str) -> bool:
        """
        检查状态转换是否合法

        参数:
            from_status: 当前状态
            to_status: 目标状态

        返回:
            转换合法返回 True，否则返回 False
        """
        return (from_status, to_status) in TaskStatus.VALID_TRANSITIONS

    @staticmethod
    def is_key_transition(from_status: str, to_status: str) -> bool:
        """
        检查是否为需要同步到服务端的关键状态转换

        参数:
            from_status: 当前状态
            to_status: 目标状态

        返回:
            是关键转换返回 True，否则返回 False
        """
        return (from_status, to_status) in TaskStatus.KEY_TRANSITIONS


class TaskStatusManager:
    """
    任务状态管理器

    负责任务状态的合法转换、与服务端的状态同步，以及带超时控制的
    任务执行功能。
    """
    VIDEO_EDIT_TIMEOUT = 120        # 视频编辑超时时间（秒）
    COPYWRITING_TIMEOUT = 30        # 文案生成超时时间（秒）
    DETECTION_TIMEOUT = 30          # 重复检测超时时间（秒）

    def __init__(
        self,
        base_url: str,              # 远程 API 基础 URL
        http_session,                # HTTP 客户端会话
        logger: "Logger | None" = None, # 日志记录器
    ) -> None:
        self._base_url = base_url
        self._http = http_session
        self._logger = logger

    def transition(
        self,
        task: "Task",
        new_status: str,
        access_token: str,
        failure_reason: str = "",
    ) -> None:
        """
        执行任务状态转换

        验证转换合法性，更新任务状态，并在关键转换时同步到服务端。

        参数:
            task: 当前任务对象
            new_status: 目标状态
            access_token: 认证访问令牌

        异常:
            TaskStatusError: 状态转换不合法时抛出
        """
        old_status = task.status

        # 状态未变化，无需转换
        if old_status == new_status:
            return

        # 验证状态转换是否合法
        if not TaskStatus.is_valid_transition(old_status, new_status):
            if self._logger:
                self._logger.error(
                    task_id=task.id,
                    module="状态管理",
                    message=f"无效状态转换: {old_status} → {new_status}",
                )
            raise TaskStatusError(
                f"无效状态转换: {old_status} → {new_status}"
            )

        # 更新任务状态
        task.status = new_status

        # 记录状态变更信息
        if self._logger:
            self._logger.info(
                task_id=task.id,
                module="状态管理",
                message=f"状态变更: {old_status} → {new_status}",
            )

        # 关键状态转换需要同步到服务端
        if TaskStatus.is_key_transition(old_status, new_status):
            self.sync_to_server(task, access_token, failure_reason=failure_reason)

    def sync_to_server(
        self,
        task: "Task",
        access_token: str,
        failure_reason: str = "",
    ) -> None:
        """
        将任务状态同步到远程服务器

        使用重试机制确保同步可靠性。

        参数:
            task: 当前任务对象
            access_token: 认证访问令牌
        """
        def _do_sync() -> None:
            path = "/selection/record/update_status_by_product_id"
            url = f"{self._base_url.rstrip('/')}{path}"
            headers = self._make_signed_headers(path)
            headers["Authorization"] = f"Bearer {access_token}"
            headers["Content-Type"] = "application/json"
            payload = {"productId": task.productId, "status": task.status}
            if task.status == TaskStatus.FAILED:
                reason = _normalize_failure_reason(failure_reason)
                payload.update({
                    "failureReason": reason,
                    "reason": reason,
                    "failReason": reason,
                })
            if self._logger:
                self._logger.info(
                    task_id=task.id,
                    module="状态管理",
                    message=f"同步任务状态: POST {url} productId={task.productId} status={task.status}",
                )
            response = self._http.post(url, headers=headers, json=payload)
            if self._logger:
                body_preview = response.text[:200] if response.text else "(empty)"
                self._logger.info(
                    task_id=task.id,
                    module="状态管理",
                    message=f"状态同步响应: HTTP {response.status_code} | {body_preview}",
                )
            if response.status_code != 200:
                raise TaskStatusError(
                    f"状态同步 HTTP {response.status_code}"
                )
            try:
                body = response.json()
            except Exception:
                body = None
            if isinstance(body, dict) and body.get("code") not in (None, 0):
                raise TaskStatusError(str(body.get("msg") or "status sync failed"))

        try:
            # 使用重试机制执行同步，最多重试 3 次
            with_retry(_do_sync, max_retries=3)
        except Exception as e:
            # 同步失败记录日志，但不影响本地状态
            if self._logger:
                self._logger.error(
                    task_id=task.id,
                    module="状态管理",
                    message=f"状态同步失败: {e}",
                )

    def run_with_timeout(
        self,
        task: "Task",
        step_name: str,
        timeout_seconds: float,
        access_token: str,
        func: Callable[..., Any],
        *args: Any,
        **kwargs: Any,
    ) -> Any:
        """
        带超时控制的任务执行

        在独立线程中执行指定函数，超时则标记任务为失败。

        参数:
            task: 当前任务对象
            step_name: 执行步骤名称（用于超时提示信息）
            timeout_seconds: 超时时间（秒）
            access_token: 认证访问令牌
            func: 待执行的函数
            *args: 传递给函数的位置参数
            **kwargs: 传递给函数的关键字参数

        返回:
            函数执行结果

        异常:
            TaskTimeoutError: 执行超时时抛出
            Exception: 函数执行异常时抛出原始异常
        """
        result_container: list[Any] = []
        error_container: list[Exception] = []

        def _target() -> None:
            """线程目标函数，捕获执行结果或异常"""
            try:
                result_container.append(func(*args, **kwargs))
            except Exception as e:
                error_container.append(e)

        # 在后台线程执行目标函数
        thread = threading.Thread(target=_target, daemon=True)
        thread.start()
        thread.join(timeout=timeout_seconds)

        # 检查是否超时
        if thread.is_alive():
            reason = "%s timed out after %s seconds" % (step_name, timeout_seconds)
            self.transition(
                task,
                TaskStatus.FAILED,
                access_token,
                failure_reason=reason,
            )
            raise TaskTimeoutError(
                f"{step_name} 执行超时（{timeout_seconds}秒），任务标记为失败"
            )

        # 检查是否有异常
        if error_container:
            error = error_container[0]
            self.transition(
                task,
                TaskStatus.FAILED,
                access_token,
                failure_reason=str(error),
            )
            raise error

        return result_container[0]

    def get_current_status(self, task: "Task") -> str:
        """
        获取任务当前状态

        参数:
            task: 任务对象

        返回:
            当前状态字符串
        """
        return task.status

    @staticmethod
    def _make_signed_headers(request_path: str) -> dict[str, str]:
        ts = str(int(time.time() * 1000))
        nonce = secrets.token_hex(12)
        parsed = urlparse(request_path)
        uri = parsed.path or "/"
        if uri.startswith("/api/"):
            uri = uri[4:]
        params = {"timestamp": ts, "nonceStr": nonce, "uri": uri}
        sign_str = "&".join(f"{k}={params[k]}" for k in sorted(params))
        signature = hashlib.md5(f"{sign_str}&key={_SIGN_KEY}".encode()).hexdigest()
        return {
            "signature": signature.lower(),
            "timestamp": ts,
            "nonceStr": nonce,
            "uri": uri,
        }


def _normalize_failure_reason(reason: str) -> str:
    reason = str(reason or "").strip()
    if not reason:
        return "unknown failure"
    return reason[:500]
