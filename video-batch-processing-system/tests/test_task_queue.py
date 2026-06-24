import pytest
from unittest.mock import MagicMock

from video_batch.task_queue import Task, TaskQueue, TaskQueueError


# ============================================================
# 辅助函数
# ============================================================

def _task_data(task_id: str, material_id: str, **overrides) -> dict:
    """构建模拟 API 返回的单条任务数据"""
    data = {
        "id": task_id,
        "material_id": material_id,
        "status": "待剪辑",
        "created_at": "2026-05-19T00:00:00",
    }
    data.update(overrides)
    return data


def _mock_http_response(json_data, status_code: int = 200):
    """构建模拟的 HTTP Response 对象"""
    response = MagicMock()
    response.status_code = status_code
    response.json.return_value = json_data
    return response


# ============================================================
# Task 数据模型
# ============================================================

def test_task_has_required_fields():
    """Task 包含 id 和 material_id 必要字段"""
    task = Task(id="task-001", material_id="mat-001")

    assert task.id == "task-001"
    assert task.material_id == "mat-001"


def test_task_from_dict_parses_all_fields():
    """from_dict 解析 API 返回的全部字段"""
    raw = {
        "id": "task-001",
        "material_id": "mat-001",
        "status": "待剪辑",
        "config_id": "cfg-001",
        "mode": "image-to-video",
        "priority": 5,
        "retry_count": 0,
        "created_at": "2026-05-19T10:30:00",
    }
    task = Task.from_dict(raw)

    assert task.id == "task-001"
    assert task.material_id == "mat-001"
    assert task.status == "待剪辑"
    assert task.config_id == "cfg-001"
    assert task.mode == "image-to-video"
    assert task.priority == 5
    assert task.retry_count == 0
    assert task.created_at == "2026-05-19T10:30:00"


def test_task_from_dict_maps_clip_config_code_to_config_id():
    task = Task.from_dict({
        "id": "task-001",
        "productId": "product-001",
        "clipConfigCode": "cfg-ref-v3",
    })

    assert task.config_id == "cfg-ref-v3"


def test_task_from_dict_preserves_product_copy_fields():
    task = Task.from_dict({
        "id": "task-001",
        "productId": "product-001",
        "productCategoryName": "女装",
        "productTitle": "夏季纯棉套装",
    })

    assert task.productCategoryName == "女装"
    assert task.productTitle == "夏季纯棉套装"


def test_task_from_dict_defaults_missing_fields():
    """缺少部分字段时使用默认值"""
    task = Task.from_dict({"id": "task-001", "material_id": "mat-001"})

    assert task.status == "待剪辑"
    assert task.priority == 0
    assert task.retry_count == 0
    assert task.config_id is None
    assert task.mode is None


# ============================================================
# AC-1: 调用 /clip_record/pending_clip/list 获取待剪辑任务列表
# ============================================================

def test_fetch_tasks_calls_api():
    """fetch_tasks 调用 /clip_record/pending_clip/list 并传递认证头"""
    mock_session = MagicMock()
    mock_session.get.return_value = _mock_http_response(
        [
            _task_data("task-001", "mat-001"),
            _task_data("task-002", "mat-002"),
        ]
    )

    queue = TaskQueue(
        base_url="http://api.example.com",
        http_session=mock_session,
    )
    tasks = queue.fetch_tasks(access_token="token-abc")

    mock_session.get.assert_called_once_with(
        "http://api.example.com/clip_record/pending_clip/list",
        headers={"Authorization": "Bearer token-abc"},
    )
    assert len(tasks) == 2
    assert tasks[0].id == "task-001"
    assert tasks[1].id == "task-002"


# ============================================================
# AC-2: 每个任务包含任务 ID 和关联的素材 ID
# ============================================================

def test_fetched_tasks_have_id_and_material_id():
    """获取的任务列表每个任务都包含 id 和 material_id"""
    mock_session = MagicMock()
    mock_session.get.return_value = _mock_http_response(
        [
            _task_data("task-001", "mat-001"),
            _task_data("task-002", "mat-002"),
        ]
    )

    queue = TaskQueue(
        base_url="http://api.example.com",
        http_session=mock_session,
    )
    tasks = queue.fetch_tasks(access_token="token-abc")

    for task in tasks:
        assert isinstance(task, Task)
        assert task.id is not None
        assert task.material_id is not None


# ============================================================
# AC-3: 建立本地任务队列
# ============================================================

