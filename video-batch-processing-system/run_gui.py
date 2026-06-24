import argparse
import os
import sys
from pathlib import Path

import requests
from PySide6.QtWidgets import QApplication


def _get_app_dir():
    if getattr(sys, 'frozen', False):
        return Path(sys.executable).parent
    return Path(__file__).parent


sys.path.insert(0, str(_get_app_dir() / "src"))

from video_batch.auth import AuthClient
from video_batch.config_manager import ConfigManager
from video_batch.config_sync import ConfigSync
from video_batch.gui.app_config import AppConfig
from video_batch.gui.config_sync_worker import ConfigSyncWorker
from video_batch.gui.login_controller import LoginController
from video_batch.gui.main_window import MainWindow
from video_batch.gui.task_processor import TaskProcessorWorker
from video_batch.gui.user_panel_controller import UserPanelController
from video_batch.logger import Logger
from video_batch.task_status import TaskStatusManager
from video_batch.token_manager import TokenManager
from video_batch.token_store import TokenStore

DATA_DIR = _get_app_dir() / "_scratch"
CONFIG_DIR = DATA_DIR / "config"
LOG_DIR = DATA_DIR / "logs"
SCRATCH_DIR = DATA_DIR / "_pipeline_scratch"


def _create_token_refresh_func(auth_client: AuthClient):
    def refresh(refresh_token: str):
        return auth_client.refresh_session(refresh_token)
    return refresh


def main():
    parser = argparse.ArgumentParser(description="视频批量处理系统 GUI")
    parser.add_argument(
        "-d", "--debug",
        action="store_true",
        help="开启 debug 模式，日志同步输出到控制台",
    )
    args = parser.parse_args()

    app = QApplication(sys.argv)

    logger = Logger(LOG_DIR, debug=args.debug)

    app_config = AppConfig(CONFIG_DIR)
    app_config.load()

    http_session = requests.Session()
    auth_client = AuthClient(
        base_url=app_config.server_url,
        http_session=http_session,
        logger=logger,
    )

    token_store = TokenStore(CONFIG_DIR)
    token_manager = TokenManager(
        store=token_store,
        refresh_func=_create_token_refresh_func(auth_client),
        logger=logger,
        verify_on_check=True,
    )

    window = MainWindow()

    config_sync = ConfigSync(
        base_url=app_config.server_url,
        http_session=http_session,
        config_dir=CONFIG_DIR,
        logger=logger,
    )
    config_sync_worker = ConfigSyncWorker(config_sync)

    config_manager = ConfigManager(
        syncer=config_sync,
        config_dir=CONFIG_DIR,
        logger=logger,
    )

    task_worker = TaskProcessorWorker()

    status_manager = TaskStatusManager(
        base_url=app_config.server_url,
        http_session=http_session,
        logger=logger,
    )

    user_panel_controller = UserPanelController(
        window=window,
        auth_client=auth_client,
        access_token="",
        app_config=app_config,
        logger=logger,
        config_manager=config_manager,
        task_worker=task_worker,
        status_manager=status_manager,
        auto_refresh=False,
        scratch_dir=SCRATCH_DIR,
    )

    login_controller = LoginController(
        window=window,
        auth_client=auth_client,
        token_store=token_store,
        token_manager=token_manager,
        app_config=app_config,
        logger=logger,
        user_panel_controller=user_panel_controller,
        config_sync_worker=config_sync_worker,
    )

    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
