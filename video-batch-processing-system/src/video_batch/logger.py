"""
日志模块 - 任务日志记录器

提供按日期分割的文件日志记录功能，支持不同级别的日志输出，
每条日志包含时间戳、任务 ID、模块名称和日志级别。
支持 debug 模式，开启后将日志同步输出到控制台。
"""

import sys
from datetime import datetime
from pathlib import Path


class Logger:
    """
    文件日志记录器

    将日志按日期写入指定目录的日志文件中，每条日志包含
    时间戳、任务 ID、模块名称和日志级别等结构化信息。

    开启 debug 模式后，所有日志会同时输出到控制台（stdout）。
    """

    _LEVEL_COLORS = {
        "DEBUG": "\033[36m",
        "INFO": "\033[32m",
        "WARNING": "\033[33m",
        "ERROR": "\033[31m",
    }
    _RESET = "\033[0m"

    def __init__(self, log_dir: Path, debug: bool = False) -> None:
        """
        初始化日志记录器

        参数:
            log_dir: 日志文件存储目录
            debug: 是否开启 debug 模式（同时输出到控制台）
        """
        self._log_dir = Path(log_dir)
        self._log_dir.mkdir(parents=True, exist_ok=True)
        self._debug = debug

    @property
    def debug_enabled(self) -> bool:
        return self._debug

    def debug(self, task_id: str, module: str, message: str) -> None:
        """记录 DEBUG 级别日志"""
        self._write("DEBUG", task_id, module, message)

    def info(self, task_id: str, module: str, message: str) -> None:
        """记录 INFO 级别日志"""
        self._write("INFO", task_id, module, message)

    def warning(self, task_id: str, module: str, message: str) -> None:
        """记录 WARNING 级别日志"""
        self._write("WARNING", task_id, module, message)

    def error(self, task_id: str, module: str, message: str) -> None:
        """记录 ERROR 级别日志"""
        self._write("ERROR", task_id, module, message)

    def _write(self, level: str, task_id: str, module: str, message: str) -> None:
        """
        将日志写入文件

        日志文件名格式为 task_YYYY-MM-DD.log，按日期自动分割。
        debug 模式下同步输出到控制台。

        参数:
            level: 日志级别（DEBUG/INFO/WARNING/ERROR）
            task_id: 任务唯一标识
            module: 模块名称
            message: 日志消息内容
        """
        now = datetime.now()
        timestamp = now.strftime("%Y-%m-%d %H:%M:%S")
        date_str = now.strftime("%Y-%m-%d")
        line = f"[{timestamp}] [{task_id}] [{module}] [{level}] {message}\n"

        log_file = self._log_dir / f"task_{date_str}.log"
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(line)

        if self._debug:
            color = self._LEVEL_COLORS.get(level, "")
            console_line = f"{color}[{timestamp}] [{level}] [{module}] {message}{self._RESET}"
            print(console_line, file=sys.stdout, flush=True)
