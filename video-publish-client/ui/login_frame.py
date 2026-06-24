from __future__ import annotations

import threading
from typing import Callable

import wx

from api import ApiClient, ApiError


class LoginFrame(wx.Frame):
    def __init__(self, api: ApiClient, on_login_success: Callable[[], None]) -> None:
        super().__init__(None, title="视频发布客户端 - 登录", size=(430, 360))
        self.api = api
        self.on_login_success = on_login_success
        self._build_ui()
        self.Center()

    def _build_ui(self) -> None:
        panel = wx.Panel(self)
        root = wx.BoxSizer(wx.VERTICAL)

        title = wx.StaticText(panel, label="视频发布客户端")
        title_font = title.GetFont()
        title_font.SetPointSize(18)
        title_font.SetWeight(wx.FONTWEIGHT_BOLD)
        title.SetFont(title_font)
        root.Add(title, 0, wx.ALIGN_CENTER | wx.TOP, 28)

        subtitle = wx.StaticText(panel, label="登录后执行自动化、下载与剪辑任务")
        root.Add(subtitle, 0, wx.ALIGN_CENTER | wx.TOP | wx.BOTTOM, 8)

        form = wx.FlexGridSizer(rows=3, cols=2, vgap=12, hgap=10)
        form.AddGrowableCol(1, 1)

        self.username = wx.TextCtrl(panel, value="admin")
        self.password = wx.TextCtrl(panel, value="123456", style=wx.TE_PASSWORD | wx.TE_PROCESS_ENTER)

        form.Add(wx.StaticText(panel, label="用户名"), 0, wx.ALIGN_CENTER_VERTICAL)
        form.Add(self.username, 1, wx.EXPAND)
        form.Add(wx.StaticText(panel, label="密码"), 0, wx.ALIGN_CENTER_VERTICAL)
        form.Add(self.password, 1, wx.EXPAND)

        self.status = wx.StaticText(panel, label="")
        form.Add(wx.StaticText(panel, label=""))
        form.Add(self.status, 1, wx.EXPAND)

        root.Add(form, 0, wx.EXPAND | wx.LEFT | wx.RIGHT | wx.TOP, 34)

        self.login_btn = wx.Button(panel, label="登录")
        self.login_btn.SetMinSize((-1, 38))
        root.Add(self.login_btn, 0, wx.EXPAND | wx.LEFT | wx.RIGHT | wx.TOP, 34)

        panel.SetSizer(root)
        self.SetMinSize((430, 360))

        self.login_btn.Bind(wx.EVT_BUTTON, self._on_login)
        self.password.Bind(wx.EVT_TEXT_ENTER, self._on_login)

    def _on_login(self, _event: wx.Event) -> None:
        username = self.username.GetValue().strip()
        password = self.password.GetValue()
        if not username or not password:
            wx.MessageBox("请输入用户名和密码", "提示", wx.OK | wx.ICON_INFORMATION, self)
            return

        self._set_busy(True, "正在登录...")

        def worker() -> None:
            try:
                self.api.login(self.api.session.api_base_url, username, password)
            except ApiError as exc:
                wx.CallAfter(self._login_failed, str(exc))
            else:
                wx.CallAfter(self._login_succeeded)

        threading.Thread(target=worker, daemon=True).start()

    def _set_busy(self, busy: bool, message: str = "") -> None:
        self.login_btn.Enable(not busy)
        self.username.Enable(not busy)
        self.password.Enable(not busy)
        self.status.SetLabel(message)

    def _login_failed(self, message: str) -> None:
        self._set_busy(False, message)
        wx.MessageBox(message, "登录失败", wx.OK | wx.ICON_ERROR, self)

    def _login_succeeded(self) -> None:
        self._set_busy(False, "登录成功")
        self.on_login_success()
