from unittest.mock import MagicMock

import pytest

from video_batch.task_queue import Task
from video_batch.task_monitor import (
    TaskDisplayInfo,
    TaskMonitor,
)


def _make_task(
    task_id: str = "task-001",
    status: str = "待剪辑",
    mode: str | None = None,
) -> Task:
    return Task(
        id=task_id,
        material_id="mat-001",
        status=status,
        mode=mode,
    )


def _make_sample_tasks() -> list[Task]:
    return [
        _make_task("task-001", "待剪辑", "image_to_video"),
        _make_task("task-002", "剪辑中", "reference_video"),
        _make_task("task-003", "待发布", "image_to_video"),
        _make_task("task-004", "剪辑失败", "reference_video"),
    ]


# ============================================================
# AC-1: 任务列表展示所有任务的 ID、类型、状态
# ============================================================

def test_task_list_shows_all_tasks():
    """任务列表应包含所有传入的任务"""
    tasks = _make_sample_tasks()
    monitor = TaskMonitor(tasks)

    result = monitor.get_task_list()

    assert len(result) == 4


def test_task_list_shows_task_id():
    """每个任务项应展示任务 ID"""
    tasks = [_make_task("task-abc")]
    monitor = TaskMonitor(tasks)

    result = monitor.get_task_list()

    assert result[0].task_id == "task-abc"


def test_task_type_maps_image_to_video():
    """image_to_video 模式展示为"图生视频" """
    tasks = [_make_task("task-001", mode="image_to_video")]
    monitor = TaskMonitor(tasks)

    result = monitor.get_task_list()

    assert result[0].task_type == "图生视频"


def test_task_type_maps_reference_video():
    """reference_video 模式展示为"原视频参考" """
    tasks = [_make_task("task-001", mode="reference_video")]
    monitor = TaskMonitor(tasks)

    result = monitor.get_task_list()

    assert result[0].task_type == "原视频参考"


def test_task_type_default_when_mode_is_none():
    """mode 为 None 时展示为"未知类型" """
    tasks = [_make_task("task-001", mode=None)]
    monitor = TaskMonitor(tasks)

    result = monitor.get_task_list()

    assert result[0].task_type == "未知类型"


def test_task_list_shows_status():
    """每个任务项应展示当前状态"""
    tasks = [
        _make_task("task-001", status="待剪辑"),
        _make_task("task-002", status="剪辑中"),
        _make_task("task-003", status="待发布"),
        _make_task("task-004", status="剪辑失败"),
    ]
    monitor = TaskMonitor(tasks)

    result = monitor.get_task_list()

    assert result[0].status == "待剪辑"
    assert result[1].status == "剪辑中"
    assert result[2].status == "待发布"
    assert result[3].status == "剪辑失败"


# ============================================================
# AC-2: 任务状态变更时界面自动刷新
# ============================================================

def test_refresh_updates_task_status():
    """refresh 方法应返回最新的任务状态"""
    tasks = [_make_task("task-001", status="待剪辑")]
    monitor = TaskMonitor(tasks)

    tasks[0].status = "剪辑中"

    result = monitor.refresh()

    assert result[0].status == "剪辑中"


def test_refresh_detects_new_completed_tasks():
    """refresh 能检测到新增的已完成任务"""
    tasks = [_make_task("task-001", status="剪辑中")]
    monitor = TaskMonitor(tasks)

    tasks[0].status = "待发布"

    result = monitor.refresh()

    assert result[0].status == "待发布"


def test_refresh_returns_all_tasks():
    """refresh 仍返回全部任务"""
    tasks = _make_sample_tasks()
    monitor = TaskMonitor(tasks)

    result = monitor.refresh()

    assert len(result) == 4


# ============================================================
# AC-3: 已完成任务的视频可预览播放
# ============================================================

def test_completed_task_can_set_video_preview():
    """已完成任务可设置视频预览路径"""
    tasks = [_make_task("task-001", status="待发布")]
    monitor = TaskMonitor(tasks)

    monitor.set_video_preview("task-001", "/output/task-001/final.mp4")

    result = monitor.get_task_list()
    assert result[0].video_preview_path == "/output/task-001/final.mp4"


