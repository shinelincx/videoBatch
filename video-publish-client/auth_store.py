from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

from config import DEFAULT_API_BASE_URL, get_app_data_dir


@dataclass
class StoredSession:
    api_base_url: str = DEFAULT_API_BASE_URL
    token: str = ""
    user: dict[str, Any] = field(default_factory=dict)

    @property
    def is_authenticated(self) -> bool:
        return bool(self.token and self.user)


class AuthStore:
    def __init__(self, data_dir: Path | None = None) -> None:
        self.data_dir = data_dir or get_app_data_dir()
        self.session_file = self.data_dir / "session.json"
        self.cookie_file = self.data_dir / "cookies.txt"

    def load(self) -> StoredSession:
        if not self.session_file.exists():
            return StoredSession()
        try:
            raw = json.loads(self.session_file.read_text(encoding="utf-8"))
            return StoredSession(
                api_base_url=raw.get("api_base_url") or DEFAULT_API_BASE_URL,
                token=raw.get("token") or "",
                user=raw.get("user") or {},
            )
        except (OSError, json.JSONDecodeError):
            return StoredSession()

    def save(self, session: StoredSession) -> None:
        self.session_file.write_text(
            json.dumps(asdict(session), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def clear(self) -> None:
        for path in (self.session_file, self.cookie_file):
            try:
                if path.exists():
                    path.unlink()
            except OSError:
                pass
