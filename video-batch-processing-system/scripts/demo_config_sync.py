"""演示 ConfigSync + ConfigManager 的完整流程（服务端开关 + 本地参数分离）。"""

import json
from pathlib import Path
from unittest.mock import MagicMock

from video_batch.config_manager import ConfigManager
from video_batch.config_sync import ConfigSync
from video_batch.local_config import LocalConfig
from video_batch.logger import Logger

# ============================================================
# 模拟服务端 /clip_config/config_map 接口返回（纯开关，无参数）
# ============================================================

MOCK_SERVER_API_RESPONSE = {
    "version": 5,
    "clip_mode": {"mode": "image-to-video"},
    "video_items": {
        "frame_extraction": True,
        "cropping": True,
        "blur": False,
        "shake": True,
        "watermark": True,
    },
    "text_items": {"subtitles": True, "danmaku": False},
    "affix": {"prepend_enabled": True, "append_enabled": False},
    "audio": {
        "background_music_enabled": True,
        "speed_adjustment_enabled": False,
    },
    "repetition": {"loop_count": 3},
}

# ============================================================
# 演示脚本
# ============================================================


def main():
    config_dir = Path("_demo_scratch/config")
    config_dir.mkdir(parents=True, exist_ok=True)

    logger = Logger(name="demo_config_sync", log_dir=config_dir)

    # 1. 保存演示用 LocalConfig（客户端参数）
    demo_local = LocalConfig()
    demo_local.save(config_dir / "local_config.json")
    print("[LOCAL] 已保存演示用 LocalConfig")

    # 2. 模拟 HTTP 接口，服务端仅返回开关
    mock_http = MagicMock()
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = MOCK_SERVER_API_RESPONSE
    mock_http.get.return_value = mock_response

    # 3. 初始化 ConfigManager（合并 ServerConfig + LocalConfig）
    syncer = ConfigSync(
        base_url="http://api.example.com",
        http_session=mock_http,
        config_dir=config_dir,
        logger=logger,
    )
    mgr = ConfigManager(syncer=syncer, config_dir=config_dir, logger=logger)

    # 4. 同步服务端配置
    server_config = mgr.sync(access_token="demo-token")

    # 5. 加载本地配置
    local_config = mgr.load_local_config()

    # 6. 打印结果
    print()
    print("=== 服务端配置（开关）===")
    server = server_config.to_dict()
    print(json.dumps(server, ensure_ascii=False, indent=2))

    print()
    print("=== 客户端本地配置（参数）===")
    local = local_config.to_dict()
    print(json.dumps(local, ensure_ascii=False, indent=2))

    print()
    print("✅ 配置同步成功！")
    print(f"   版本: {server_config.version}")
    print(f"   模式: {server_config.clip_mode.mode}")
    print(f"   抽帧: {server_config.video_items.frame_extraction}")
    print(f"   弹幕: {server_config.text_items.danmaku}")
    print(f"   循环: {server_config.repetition.loop_count}")
    print()
    print("💡 修改 MOCK_SERVER_API_RESPONSE 可模拟不同服务端配置。")


if __name__ == "__main__":
    main()