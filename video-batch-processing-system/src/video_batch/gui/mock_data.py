"""模拟数据模块 — 当服务端无数据时提供演示任务和配置。"""

# 模拟任务列表：参考生视频 + 图生视频
MOCK_TASKS = [
    {
        "id": "3633867863993022100",
        "material_id": "3633867863993022100",
        "status": "待剪辑",
        "config_id": "cfg-ref-v3",
        "mode": "reference-video",
        "created_at": "2026-05-20T10:00:00"
    },
    {
        "id": "3741887959243293126",
        "productId": "3741887959243293126",
        "material_id": "3741887959243293126",
        "status": "待剪辑",
        "config_id": "cfg-img-v2",
        "mode": "image-to-video",
        "created_at": "2026-05-20T10:00:00"
        
    },
]


def update_mock_task_status(task_id: str, new_status: str) -> bool:
    """更新模拟任务列表中的任务状态。

    参数:
        task_id: 任务 ID
        new_status: 新状态（待剪辑/剪辑中/待发布/剪辑失败/retrying）

    返回:
        是否成功更新
    """
    for task in MOCK_TASKS:
        if task["id"] == task_id:
            task["status"] = new_status
            return True
    return False


def update_mock_task_hamming(task_id: str, hamming_distance: int) -> bool:
    """更新模拟任务列表中的重复检测汉明距离。

    参数:
        task_id: 任务 ID
        hamming_distance: 汉明距离值

    返回:
        是否成功更新
    """
    for task in MOCK_TASKS:
        if task["id"] == task_id:
            task["hamming_distance"] = hamming_distance
            return True
    return False

# 模拟服务端配置存储（按 config_id 索引）
SERVER_CONFIG_STORE = {
    "1231231": {
        "version": 542,
        "clip_mode": {"mode": "image-to-video"},
        "video_items": {
            "frame_extraction": True,
            "cropping": True,
            "blur": True,
            "shake": True,
            "watermark": True,
            "brightness": True,
            "contrast": True,
            "saturation": True,
            "color_balance": False,
            "gamma": False,
            "vintage_bw": False,
        },
        "text_items": {"subtitles": False, "danmaku": True, "sticker": True},
        "affix": {"prepend_enabled": True, "append_enabled": True},
        "audio": {
            "background_music_enabled": True,
            "speed_adjustment_enabled": True,
            "pitch_enabled": True,
        },
        "repetition": {"loop_count": 1},
        "clip_duration": {"default_duration_per_image": 3.0},
    },
    "432342": {
        "version": 32,
        "clip_mode": {"mode": "reference-video", "img_video_position": "after"},
        "video_items": {
            "frame_extraction": True,
            "cropping": True,
            "blur": True,
            "shake": True,
            "watermark": True,
            "brightness": True,
            "contrast": True,
            "saturation": True,
            "color_balance": False,
            "gamma": False,
            "vintage_bw": False,
        },
        "text_items": {"subtitles": False, "danmaku": True, "sticker": True},
        "affix": {"prepend_enabled": True, "append_enabled": True},
        "audio": {
            "background_music_enabled": True,
            "speed_adjustment_enabled": True,
            "pitch_enabled": True,
        },
        "repetition": {"loop_count": 2},
        "clip_duration": {"default_duration_per_image": 2.0},
    },
}

_DEFAULT_CONFIG = next(iter(SERVER_CONFIG_STORE.values()))


class MockHttpSession:
    """模拟 HTTP 会话，拦截特定 API 路径返回 mock 数据，其余请求透传。

    用法:
        real_session = requests.Session()
        mock_session = MockHttpSession(real_session)
        # mock_session 可替代 requests.Session 使用
    """

    def __init__(self, real_session):
        self._real = real_session

    def get(self, url, **kwargs):
        if "/clip_record/pending_clip/list" in url:
            return _MockResponse(
                200,
                {"code": 0, "data": MOCK_TASKS},
            )
        if "/publish/account/task/poll" in url:
            return _MockResponse(
                200,
                {"code": 0, "data": MOCK_TASKS},
            )
        if "/clip_config/config_map" in url:
            import re
            m = re.search(r"[?&]config_id=([^&\s]+)", url)
            config_id = m.group(1) if m else None
            config_data = SERVER_CONFIG_STORE.get(config_id) if config_id else _DEFAULT_CONFIG
            return _MockResponse(200, config_data)
        if "/auth/info" in url or "/auth/logout" in url:
            return _MockResponse(200, {"code": 0, "data": {"username": "demo"}})
        return self._real.get(url, **kwargs)

    def post(self, url, **kwargs):
        if "/auth/login" in url:
            return _MockResponse(
                200,
                {
                    "code": 0,
                    "data": {
                        "token": "mock-at-demo-abc123",
                        "access_token": "mock-at-demo-abc123",
                        "refresh_token": "mock-rt-demo-xyz789",
                    },
                },
            )
        if "/auth/logout" in url:
            return _MockResponse(200, {"code": 0, "data": {}})
        return self._real.post(url, **kwargs)

    def put(self, url, **kwargs):
        return self._real.put(url, **kwargs)

    def delete(self, url, **kwargs):
        return self._real.delete(url, **kwargs)

    @property
    def cookies(self):
        return self._real.cookies


class _MockResponse:
    """模拟 HTTP 响应对象。"""

    def __init__(self, status_code: int, json_body):
        self.status_code = status_code
        self._json_body = json_body if isinstance(json_body, dict) else {}

    def json(self):
        return self._json_body
