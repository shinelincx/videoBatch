import time
from unittest.mock import MagicMock, patch

import pytest

from video_batch.task_queue import Task
from video_batch.task_status import (
    TaskStatus,
    TaskStatusError,
    TaskStatusManager,
    TaskTimeoutError,
)


# ============================================================
# 辅助函数
# ============================================================

def _make_task(task_id: str = "task-001", status: str = "待剪辑") -> Task:
    return Task(id=task_id, material_id="mat-001", status=status)


def _mock_http_response(status_code: int = 200):
    response = MagicMock()
    response.status_code = status_code
    return response


# ============================================================
# AC-1: 任务状态完整实现：pending、processing、completed、failed、retrying
# ============================================================

def test_all_status_constants_defined():
    """五个状态常量均已定义"""
    assert TaskStatus.PENDING == "待剪辑"
    assert TaskStatus.PROCESSING == "剪辑中"
    assert TaskStatus.COMPLETED == "待发布"
    assert TaskStatus.FAILED == "剪辑失败"
    assert TaskStatus.RETRYING == "retrying"


def test_valid_transition_pending_to_processing():
    """pending → processing 是有效转换"""
    task = _make_task(status="待剪辑")
    manager = TaskStatusManager(
        base_url="http://api.example.com",
        http_session=MagicMock(),
    )
    manager.transition(task, TaskStatus.PROCESSING, access_token="token-abc")
    assert task.status == TaskStatus.PROCESSING


def test_valid_transition_processing_to_completed():
    """processing → completed 是有效转换"""
    task = _make_task(status="剪辑中")
    manager = TaskStatusManager(
        base_url="http://api.example.com",
        http_session=MagicMock(),
    )
    manager.transition(task, TaskStatus.COMPLETED, access_token="token-abc")
    assert task.status == TaskStatus.COMPLETED


def test_valid_transition_processing_to_failed():
    """processing → failed 是有效转换"""
    task = _make_task(status="剪辑中")
    manager = TaskStatusManager(
        base_url="http://api.example.com",
        http_session=MagicMock(),
    )
    manager.transition(task, TaskStatus.FAILED, access_token="token-abc")
    assert task.status == TaskStatus.FAILED


def test_valid_transition_processing_to_retrying():
    """processing → retrying 是有效转换（中间状态）"""
    task = _make_task(status="剪辑中")
    manager = TaskStatusManager(
        base_url="http://api.example.com",
        http_session=MagicMock(),
    )
    manager.transition(task, TaskStatus.RETRYING, access_token="token-abc")
    assert task.status == TaskStatus.RETRYING


def test_valid_transition_retrying_to_processing():
    """retrying → processing 是有效转换（重试后恢复）"""
    task = _make_task(status="retrying")
    manager = TaskStatusManager(
        base_url="http://api.example.com",
        http_session=MagicMock(),
    )
    manager.transition(task, TaskStatus.PROCESSING, access_token="token-abc")
    assert task.status == TaskStatus.PROCESSING


def test_valid_transition_retrying_to_failed():
    """retrying → failed 是有效转换（重试耗尽）"""
    task = _make_task(status="retrying")
    manager = TaskStatusManager(
        base_url="http://api.example.com",
        http_session=MagicMock(),
    )
    manager.transition(task, TaskStatus.FAILED, access_token="token-abc")
    assert task.status == TaskStatus.FAILED


def test_invalid_transition_raises_error():
    """无效状态转换抛出 TaskStatusError"""
    task = _make_task(status="待发布")
    manager = TaskStatusManager(
        base_url="http://api.example.com",
        http_session=MagicMock(),
    )

    with pytest.raises(TaskStatusError):
        manager.transition(task, TaskStatus.PROCESSING, access_token="token-abc")


def test_invalid_transition_pending_to_completed():
    """pending 不能直接跳到 completed"""
    task = _make_task(status="待剪辑")
    manager = TaskStatusManager(
        base_url="http://api.example.com",
        http_session=MagicMock(),
    )

    with pytest.raises(TaskStatusError):
        manager.transition(task, TaskStatus.COMPLETED, access_token="token-abc")


def test_invalid_transition_from_completed():
    """completed 状态不能再转换"""
    task = _make_task(status="待发布")
    manager = TaskStatusManager(
        base_url="http://api.example.com",
        http_session=MagicMock(),
    )

    with pytest.raises(TaskStatusError):
        manager.transition(task, TaskStatus.PROCESSING, access_token="token-abc")


def test_invalid_transition_from_failed():
    """failed 状态不能再转换"""
    task = _make_task(status="剪辑失败")
    manager = TaskStatusManager(
        base_url="http://api.example.com",
        http_session=MagicMock(),
    )

    with pytest.raises(TaskStatusError):
        manager.transition(task, TaskStatus.RETRYING, access_token="token-abc")


