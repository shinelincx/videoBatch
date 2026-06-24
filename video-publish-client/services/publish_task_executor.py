from __future__ import annotations

import threading
from typing import Any, Callable

from api import ApiClient, ApiError


PublishTask = dict[str, Any]


class PublishTaskExecutor:
    def __init__(
        self,
        api: ApiClient,
        wait_for_resume: Callable[[str], None],
        log_handler: Callable[[str], None],
    ) -> None:
        self.api = api
        self.wait_for_resume = wait_for_resume
        self.log = log_handler
        self.requeue_if_holding: Callable[[PublishTask], bool] | None = None
        self.selection_running_accounts: set[str] = set()

    def set_requeue_handler(self, requeue_if_holding: Callable[[PublishTask], bool]) -> None:
        self.requeue_if_holding = requeue_if_holding

    def handle_task(self, task: PublishTask) -> None:
        task_type = str(task.get("type") or "")
        if task_type != "startSelection":
            return
        if self.requeue_if_holding and self.requeue_if_holding(task):
            self.log("机器人未运行，选品任务已暂存")
            return
        account_id = str(task.get("accountId") or "")
        if not account_id:
            self.log("选品任务缺少账号ID，已忽略")
            return
        if account_id in self.selection_running_accounts:
            self.log(f"账号 {account_id}：选品任务正在运行，已忽略重复任务")
            return
        self.selection_running_accounts.add(account_id)
        threading.Thread(target=self._run_selection_task, args=(task,), daemon=True).start()

    def _run_selection_task(self, task: PublishTask) -> None:
        account_id = str(task.get("accountId") or "")
        account = task.get("account") if isinstance(task.get("account"), dict) else None
        nickname = str((account or {}).get("displayNickname") or (account or {}).get("nickname") or account_id)
        config = task.get("config") if isinstance(task.get("config"), dict) else {}
        strategy = task.get("selectionStrategy") if isinstance(task.get("selectionStrategy"), dict) else {}
        today_count = task.get("todaySelectionCount")
        try:
            if not account:
                raise ApiError(f"未找到账号 {account_id}")
            config_name = self._display_value(config, "name", "config_name", "publish_config_name") or "-"
            strategy_name = self._display_value(strategy, "name", "strategy_name", "selection_strategy_name") or "-"
            self.log(f"{nickname}：开始选品任务（配置：{config_name}，策略：{strategy_name}，今日选品数：{today_count}）")
            self.wait_for_resume(nickname)
            filter_text = self._selection_filter_text(strategy.get("filters"))
            self.log(f"{nickname}：选品筛选条件：{filter_text}")
            self.log(f"{nickname}：浏览器自动化功能已移除，未执行自动选品")
        except ApiError as exc:
            self.log(f"{nickname}：选品任务失败：{exc}")
        finally:
            self.selection_running_accounts.discard(account_id)

    def _selection_filter_text(self, filters: object) -> str:
        if not isinstance(filters, list) or not filters:
            return "无"
        parts: list[str] = []
        for item in filters:
            if not isinstance(item, dict):
                continue
            label = str(item.get("label") or item.get("key") or "")
            value = str(item.get("value") or "")
            min_value = str(item.get("min") or "")
            max_value = str(item.get("max") or "")
            suffix = str(item.get("suffix") or "")
            if value:
                parts.append(f"{label}={value}")
            elif min_value or max_value:
                parts.append(f"{label}={min_value or '-'}~{max_value or '-'}{suffix}")
        return "，".join(parts) if parts else "无"

    def _display_value(self, data: dict[str, Any], *keys: str) -> str:
        for key in keys:
            value = data.get(key)
            if value is not None and str(value).strip():
                return str(value).strip()
        return ""