def test_fetch_and_enqueue_builds_queue():
    """fetch_and_enqueue 获取任务并建立本地队列"""
    mock_session = MagicMock()
    mock_session.get.return_value = _mock_http_response(
        [
            _task_data("task-001", "mat-001", created_at="2026-05-19T10:00:00"),
            _task_data("task-002", "mat-002", created_at="2026-05-19T11:00:00"),
        ]
    )

    queue = TaskQueue(
        base_url="http://api.example.com",
        http_session=mock_session,
    )
    queue.fetch_and_enqueue(access_token="token-abc")

    assert queue.size() == 2
    assert not queue.is_empty()


def test_dequeue_returns_tasks_in_order():
    """dequeue 按顺序取出任务"""
    mock_session = MagicMock()
    mock_session.get.return_value = _mock_http_response(
        [
            _task_data("task-001", "mat-001", created_at="2026-05-19T10:00:00"),
            _task_data("task-002", "mat-002", created_at="2026-05-19T11:00:00"),
        ]
    )

    queue = TaskQueue(
        base_url="http://api.example.com",
        http_session=mock_session,
    )
    queue.fetch_and_enqueue(access_token="token-abc")

    first = queue.dequeue()
    assert first.id == "task-001"

    second = queue.dequeue()
    assert second.id == "task-002"

    assert queue.is_empty()


def test_peek_returns_next_without_removing():
    """peek 预览下一个任务但不从队列移除"""
    mock_session = MagicMock()
    mock_session.get.return_value = _mock_http_response(
        [_task_data("task-001", "mat-001")]
    )

    queue = TaskQueue(
        base_url="http://api.example.com",
        http_session=mock_session,
    )
    queue.fetch_and_enqueue(access_token="token-abc")

    assert queue.size() == 1
    task = queue.peek()
    assert task.id == "task-001"
    assert queue.size() == 1


def test_dequeue_empty_queue_raises_error():
    """空队列 dequeue 抛出 TaskQueueError"""
    queue = TaskQueue(
        base_url="http://api.example.com",
        http_session=MagicMock(),
    )

    with pytest.raises(TaskQueueError, match="队列为空"):
        queue.dequeue()


def test_peek_empty_queue_raises_error():
    """空队列 peek 抛出 TaskQueueError"""
    queue = TaskQueue(
        base_url="http://api.example.com",
        http_session=MagicMock(),
    )

    with pytest.raises(TaskQueueError, match="队列为空"):
        queue.peek()


# ============================================================
# AC-4: 默认按任务创建时间排序（先到先得）
# ============================================================

def test_default_ordering_is_fifo_by_created_at():
    """没有优先级时按创建时间升序（先创建先服务）"""
    mock_session = MagicMock()
    mock_session.get.return_value = _mock_http_response(
        [
            _task_data("task-003", "mat-003", created_at="2026-05-19T12:00:00"),
            _task_data("task-001", "mat-001", created_at="2026-05-19T10:00:00"),
            _task_data("task-002", "mat-002", created_at="2026-05-19T11:00:00"),
        ]
    )

    queue = TaskQueue(
        base_url="http://api.example.com",
        http_session=mock_session,
    )
    queue.fetch_and_enqueue(access_token="token-abc")

    assert queue.dequeue().id == "task-001"
    assert queue.dequeue().id == "task-002"
    assert queue.dequeue().id == "task-003"


# ============================================================
# AC-5: 支持服务端指定优先级覆盖默认排序
# ============================================================

def test_priority_overrides_default_ordering():
    """高优先级任务优先出队，同优先级内按创建时间排序"""
    mock_session = MagicMock()
    mock_session.get.return_value = _mock_http_response(
        [
            _task_data("task-001", "mat-001", created_at="2026-05-19T10:00:00", priority=0),
            _task_data("task-002", "mat-002", created_at="2026-05-19T11:00:00", priority=0),
            _task_data("task-003", "mat-003", created_at="2026-05-19T12:00:00", priority=10),
            _task_data("task-004", "mat-004", created_at="2026-05-19T09:00:00", priority=5),
        ]
    )

    queue = TaskQueue(
        base_url="http://api.example.com",
        http_session=mock_session,
    )
    queue.fetch_and_enqueue(access_token="token-abc")

    assert queue.dequeue().id == "task-003"  # priority=10 最高
    assert queue.dequeue().id == "task-004"  # priority=5
    assert queue.dequeue().id == "task-001"  # priority=0, 10:00
    assert queue.dequeue().id == "task-002"  # priority=0, 11:00


