"""演示：模拟 /clip_record/pending_clip/list 接口并生成本地任务队列。

直接运行即可打印按优先级+创建时间排序后的任务列表，供后续步骤测试使用。
"""
import sys
from pathlib import Path
from unittest.mock import MagicMock

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from video_batch.task_queue import TaskQueue

# ---- 模拟服务端返回的任务列表 ------------------------------------------------
# 混合了不同优先级和不同创建时间的任务，验证排序逻辑

MOCK_TASKS = [
    {
        "id": "task-001",
        "material_id": "mat-img-001",
        "status": "待剪辑",
        "config_id": "cfg-001",
        "mode": "image-to-video",
        "priority": 0,
        "retry_count": 0,
        "created_at": "2026-05-19T08:00:00",
    },
    {
        "id": "task-002",
        "material_id": "mat-img-002",
        "status": "待剪辑",
        "config_id": "cfg-001",
        "mode": "image-to-video",
        "priority": 0,
        "retry_count": 0,
        "created_at": "2026-05-19T08:30:00",
    },
    {
        "id": "task-003",
        "material_id": "mat-video-001",
        "status": "待剪辑",
        "config_id": "cfg-002",
        "mode": "reference-video",
        "priority": 10,
        "retry_count": 0,
        "created_at": "2026-05-19T09:00:00",
    },
    {
        "id": "task-004",
        "material_id": "mat-img-003",
        "status": "待剪辑",
        "config_id": "cfg-001",
        "mode": "image-to-video",
        "priority": 0,
        "retry_count": 0,
        "created_at": "2026-05-19T09:15:00",
    },
    {
        "id": "task-005",
        "material_id": "mat-img-004",
        "status": "待剪辑",
        "config_id": "cfg-001",
        "mode": "image-to-video",
        "priority": 5,
        "retry_count": 0,
        "created_at": "2026-05-19T10:00:00",
    },
]


def main():
    # 构建 mock HTTP session
    mock_session = MagicMock()
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = MOCK_TASKS
    mock_session.get.return_value = mock_response

    queue = TaskQueue(
        base_url="http://localhost:8000",
        http_session=mock_session,
    )
    queue.fetch_and_enqueue(access_token="demo-token")

    print(f"任务队列已建立，共 {queue.size()} 个任务\n")

    # 按出队顺序打印
    print("出队顺序（→ 高优先级优先，同级按创建时间 FIFO）:")
    print("-" * 70)
    order = 1
    while not queue.is_empty():
        task = queue.dequeue()
        print(
            f"  #{order}  {task.id}"
            f"  |  priority={task.priority}"
            f"  |  material={task.material_id}"
            f"  |  mode={task.mode}"
            f"  |  created={task.created_at}"
        )
        order += 1

    print()
    print("期望顺序: task-003(pri=10) → task-005(pri=5) → task-001 → task-002 → task-004")
    print("         ↑ 高优先先出              ↑ 同级 FIFO: 08:00 < 08:30 < 09:15")


if __name__ == "__main__":
    main()