def test_pending_task_has_no_video_preview_by_default():
    """未完成任务的 video_preview_path 默认为空"""
    tasks = [_make_task("task-001", status="待剪辑")]
    monitor = TaskMonitor(tasks)

    result = monitor.get_task_list()

    assert result[0].video_preview_path == ""


def test_processing_task_has_no_video_preview_by_default():
    """处理中任务的 video_preview_path 默认为空"""
    tasks = [_make_task("task-001", status="剪辑中")]
    monitor = TaskMonitor(tasks)

    result = monitor.get_task_list()

    assert result[0].video_preview_path == ""


def test_video_preview_persists_after_refresh():
    """设置视频预览后 refresh 仍保留预览路径"""
    tasks = [_make_task("task-001", status="待发布")]
    monitor = TaskMonitor(tasks)
    monitor.set_video_preview("task-001", "/output/task-001/final.mp4")

    tasks[0].status = "待发布"
    result = monitor.refresh()

    assert result[0].video_preview_path == "/output/task-001/final.mp4"


def test_set_video_preview_for_nonexistent_task_logs_error():
    """为不存在的任务设置视频预览应记录错误日志"""
    logger = MagicMock()
    tasks = [_make_task("task-001")]
    monitor = TaskMonitor(tasks, logger=logger)

    monitor.set_video_preview("task-999", "/some/path.mp4")

    logger.error.assert_called_once()
    assert "task-999" in logger.error.call_args[1]["message"]


# ============================================================
# AC-4: 任务失败时显示错误原因
# ============================================================

def test_failed_task_shows_error_message():
    """失败任务应展示错误原因"""
    tasks = [_make_task("task-001", status="剪辑失败")]
    monitor = TaskMonitor(tasks)

    monitor.update_error("task-001", "FFmpeg 执行超时")

    result = monitor.get_task_list()
    assert result[0].error_message == "FFmpeg 执行超时"


def test_non_failed_task_has_empty_error_by_default():
    """非失败任务的 error_message 默认为空"""
    tasks = [_make_task("task-001", status="剪辑中")]
    monitor = TaskMonitor(tasks)

    result = monitor.get_task_list()

    assert result[0].error_message == ""


def test_error_message_persists_after_refresh():
    """设置错误信息后 refresh 仍保留"""
    tasks = [_make_task("task-001", status="剪辑失败")]
    monitor = TaskMonitor(tasks)
    monitor.update_error("task-001", "转换失败")

    result = monitor.refresh()

    assert result[0].error_message == "转换失败"


def test_update_error_for_nonexistent_task_logs_error():
    """为不存在的任务更新错误信息应记录日志"""
    logger = MagicMock()
    tasks = [_make_task("task-001")]
    monitor = TaskMonitor(tasks, logger=logger)

    monitor.update_error("task-999", "错误")

    logger.error.assert_called_once()


# ============================================================
# AC-5: 处理中的任务显示当前执行步骤
# ============================================================

def test_processing_task_shows_current_step():
    """处理中任务应展示当前执行步骤"""
    tasks = [_make_task("task-001", status="剪辑中")]
    monitor = TaskMonitor(tasks)

    monitor.update_step("task-001", "正在执行视频剪辑...")

    result = monitor.get_task_list()
    assert result[0].current_step == "正在执行视频剪辑..."


def test_pending_task_has_empty_step_by_default():
    """待处理任务的 current_step 默认为空"""
    tasks = [_make_task("task-001", status="待剪辑")]
    monitor = TaskMonitor(tasks)

    result = monitor.get_task_list()

    assert result[0].current_step == ""


def test_step_persists_after_refresh():
    """设置步骤后 refresh 仍保留当前步骤"""
    tasks = [_make_task("task-001", status="剪辑中")]
    monitor = TaskMonitor(tasks)
    monitor.update_step("task-001", "正在执行文案生成...")

    result = monitor.refresh()

    assert result[0].current_step == "正在执行文案生成..."


