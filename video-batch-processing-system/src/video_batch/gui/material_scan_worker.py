import hashlib
import secrets
import time
from pathlib import Path
from urllib.parse import urlparse

from PySide6.QtCore import QObject, Signal

from video_batch.material_scanner import MaterialScanResult, MaterialScanService
from video_batch.metadata_config import MetadataConfig

_SIGN_KEY = "s.0wl?.i_s43$i1_"


def _make_signed_headers(request_path: str) -> dict[str, str]:
    ts = str(int(time.time() * 1000))
    nonce = secrets.token_hex(12)
    parsed = urlparse(request_path)
    uri = parsed.path or "/"
    if uri.startswith("/api/"):
        uri = uri[4:]
    params = {"timestamp": ts, "nonceStr": nonce, "uri": uri}
    sign_str = "&".join(f"{k}={params[k]}" for k in sorted(params))
    signature = hashlib.md5(f"{sign_str}&key={_SIGN_KEY}".encode()).hexdigest()
    return {
        "signature": signature.lower(),
        "timestamp": ts,
        "nonceStr": nonce,
        "uri": uri,
    }


class MaterialScanWorker(QObject):
    """GUI 层素材扫描触发器，封装扫描操作为 Qt 信号驱动。

    信号:
        scan_completed(MaterialScanResult): 扫描成功
        scan_failed(str, str): 扫描失败 (task_id, 错误信息)
    """

    scan_completed = Signal(MaterialScanResult)
    scan_failed = Signal(str, str)

    def __init__(
        self,
        base_url: str,
        http_session,
        assets_dir: Path,
        parent: QObject | None = None,
    ) -> None:
        super().__init__(parent)
        self._base_url = base_url
        self._http = http_session
        self._assets_dir = Path(assets_dir)

    def scan(
        self,
        task_id: str,
        metadata: MetadataConfig,
        access_token: str = "",
    ) -> None:
        base_url = self._base_url
        http = self._http

        def report_status(tid: str, status: str) -> None:
            try:
                path = f"/api/tasks/{tid}/status"
                url = f"{base_url.rstrip('/')}{path}"
                headers = _make_signed_headers(path)
                headers["Authorization"] = f"Bearer {access_token}"
                headers["Content-Type"] = "application/json"
                http.put(url, headers=headers, json={"status": status})
            except Exception:
                pass

        scanner = MaterialScanService(
            assets_dir=self._assets_dir,
            metadata=metadata,
            status_reporter=report_status,
        )
        result = scanner.scan(task_id)
        self.scan_completed.emit(result)
