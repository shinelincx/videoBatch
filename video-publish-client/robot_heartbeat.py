from __future__ import annotations

import platform
import threading
import uuid
from dataclasses import dataclass
from typing import Callable

from api import ApiClient, ApiError, SessionExpired


ROBOT_STATUS_OFFLINE = "离线"
ROBOT_STATUS_STANDBY = "待机"
ROBOT_STATUS_RUNNING = "运行中"
ROBOT_STATUS_PAUSED = "暂停中"


@dataclass(frozen=True)
class RobotIdentity:
    machine_name: str
    mac_address: str


def current_robot_identity() -> RobotIdentity:
    machine_name = platform.node().strip() or "unknown-machine"
    mac = uuid.getnode()
    mac_address = ":".join(f"{(mac >> shift) & 0xff:02x}" for shift in range(40, -1, -8))
    return RobotIdentity(machine_name=machine_name, mac_address=mac_address)


class RobotHeartbeat:
    def __init__(
        self,
        api: ApiClient,
        status_provider: Callable[[], str],
        command_handler: Callable[[str], None],
        error_handler: Callable[[str], None],
        interval_seconds: int = 5,
    ) -> None:
        self.api = api
        self.identity = current_robot_identity()
        self.status_provider = status_provider
        self.command_handler = command_handler
        self.error_handler = error_handler
        self.interval_seconds = interval_seconds
        self._stop_event = threading.Event()
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self, send_offline: bool = False) -> None:
        self._stop_event.set()
        if send_offline:
            threading.Thread(target=self._send_offline, daemon=True).start()

    def _run(self) -> None:
        while not self._stop_event.is_set():
            try:
                command = self._poll_command()
                if command:
                    self.command_handler(command)
                self._send_heartbeat(self.status_provider())
            except SessionExpired:
                return
            except ApiError as exc:
                self.error_handler(f"机器人心跳失败：{exc}")
            self._stop_event.wait(self.interval_seconds)

    def _send_heartbeat(self, status: str) -> None:
        self.api.sync_robot_heartbeat({
            "machineName": self.identity.machine_name,
            "macAddress": self.identity.mac_address,
            "status": status or ROBOT_STATUS_STANDBY,
        })

    def _poll_command(self) -> str:
        command = self.api.poll_robot_command({
            "machineName": self.identity.machine_name,
            "macAddress": self.identity.mac_address,
        }).get("command")
        return str(command or "")

    def _send_offline(self) -> None:
        try:
            self._send_heartbeat(ROBOT_STATUS_OFFLINE)
        except (ApiError, SessionExpired):
            pass
