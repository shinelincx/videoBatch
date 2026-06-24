"""
清理模块 - 临时文件清理

提供清理过期临时文件的功能，根据文件修改时间判断是否超过保留期限。
"""

import time
from pathlib import Path


def cleanup_temp(temp_dir: Path, max_age_hours: int = 24) -> int:
    """
    清理指定目录下超过保留期限的临时文件

    遍历 temp_dir 下的所有文件，检查每个文件的修改时间，
    删除超过 max_age_hours 小时的文件。

    参数:
        temp_dir: 临时文件目录路径
        max_age_hours: 文件最大保留时长（小时），默认 24 小时

    返回:
        被删除的文件数量
    """
    temp_dir = Path(temp_dir)
    now = time.time()
    # 将保留时长转换为秒
    max_age_seconds = max_age_hours * 3600
    deleted_count = 0

    # 目录不存在时无需清理
    if not temp_dir.exists():
        return 0

    # 遍历目录下所有文件
    for item in temp_dir.iterdir():
        if item.is_file():
            # 获取文件最后修改时间
            mtime = item.stat().st_mtime
            # 判断是否超过保留期限
            if now - mtime > max_age_seconds:
                item.unlink()  # 删除文件
                deleted_count += 1

    return deleted_count
