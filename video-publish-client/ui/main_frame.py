from __future__ import annotations

import threading
from typing import Callable

import wx

from api import ApiClient, ApiError, SessionExpired
from robot_heartbeat import (
    ROBOT_STATUS_OFFLINE,
    ROBOT_STATUS_PAUSED,
    ROBOT_STATUS_RUNNING,
    ROBOT_STATUS_STANDBY,
    RobotHeartbeat,
)
from services.daily_log import DailyLogStore
from services.publish_task_executor import PublishTaskExecutor
from services.publish_task_receiver import PublishTaskReceiver


class MainFrame(wx.Frame):
    def __init__(self, api: ApiClient, on_session_expired: Callable[[str], None]) -> None:
        super().__init__(None, title="视频发布客户端", size=(980, 680))
        self.api = api
        self.on_session_expired = on_session_expired
        self.robot_state_condition = threading.Condition()
        self.robot_stopped = False
        self.robot_status = ROBOT_STATUS_STANDBY
        self.robot_heartbeat: RobotHeartbeat | None = None
        self.log_store = DailyLogStore()
        self.publish_task_executor = PublishTaskExecutor(
            self.api,
            self._wait_for_robot_resume,
            lambda message: wx.CallAfter(self._append_log, message),
        )
        self.publish_task_receiver = PublishTaskReceiver(
            self.api,
            lambda task: wx.CallAfter(self.publish_task_executor.handle_task, task),
            self._should_hold_publish_tasks,
            lambda message: wx.CallAfter(self._session_expired, message),
            lambda message: wx.CallAfter(self._append_log, message),
        )
        self.publish_task_executor.set_requeue_handler(self.publish_task_receiver.requeue_if_holding)
        self._build_ui()
        self._start_session_timer()
        self._start_robot_heartbeat()
        self.publish_task_receiver.start()
        self.Center()

    def _build_ui(self) -> None:
        panel = wx.Panel(self)
        root = wx.BoxSizer(wx.VERTICAL)

        header = wx.BoxSizer(wx.HORIZONTAL)
        nick = self.api.session.user.get("nick") or self.api.session.user.get("name") or "用户"
        self.user_label = wx.StaticText(panel, label=f"当前用户：{nick}")
        header.Add(self.user_label, 0, wx.ALIGN_CENTER_VERTICAL)
        header.AddStretchSpacer()
        self.check_btn = wx.Button(panel, label="校验登录")
        self.logout_btn = wx.Button(panel, label="退出登录")
        header.Add(self.check_btn, 0, wx.LEFT, 8)
        header.Add(self.logout_btn, 0, wx.LEFT, 8)
        root.Add(header, 0, wx.EXPAND | wx.ALL, 14)

        root.Add(self._create_task_log_page(panel), 1, wx.EXPAND | wx.LEFT | wx.RIGHT | wx.BOTTOM, 14)

        panel.SetSizer(root)
        self.SetMinSize((720, 480))

        self.check_btn.Bind(wx.EVT_BUTTON, lambda _evt: self.validate_session(show_success=True))
        self.logout_btn.Bind(wx.EVT_BUTTON, self._on_logout)
        self.Bind(wx.EVT_CLOSE, self._on_close)

    def _create_task_log_page(self, parent: wx.Window) -> wx.Panel:
        panel = wx.Panel(parent)
        root = wx.BoxSizer(wx.VERTICAL)
        self.log = wx.TextCtrl(panel, style=wx.TE_MULTILINE | wx.TE_READONLY | wx.HSCROLL)
        today_log = self.log_store.read_today()
        if today_log:
            self.log.SetValue(today_log)
            self.log.SetInsertionPointEnd()
        root.Add(self.log, 1, wx.EXPAND | wx.ALL, 14)
        panel.SetSizer(root)
        return panel

    def _start_session_timer(self) -> None:
        self.timer = wx.Timer(self)
        self.Bind(wx.EVT_TIMER, lambda _evt: self.validate_session(show_success=False), self.timer)
        self.timer.Start(5 * 60 * 1000)

    def _start_robot_heartbeat(self) -> None:
        self.robot_heartbeat = RobotHeartbeat(
            self.api,
            self._robot_status,
            self._handle_robot_command,
            lambda message: wx.CallAfter(self._append_log, message),
        )
        self.robot_heartbeat.start()
        self._append_log(
            f"机器人已上线：{self.robot_heartbeat.identity.machine_name} / {self.robot_heartbeat.identity.mac_address}"
        )

    def _robot_status(self) -> str:
        return self.robot_status or ROBOT_STATUS_STANDBY

    def _handle_robot_command(self, command: str) -> None:
        command_text = {
            "start": "启动",
            "resume": "继续",
            "pause": "暂停",
            "stop": "停止",
        }.get(command, command)
        with self.robot_state_condition:
            if command in ("start", "resume"):
                self.robot_status = ROBOT_STATUS_RUNNING
                self.robot_stopped = False
                self.robot_state_condition.notify_all()
            elif command == "pause":
                self.robot_status = ROBOT_STATUS_PAUSED
                self.robot_state_condition.notify_all()
            elif command == "stop":
                self.robot_status = ROBOT_STATUS_STANDBY
                self.robot_stopped = True
                self.robot_state_condition.notify_all()
            else:
                wx.CallAfter(self._append_log, f"收到未知机器人指令：{command}")
                return
        wx.CallAfter(self._append_log, f"收到后台机器人指令：{command_text}")

    def _stop_robot_heartbeat(self, send_offline: bool = False) -> None:
        if self.robot_heartbeat:
            if send_offline:
                with self.robot_state_condition:
                    self.robot_status = ROBOT_STATUS_OFFLINE
                    self.robot_state_condition.notify_all()
            self.robot_heartbeat.stop(send_offline=send_offline)
            self.robot_heartbeat = None

    def validate_session(self, show_success: bool = False) -> None:
        def worker() -> None:
            try:
                self.api.validate_session()
            except SessionExpired as exc:
                wx.CallAfter(self._session_expired, str(exc))
            except ApiError as exc:
                wx.CallAfter(self._append_log, f"登录校验失败：{exc}")
            else:
                if show_success:
                    wx.CallAfter(self._append_log, "登录状态有效")

        threading.Thread(target=worker, daemon=True).start()

    def _on_logout(self, _event: wx.Event) -> None:
        def worker() -> None:
            self._stop_robot_heartbeat(send_offline=True)
            try:
                self.api.logout()
            except ApiError:
                pass
            wx.CallAfter(self._session_expired, "已退出登录")

        threading.Thread(target=worker, daemon=True).start()

    def _on_close(self, event: wx.CloseEvent) -> None:
        self.publish_task_receiver.stop()
        if hasattr(self, "timer"):
            self.timer.Stop()
        self._stop_robot_heartbeat(send_offline=True)
        event.Skip()

    def _should_hold_publish_tasks(self) -> bool:
        with self.robot_state_condition:
            return self.robot_status == ROBOT_STATUS_PAUSED or self.robot_stopped

    def _wait_for_robot_resume(self, nickname: str) -> None:
        paused_logged = False
        with self.robot_state_condition:
            while self.robot_status == ROBOT_STATUS_PAUSED and not self.robot_stopped:
                if not paused_logged:
                    paused_logged = True
                    wx.CallAfter(self._append_log, f"{nickname}：任务已暂停，等待继续")
                self.robot_state_condition.wait(timeout=1)
            if self.robot_stopped:
                raise ApiError("任务已停止")
        if paused_logged:
            wx.CallAfter(self._append_log, f"{nickname}：任务继续执行")

    def _append_log(self, message: str) -> None:
        text = self.log_store.append(message)
        if hasattr(self, "log"):
            self.log.AppendText(text + "\n")

    def _session_expired(self, message: str) -> None:
        if hasattr(self, "timer"):
            self.timer.Stop()
        if hasattr(self, "publish_task_receiver"):
            self.publish_task_receiver.stop()
        self._stop_robot_heartbeat(send_offline=False)
        self.Hide()
        self.on_session_expired(message)
