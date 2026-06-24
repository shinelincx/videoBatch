from __future__ import annotations

import threading
from collections import deque
from typing import Any, Callable, Deque

from api import ApiClient, ApiError, SessionExpired


PublishTask = dict[str, Any]


class PublishTaskReceiver:
    def __init__(
        self,
        api: ApiClient,
        task_handler: Callable[[PublishTask], None],
        hold_provider: Callable[[], bool],
        session_expired_handler: Callable[[str], None],
        error_handler: Callable[[str], None],
        poll_interval_seconds: float = 3,
        hold_interval_seconds: float = 1,
        retry_interval_seconds: float = 5,
        pending_interval_seconds: float = 1,
    ) -> None:
        self.api = api
        self.task_handler = task_handler
        self.hold_provider = hold_provider
        self.session_expired_handler = session_expired_handler
        self.error_handler = error_handler
        self.poll_interval_seconds = poll_interval_seconds
        self.hold_interval_seconds = hold_interval_seconds
        self.retry_interval_seconds = retry_interval_seconds
        self.pending_interval_seconds = pending_interval_seconds
        self.pending_tasks: Deque[PublishTask] = deque()
        self.pending_lock = threading.Lock()
        self._stop_event = threading.Event()
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()

    def requeue_if_holding(self, task: PublishTask) -> bool:
        if not self.is_holding():
            return False
        self.requeue_front(task)
        return True

    def requeue_front(self, task: PublishTask) -> None:
        if not task:
            return
        with self.pending_lock:
            self.pending_tasks.appendleft(task)

    def receive_once(self) -> float:
        if self.is_holding():
            return self.hold_interval_seconds

        task = self._pop_pending_task()
        if task:
            self.task_handler(task)
            return self.pending_interval_seconds

        try:
            task = self.api.poll_publish_account_task()
        except SessionExpired as exc:
            self.session_expired_handler(str(exc))
            self.stop()
            return self.hold_interval_seconds
        except ApiError as exc:
            self.error_handler(f"任务读取失败：{exc}")
            return self.retry_interval_seconds

        if task:
            self.task_handler(task)
        return self.poll_interval_seconds

    def is_holding(self) -> bool:
        return bool(self.hold_provider())

    def _run(self) -> None:
        while not self._stop_event.is_set():
            wait_seconds = self.receive_once()
            self._stop_event.wait(wait_seconds)

    def _pop_pending_task(self) -> PublishTask:
        with self.pending_lock:
            if not self.pending_tasks:
                return {}
            return self.pending_tasks.popleft()