def test_same_priority_uses_fifo():
    """相同优先级任务保持先到先得顺序"""
    mock_session = MagicMock()
    mock_session.get.return_value = _mock_http_response(
        [
            _task_data("task-002", "mat-002", created_at="2026-05-19T11:00:00", priority=5),
            _task_data("task-001", "mat-001", created_at="2026-05-19T10:00:00", priority=5),
        ]
    )

    queue = TaskQueue(
        base_url="http://api.example.com",
        http_session=mock_session,
    )
    queue.fetch_and_enqueue(access_token="token-abc")

    assert queue.dequeue().id == "task-001"  # 同优先级，先创建
    assert queue.dequeue().id == "task-002"


def test_fetch_and_enqueue_replaces_existing_queue():
    """再次调用 fetch_and_enqueue 会清空旧队列并重新填充"""
    mock_session = MagicMock()
    mock_session.get.return_value = _mock_http_response(
        [_task_data("task-001", "mat-001")]
    )

    queue = TaskQueue(
        base_url="http://api.example.com",
        http_session=mock_session,
    )
    queue.fetch_and_enqueue(access_token="token-abc")
    assert queue.size() == 1

    mock_session.get.return_value = _mock_http_response(
        [
            _task_data("task-002", "mat-002"),
            _task_data("task-003", "mat-003"),
        ]
    )
    queue.fetch_and_enqueue(access_token="token-abc")
    assert queue.size() == 2
    assert queue.dequeue().id == "task-002"


# ============================================================
# AC-6: 任务获取和队列建立记录日志
# ============================================================

def test_fetch_and_enqueue_logs_info_on_success():
    """获取任务并建立队列成功后记录 INFO 日志"""
    mock_session = MagicMock()
    mock_session.get.return_value = _mock_http_response(
        [_task_data("task-001", "mat-001"), _task_data("task-002", "mat-002")]
    )
    logger = MagicMock()

    queue = TaskQueue(
        base_url="http://api.example.com",
        http_session=mock_session,
        logger=logger,
    )
    queue.fetch_and_enqueue(access_token="token-abc")

    logger.info.assert_called()


def test_fetch_and_enqueue_logs_info_on_empty_list():
    """获取到空任务列表时也记录 INFO 日志"""
    mock_session = MagicMock()
    mock_session.get.return_value = _mock_http_response([])
    logger = MagicMock()

    queue = TaskQueue(
        base_url="http://api.example.com",
        http_session=mock_session,
        logger=logger,
    )
    queue.fetch_and_enqueue(access_token="token-abc")

    assert queue.size() == 0
    logger.info.assert_called()


def test_fetch_and_enqueue_logs_error_on_network_failure():
    """网络异常时记录 ERROR 日志并抛出异常"""
    mock_session = MagicMock()
    mock_session.get.side_effect = ConnectionError("网络不可达")
    logger = MagicMock()

    queue = TaskQueue(
        base_url="http://api.example.com",
        http_session=mock_session,
        logger=logger,
    )

    with pytest.raises(TaskQueueError):
        queue.fetch_and_enqueue(access_token="token-abc")

    logger.error.assert_called()


def test_fetch_tasks_handles_http_error():
    """HTTP 非 200 状态码记录 ERROR 日志并抛出异常"""
    mock_session = MagicMock()
    mock_session.get.return_value = _mock_http_response(
        {"detail": "Internal Server Error"}, status_code=500
    )
    logger = MagicMock()

    queue = TaskQueue(
        base_url="http://api.example.com",
        http_session=mock_session,
        logger=logger,
    )

    with pytest.raises(TaskQueueError):
        queue.fetch_tasks(access_token="token-abc")

    logger.error.assert_called()


# ============================================================
# 边界条件
# ============================================================

def test_size_returns_zero_for_empty_queue():
    """空队列 size() 返回 0"""
    queue = TaskQueue(
        base_url="http://api.example.com",
        http_session=MagicMock(),
    )
    assert queue.size() == 0
    assert queue.is_empty()


def test_fetch_tasks_with_priorities_preserves_all_fields():
    """带优先级的任务列表保留所有字段"""
    mock_session = MagicMock()
    mock_session.get.return_value = _mock_http_response(
        [
            _task_data("task-001", "mat-001", priority=10, mode="reference-video"),
            _task_data("task-002", "mat-002", priority=0, mode="image-to-video"),
        ]
    )

    queue = TaskQueue(
        base_url="http://api.example.com",
        http_session=mock_session,
    )
    tasks = queue.fetch_tasks(access_token="token-abc")

    assert tasks[0].priority == 10
    assert tasks[0].mode == "reference-video"
    assert tasks[1].priority == 0
    assert tasks[1].mode == "image-to-video"
