"""
环境检测模块 - 依赖环境检查

负责检查系统是否安装了运行所需的外部依赖工具（如 FFmpeg）。
"""

import os
import sys
import subprocess


def _run_no_window(cmd: list[str], **kwargs):
    """调用外部命令，在 Windows 上隐藏控制台窗口。

    PyInstaller 打包后的 exe 调用 ffmpeg/ffprobe 时，
    如果不设置 CREATE_NO_WINDOW，每次都会弹出命令行窗口。
    """
    if sys.platform == "win32":
        kwargs.setdefault("creationflags", subprocess.CREATE_NO_WINDOW)
    return subprocess.run(cmd, **kwargs)


def ffmpeg_path() -> str:
    """返回 ffmpeg 可执行文件的路径。

    PyInstaller 打包时使用 bundled 版本，开发时使用系统 PATH 中的版本。
    """
    if getattr(sys, 'frozen', False):
        bundled = os.path.join(sys._MEIPASS, 'ffmpeg.exe')
        if os.path.isfile(bundled):
            return bundled
    return 'ffmpeg'


def check_ffmpeg() -> bool:
    """
    检查系统中是否安装了 FFmpeg

    通过执行 ffmpeg -version 命令来检测 FFmpeg 是否可用。

    返回:
        FFmpeg 可用返回 True，否则返回 False
    """
    try:
        result = _run_no_window(
            [ffmpeg_path(), "-version"],
            capture_output=True,
            timeout=10,  # 超时时间 10 秒
        )
        return result.returncode == 0
    except FileNotFoundError:
        # 系统未找到 ffmpeg 命令
        return False
