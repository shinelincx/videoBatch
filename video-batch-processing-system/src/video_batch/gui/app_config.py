import json
from pathlib import Path


class AppConfig:
    """应用配置管理，处理非敏感的用户偏好设置。

    存储内容包括:
      - 服务端地址
      - 记住用户名开关及已保存的用户名
    注意: 密码和 Token 不在此处存储，Token 由 TokenStore 加密存储。
    """

    CONFIG_FILENAME = "app_config.json"

    def __init__(self, config_dir: Path) -> None:
        self._config_dir = Path(config_dir)
        self._config_dir.mkdir(parents=True, exist_ok=True)
        self.server_url = "http://47.113.125.61:8180/"
        self.remember_username = False
        self.saved_username = ""
        self.material_dir = ""

    def save(self) -> None:
        """保存配置到 JSON 文件。"""
        data = {
            "server_url": self.server_url,
            "remember_username": self.remember_username,
            "saved_username": self.saved_username,
        }
        if self.material_dir:
            data["material_dir"] = self.material_dir
        config_path = self._config_dir / self.CONFIG_FILENAME
        config_path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def load(self) -> None:
        """从 JSON 文件加载配置，文件不存在时保持默认值。"""
        config_path = self._config_dir / self.CONFIG_FILENAME
        if not config_path.exists():
            return
        data = json.loads(config_path.read_text(encoding="utf-8"))
        self.server_url = data.get("server_url", self.server_url)
        self.remember_username = data.get("remember_username", self.remember_username)
        self.saved_username = data.get("saved_username", self.saved_username)
        self.material_dir = data.get("material_dir", self.material_dir)