def test_update_step_overwrites_previous():
    """多次更新步骤，最后一次为准"""
    tasks = [_make_task("task-001", status="剪辑中")]
    monitor = TaskMonitor(tasks)
    monitor.update_step("task-001", "步骤1")
    monitor.update_step("task-001", "步骤2")

    result = monitor.get_task_list()

    assert result[0].current_step == "步骤2"


def test_update_step_for_nonexistent_task_logs_error():
    """为不存在的任务更新步骤应记录错误日志"""
    logger = MagicMock()
    tasks = [_make_task("task-001")]
    monitor = TaskMonitor(tasks, logger=logger)

    monitor.update_step("task-999", "步骤")

    logger.error.assert_called_once()


def test_step_cleared_on_completed():
    """任务完成后步骤被清空"""
    tasks = [_make_task("task-001", status="剪辑中")]
    monitor = TaskMonitor(tasks)
    monitor.update_step("task-001", "剪辑中")

    tasks[0].status = "待发布"

    result = monitor.refresh()

    assert result[0].current_step == ""


# ============================================================
# AC-6: 界面布局清晰，信息层次分明（摘要统计）
# ============================================================

def test_get_summary_categorizes_by_status():
    """get_summary 按状态分类统计任务数量"""
    tasks = [
        _make_task("task-001", status="待剪辑"),
        _make_task("task-002", status="剪辑中"),
        _make_task("task-003", status="待发布"),
        _make_task("task-004", status="待剪辑"),
    ]
    monitor = TaskMonitor(tasks)

    summary = monitor.get_summary()

    assert summary["待剪辑"] == 2
    assert summary["剪辑中"] == 1
    assert summary["待发布"] == 1


def test_get_summary_includes_total():
    """get_summary 包含总任务数"""
    tasks = _make_sample_tasks()
    monitor = TaskMonitor(tasks)

    summary = monitor.get_summary()

    assert summary["total"] == 4


def test_get_summary_empty_tasks():
    """无任务时 summary 各项为 0"""
    monitor = TaskMonitor([])

    summary = monitor.get_summary()

    assert summary["total"] == 0


# ============================================================
# AC-7: 关键操作记录日志
# ============================================================

def test_logs_on_refresh():
    """refresh 操作记录 INFO 日志"""
    logger = MagicMock()
    tasks = [_make_task("task-001")]
    monitor = TaskMonitor(tasks, logger=logger)

    monitor.refresh()

    logger.info.assert_called()


def test_logs_on_error_update():
    """update_error 操作记录 ERROR 日志"""
    logger = MagicMock()
    tasks = [_make_task("task-001", status="剪辑失败")]
    monitor = TaskMonitor(tasks, logger=logger)

    monitor.update_error("task-001", "处理失败")

    logger.error.assert_called()
    assert "处理失败" in logger.error.call_args[1]["message"]


def test_logs_on_step_update():
    """update_step 操作记录 INFO 日志"""
    logger = MagicMock()
    tasks = [_make_task("task-001", status="剪辑中")]
    monitor = TaskMonitor(tasks, logger=logger)

    monitor.update_step("task-001", "剪辑中")

    logger.info.assert_called()


def test_logs_on_video_preview_set():
    """set_video_preview 操作记录 INFO 日志"""
    logger = MagicMock()
    tasks = [_make_task("task-001", status="待发布")]
    monitor = TaskMonitor(tasks, logger=logger)

    monitor.set_video_preview("task-001", "/path/to/video.mp4")

    logger.info.assert_called()


# ============================================================
# 边界条件
# ============================================================

def test_task_monitor_with_empty_tasks():
    """空任务列表不会出错"""
    monitor = TaskMonitor([])

    result = monitor.get_task_list()

    assert len(result) == 0


def test_refresh_with_empty_tasks():
    """空任务列表 refresh 不报错"""
    monitor = TaskMonitor([])

    result = monitor.refresh()

    assert len(result) == 0