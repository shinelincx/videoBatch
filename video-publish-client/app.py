from __future__ import annotations

import threading

import wx

from api import ApiClient, ApiError, SessionExpired
from auth_store import AuthStore
from single_instance import SingleInstanceLock
from ui.login_frame import LoginFrame
from ui.main_frame import MainFrame


class VideoPublishClientApp(wx.App):
    def OnInit(self) -> bool:
        self.store = AuthStore()
        self.api = ApiClient(self.store)
        self.login_frame: LoginFrame | None = None
        self.main_frame: MainFrame | None = None

        if self.api.session.is_authenticated:
            self._validate_saved_session()
        else:
            self.show_login()
        return True

    def show_login(self) -> None:
        if self.main_frame:
            self.main_frame.Destroy()
            self.main_frame = None
        if self.login_frame:
            self.login_frame.Destroy()
        self.login_frame = LoginFrame(self.api, self.show_main)
        self.login_frame.Show()

    def show_main(self) -> None:
        if self.login_frame:
            self.login_frame.Destroy()
            self.login_frame = None
        if self.main_frame:
            self.main_frame.Destroy()
        self.main_frame = MainFrame(self.api, self.handle_session_expired)
        self.main_frame.Show()

    def handle_session_expired(self, message: str) -> None:
        self.store.clear()
        wx.MessageBox(message or "登录已失效，请重新登录", "提示", wx.OK | wx.ICON_INFORMATION)
        self.show_login()

    def _validate_saved_session(self) -> None:
        splash = wx.Frame(None, title="视频发布客户端", size=(360, 120))
        panel = wx.Panel(splash)
        sizer = wx.BoxSizer(wx.VERTICAL)
        sizer.Add(wx.StaticText(panel, label="正在校验登录状态..."), 0, wx.ALIGN_CENTER | wx.ALL, 28)
        panel.SetSizer(sizer)
        splash.Center()
        splash.Show()

        def worker() -> None:
            try:
                self.api.validate_session()
            except (SessionExpired, ApiError):
                wx.CallAfter(self._saved_session_invalid, splash)
            else:
                wx.CallAfter(self._saved_session_valid, splash)

        threading.Thread(target=worker, daemon=True).start()

    def _saved_session_valid(self, splash: wx.Frame) -> None:
        splash.Destroy()
        self.show_main()

    def _saved_session_invalid(self, splash: wx.Frame) -> None:
        splash.Destroy()
        self.store.clear()
        self.show_login()


def main() -> None:
    instance_lock = SingleInstanceLock()
    if not instance_lock.acquire():
        app = wx.App(False)
        wx.MessageBox("当前电脑已启动一个客户端，请先关闭已有窗口", "提示", wx.OK | wx.ICON_INFORMATION)
        return

    try:
        app = VideoPublishClientApp(False)
        app.MainLoop()
    finally:
        instance_lock.release()
