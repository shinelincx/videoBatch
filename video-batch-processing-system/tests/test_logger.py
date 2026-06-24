import re
from datetime import date, datetime
from unittest.mock import patch

from video_batch.logger import Logger


def test_logger_info_writes_formatted_message_to_file(tmp_path):
    """日志 INFO 级别输出到文件，格式正确"""
    log_dir = tmp_path / "logs"
    logger = Logger(log_dir)

    logger.info(task_id="task-001", module="剪辑", message="视频生成完成")

    log_file = log_dir / f"task_{date.today().strftime('%Y-%m-%d')}.log"
    assert log_file.exists()

    content = log_file.read_text(encoding="utf-8")
    pattern = r"^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] \[task-001\] \[剪辑\] \[INFO\] 视频生成完成$"
    assert re.search(pattern, content), f"日志格式不匹配:\n{content}"


def test_logger_error_writes_formatted_message_to_file(tmp_path):
    """日志 ERROR 级别输出到文件，格式正确"""
    log_dir = tmp_path / "logs"
    logger = Logger(log_dir)

    logger.error(task_id="task-002", module="重复检测", message="哈希计算失败")

    log_file = log_dir / f"task_{date.today().strftime('%Y-%m-%d')}.log"
    content = log_file.read_text(encoding="utf-8")
    pattern = r"^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] \[task-002\] \[重复检测\] \[ERROR\] 哈希计算失败$"
    assert re.search(pattern, content), f"日志格式不匹配:\n{content}"


def test_logger_rotates_file_by_date(tmp_path):
    """跨天写入产生独立的日志文件"""
    log_dir = tmp_path / "logs"
    logger = Logger(log_dir)

    with patch("video_batch.logger.datetime") as mock_dt:
        mock_dt.now.return_value = datetime(2026, 5, 18, 10, 0, 0)
        logger.info(task_id="task-001", module="剪辑", message="第一天日志")

    with patch("video_batch.logger.datetime") as mock_dt:
        mock_dt.now.return_value = datetime(2026, 5, 19, 10, 0, 0)
        logger.info(task_id="task-001", module="剪辑", message="第二天日志")

    day1_file = log_dir / "task_2026-05-18.log"
    day2_file = log_dir / "task_2026-05-19.log"
    assert day1_file.exists()
    assert day2_file.exists()
    assert "第一天日志" in day1_file.read_text(encoding="utf-8")
    assert "第二天日志" in day2_file.read_text(encoding="utf-8")