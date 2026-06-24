from __future__ import annotations

import os
import sys
from dataclasses import dataclass
from pathlib import Path


APP_NAME = "video-publish-client"
DEFAULT_API_BASE_URL = "http://127.0.0.1:8080"


def get_app_data_dir() -> Path:
    if sys.platform == "win32":
        root = os.environ.get("APPDATA") or str(Path.home() / "AppData" / "Roaming")
        path = Path(root) / APP_NAME
    elif sys.platform == "darwin":
        path = Path.home() / "Library" / "Application Support" / APP_NAME
    else:
        root = os.environ.get("XDG_CONFIG_HOME") or str(Path.home() / ".config")
        path = Path(root) / APP_NAME
    path.mkdir(parents=True, exist_ok=True)
    return path


@dataclass
class AppSettings:
    api_base_url: str = DEFAULT_API_BASE_URL

    def normalized_base_url(self) -> str:
        return self.api_base_url.rstrip("/")
