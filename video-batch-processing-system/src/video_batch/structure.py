"""
项目结构模块 - 目录结构初始化

负责创建视频批量处理系统所需的标准项目目录结构。
"""

from pathlib import Path

# 标准项目目录列表
DIRS = [
    "assets",         # 素材目录
    "config",         # 配置文件目录
    "hashes",         # 哈希数据目录
    "temp/audio",     # 临时音频目录
    "logs",           # 日志目录
]


def setup_project_structure(base_path: Path) -> None:
    """
    在指定路径下创建标准项目目录结构

    遍历 DIRS 列表中定义的所有目录，递归创建目录结构。
    已存在的目录不会报错。

    参数:
        base_path: 项目根目录路径
    """
    base = Path(base_path)
    for dir_path in DIRS:
        (base / dir_path).mkdir(parents=True, exist_ok=True)
