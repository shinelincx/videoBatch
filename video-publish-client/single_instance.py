from __future__ import annotations

import sys
from pathlib import Path

from config import get_app_data_dir


class SingleInstanceLock:
    def __init__(self, name: str = "video-publish-client") -> None:
        self.path: Path = get_app_data_dir() / f"{name}.lock"
        self._file = None

    def acquire(self) -> bool:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._file = self.path.open("a+")
        try:
            if sys.platform == "win32":
                import msvcrt

                self._file.seek(0)
                msvcrt.locking(self._file.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl

                fcntl.flock(self._file.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError:
            self._file.close()
            self._file = None
            return False
        self._file.seek(0)
        self._file.truncate()
        self._file.write(str(self.path))
        self._file.flush()
        return True

    def release(self) -> None:
        if not self._file:
            return
        try:
            if sys.platform == "win32":
                import msvcrt

                self._file.seek(0)
                msvcrt.locking(self._file.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                import fcntl

                fcntl.flock(self._file.fileno(), fcntl.LOCK_UN)
        except OSError:
            pass
        finally:
            self._file.close()
            self._file = None