def test_same_status_transition_is_noop():
    """转换到相同状态不报错（幂等）"""
    task = _make_task(status="待剪辑")
    manager = TaskStatusManager(
        base_url="http://api.example.com",
        http_session=MagicMock(),
    )
    manager.transition(task, TaskStatus.PENDING, access_token="token-abc")
    assert task.status == TaskStatus.PENDING


# ============================================================
# AC-2: 关键状态变更实时同步到服务端
# ============================================================

def test_key_transition_syncs_to_server():
    """pending → processing 触发 PUT /api/tasks/{id}/status"""
    mock_session = MagicMock()
    mock_session.put.return_value = _mock_http_response(200)

    task = _make_task(status="待剪辑")
    manager = TaskStatusManager(
        base_url="http://api.example.com",
        http_session=mock_session,
    )
    manager.transition(task, TaskStatus.PROCESSING, access_token="token-abc")

    mock_session.put.assert_called_once_with(
        "http://api.example.com/api/tasks/task-001/status",
        headers={"Authorization": "Bearer token-abc"},
        json={"status": "剪辑中"},
    )


def test_processing_to_completed_syncs_to_server():
    """processing → completed 触发服务端同步"""
    mock_session = MagicMock()
    mock_session.put.return_value = _mock_http_response(200)

    task = _make_task(status="剪辑中")
    manager = TaskStatusManager(
        base_url="http://api.example.com",
        http_session=mock_session,
    )
    manager.transition(task, TaskStatus.COMPLETED, access_token="token-abc")

    mock_session.put.assert_called_once()
    call_args = mock_session.put.call_args
    assert "待发布" in str(call_args)


def test_processing_to_failed_syncs_to_server():
    """processing → failed 触发服务端同步"""
    mock_session = MagicMock()
    mock_session.put.return_value = _mock_http_response(200)

    task = _make_task(status="剪辑中")
    manager = TaskStatusManager(
        base_url="http://api.example.com",
        http_session=mock_session,
    )
    manager.transition(task, TaskStatus.FAILED, access_token="token-abc")

    mock_session.put.assert_called_once()
    call_args = mock_session.put.call_args
    assert "剪辑失败" in str(call_args)


def test_retrying_to_failed_syncs_to_server():
    """retrying → failed 终态同步到服务端"""
    mock_session = MagicMock()
    mock_session.put.return_value = _mock_http_response(200)

    task = _make_task(status="retrying")
    manager = TaskStatusManager(
        base_url="http://api.example.com",
        http_session=mock_session,
    )
    manager.transition(task, TaskStatus.FAILED, access_token="token-abc")

    mock_session.put.assert_called_once()


# ============================================================
# AC-3: 中间过程状态仅在本地记录，终态统一同步
# ============================================================

def test_processing_to_retrying_does_not_sync():
    """processing → retrying 是中间状态，不同步到服务端"""
    mock_session = MagicMock()

    task = _make_task(status="剪辑中")
    manager = TaskStatusManager(
        base_url="http://api.example.com",
        http_session=mock_session,
    )
    manager.transition(task, TaskStatus.RETRYING, access_token="token-abc")

    mock_session.put.assert_not_called()


def test_retrying_to_processing_does_not_sync():
    """retrying → processing 是中间状态，不同步到服务端"""
    mock_session = MagicMock()

    task = _make_task(status="retrying")
    manager = TaskStatusManager(
        base_url="http://api.example.com",
        http_session=mock_session,
    )
    manager.transition(task, TaskStatus.PROCESSING, access_token="token-abc")

    mock_session.put.assert_not_called()


# ============================================================
# AC-4: 任务执行超时标记失败
# ============================================================

def test_run_with_timeout_marks_failed_on_expiry():
    """执行超时后任务标记为 failed"""
    mock_session = MagicMock()
    mock_session.put.return_value = _mock_http_response(200)

    task = _make_task(status="剪辑中")
    manager = TaskStatusManager(
        base_url="http://api.example.com",
        http_session=mock_session,
    )

    def slow_func():
        time.sleep(999)

    with pytest.raises(TaskTimeoutError):
        manager.run_with_timeout(
            task,
            step_name="视频剪辑",
            timeout_seconds=0.01,
            access_token="token-abc",
            func=slow_func,
        )

    assert task.status == TaskStatus.FAILED


def test_func_completes_within_timeout():
    """函数在超时前完成，正常返回结果"""
    mock_session = MagicMock()
    task = _make_task(status="剪辑中")
    manager = TaskStatusManager(
        base_url="http://api.example.com",
        http_session=mock_session,
    )

    result = manager.run_with_timeout(
        task,
        step_name="文案生成",
        timeout_seconds=30,
        access_token="token-abc",
        func=lambda: "done",
    )

    assert result == "done"
    assert task.status == TaskStatus.PROCESSING


