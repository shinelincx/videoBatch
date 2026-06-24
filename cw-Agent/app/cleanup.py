import os
import re
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

_TIMESTAMP_PATTERN = re.compile(r"(\d{8}_\d{6})")


def clean_old_outputs(output_dir: str, max_age_seconds: int = 86400):
    """清理 output 目录中超过 max_age_seconds 秒的旧文件

    从文件名中提取 YYYYMMDD_HHMMSS 时间戳判断文件年龄，删除超时文件。
    无法解析时间戳的文件，以文件修改时间为准。
    """
    if not os.path.isdir(output_dir):
        return

    now = datetime.now()
    cutoff_time = now - timedelta(seconds=max_age_seconds)
    deleted_count = 0

    try:
        entries = os.listdir(output_dir)
    except OSError:
        return

    for filename in entries:
        filepath = os.path.join(output_dir, filename)
        if not os.path.isfile(filepath):
            continue

        match = _TIMESTAMP_PATTERN.search(filename)
        if match:
            try:
                file_time = datetime.strptime(match.group(1), "%Y%m%d_%H%M%S")
            except ValueError:
                logger.debug("无法解析时间戳: %s", filename)
                file_time = None
        else:
            try:
                file_time = datetime.fromtimestamp(os.path.getmtime(filepath))
            except OSError:
                continue

        if file_time is not None and file_time < cutoff_time:
            try:
                os.remove(filepath)
                deleted_count += 1
            except OSError:
                logger.warning("删除文件失败: %s", filepath)

    if deleted_count > 0:
        logger.info("已清理 %d 个过期文件 (保留最近 %d 秒)", deleted_count, max_age_seconds)
