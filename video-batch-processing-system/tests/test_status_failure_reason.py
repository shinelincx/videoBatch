from unittest.mock import MagicMock, patch

import pytest

from video_batch.task_queue import Task
from video_batch.task_status import TaskStatus, TaskStatusManager, TaskTimeoutError


def _response(status_code=200, text='{"code":0}'):
    response = MagicMock()
    response.status_code = status_code
    response.text = text
    return response


def test_failed_status_sync_includes_failure_reason():
    session = MagicMock()
    session.post.return_value = _response()
    task = Task(id="task-001", productId="product-001", status=TaskStatus.PROCESSING)
    manager = TaskStatusManager("http://api.example.com", session)

    manager.transition(
        task,
        TaskStatus.FAILED,
        access_token="token-abc",
        failure_reason="audio generation failed: missing dependency",
    )

    _, kwargs = session.post.call_args
    assert kwargs["json"]["failureReason"] == "audio generation failed: missing dependency"


def test_run_with_timeout_passes_exception_message_as_failure_reason():
    session = MagicMock()
    session.post.return_value = _response()
    task = Task(id="task-001", productId="product-001", status=TaskStatus.PROCESSING)
    manager = TaskStatusManager("http://api.example.com", session)

    def fail():
        raise ValueError("boom")

    with pytest.raises(ValueError):
        manager.run_with_timeout(
            task,
            step_name="step",
            timeout_seconds=1,
            access_token="token-abc",
            func=fail,
        )

    _, kwargs = session.post.call_args
    assert kwargs["json"]["failureReason"] == "boom"


def test_run_with_timeout_passes_timeout_as_failure_reason():
    session = MagicMock()
    session.post.return_value = _response()
    task = Task(id="task-001", productId="product-001", status=TaskStatus.PROCESSING)
    manager = TaskStatusManager("http://api.example.com", session)

    with patch("threading.Thread") as thread_cls:
        thread = thread_cls.return_value
        thread.is_alive.return_value = True

        with pytest.raises(TaskTimeoutError):
            manager.run_with_timeout(
                task,
                step_name="render",
                timeout_seconds=0.01,
                access_token="token-abc",
                func=lambda: None,
            )

    _, kwargs = session.post.call_args
    assert "render" in kwargs["json"]["failureReason"]