def test_run_with_timeout_marks_failed_on_exception():
    """函数执行异常时任务标记为 failed"""
    mock_session = MagicMock()
    mock_session.put.return_value = _mock_http_response(200)

    task = _make_task(status="剪辑中")
    manager = TaskStatusManager(
        base_url="http://api.example.com",
        http_session=mock_session,
    )

    def fail_func():
        raise ValueError("执行异常")

    with pytest.raises(ValueError, match="执行异常"):
        manager.run_with_timeout(
            task,
            step_name="视频剪辑",
            timeout_seconds=30,
            access_token="token-abc",
            func=fail_func,
        )

    assert task.status == TaskStatus.FAILED


def test_timeout_constants_are_defined():
    """超时常量已定义"""
    assert TaskStatusManager.VIDEO_EDIT_TIMEOUT == 120
    assert TaskStatusManager.COPYWRITING_TIMEOUT == 30
    assert TaskStatusManager.DETECTION_TIMEOUT == 30


# ============================================================
# AC-5: 服务端同步失败记录日志并重试
# ============================================================

def test_sync_failure_retries():
    """同步失败时应重试"""
    mock_session = MagicMock()
    # 前两次 502，第三次 200
    mock_session.put.side_effect = [
        _mock_http_response(502),
        _mock_http_response(502),
        _mock_http_response(200),
    ]
    logger = MagicMock()

    task = _make_task(status="待剪辑")
    manager = TaskStatusManager(
        base_url="http://api.example.com",
        http_session=mock_session,
        logger=logger,
    )

    with patch("video_batch.retry.time.sleep"):
        manager.sync_to_server(task, access_token="token-abc")

    assert mock_session.put.call_count == 3


def test_sync_failure_logs_error():
    """同步失败时记录 ERROR 日志"""
    mock_session = MagicMock()
    mock_session.put.return_value = _mock_http_response(502)
    logger = MagicMock()

    task = _make_task(status="待剪辑")
    manager = TaskStatusManager(
        base_url="http://api.example.com",
        http_session=mock_session,
        logger=logger,
    )

    with patch("video_batch.retry.time.sleep"):
        manager.sync_to_server(task, access_token="token-abc")

    assert logger.error.called


# ============================================================
# AC-6: 状态变更记录日志
# ============================================================

def test_transition_logs_info_on_success():
    """状态转换成功记录 INFO 日志"""
    mock_session = MagicMock()
    mock_session.put.return_value = _mock_http_response(200)
    logger = MagicMock()

    task = _make_task(status="待剪辑")
    manager = TaskStatusManager(
        base_url="http://api.example.com",
        http_session=mock_session,
        logger=logger,
    )
    manager.transition(task, TaskStatus.PROCESSING, access_token="token-abc")

    logger.info.assert_called()


def test_transition_logs_error_on_invalid():
    """无效转换记录 ERROR 日志并抛出异常"""
    logger = MagicMock()

    task = _make_task(status="待发布")
    manager = TaskStatusManager(
        base_url="http://api.example.com",
        http_session=MagicMock(),
        logger=logger,
    )

    with pytest.raises(TaskStatusError):
        manager.transition(task, TaskStatus.PROCESSING, access_token="token-abc")

    logger.error.assert_called()


def test_transition_logs_info_for_intermediate_state():
    """中间状态转换也记录 INFO 日志"""
    mock_session = MagicMock()
    logger = MagicMock()

    task = _make_task(status="剪辑中")
    manager = TaskStatusManager(
        base_url="http://api.example.com",
        http_session=mock_session,
        logger=logger,
    )
    manager.transition(task, TaskStatus.RETRYING, access_token="token-abc")

    logger.info.assert_called()
    mock_session.put.assert_not_called()


# ============================================================
# 边界条件
# ============================================================

def test_transition_does_not_sync_for_non_key_transition():
    """非关键状态转换不触发任何 HTTP 请求"""
    mock_session = MagicMock()

    task = _make_task(status="剪辑中")
    manager = TaskStatusManager(
        base_url="http://api.example.com",
        http_session=mock_session,
    )
    manager.transition(task, TaskStatus.RETRYING, access_token="token-abc")

    mock_session.put.assert_not_called()
    mock_session.get.assert_not_called()
    mock_session.post.assert_not_called()


def test_get_current_status_returns_task_status():
    """get_current_status 返回任务当前状态"""
    task = _make_task(status="剪辑中")
    manager = TaskStatusManager(
        base_url="http://api.example.com",
        http_session=MagicMock(),
    )
    assert manager.get_current_status(task) == TaskStatus.PROCESSING


def test_sync_sends_correct_json_payload():
    """sync_to_server 发送正确的 JSON payload"""
    mock_session = MagicMock()
    mock_session.put.return_value = _mock_http_response(200)

    task = _make_task(status="剪辑中", task_id="task-007")
    manager = TaskStatusManager(
        base_url="http://api.example.com",
        http_session=mock_session,
    )
    manager.sync_to_server(task, access_token="token-abc")

    mock_session.put.assert_called_once_with(
        "http://api.example.com/api/tasks/task-007/status",
        headers={"Authorization": "Bearer token-abc"},
        json={"status": "剪辑中"},
    )