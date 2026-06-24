from __future__ import annotations

import threading
from datetime import datetime
from pathlib import Path
from typing import Callable

from config import get_app_data_dir


class DailyLogStore:
    def __init__(
        self,
        log_dir: Path | None = None,
        clock: Callable[[], datetime] | None = None,
    ) -> None:
        self.log_dir = log_dir or get_app_data_dir() / "logs"
        self.clock = clock or datetime.now
        self._lock = threading.Lock()
        self.log_dir.mkdir(parents=True, exist_ok=True)

    def append(self, message: str) -> str:
        now = self.clock()
        lines = []
        for raw_line in str(message).splitlines() or [""]:
            lines.append(f"[{now:%H:%M:%S}] {raw_line}")
        text = "\n".join(lines)
        with self._lock:
            with self._path_for(now).open("a", encoding="utf-8") as file:
                file.write(text + "\n")
        return text

    def read_today(self) -> str:
        path = self._path_for(self.clock())
        try:
            with self._lock:
                return path.read_text(encoding="utf-8")
        except OSError:
            return ""

    def _path_for(self, value: datetime) -> Path:
        return self.log_dir / f"{value:%Y-%m-%d}.log"
