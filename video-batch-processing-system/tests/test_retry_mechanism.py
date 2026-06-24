import random
from unittest.mock import MagicMock

import pytest

from video_batch.task_queue import Task
from video_batch.retry_mechanism import (
    ParameterPerturber,
    RetryConfig,
    RetryManager,
    RetryResult,
)


# ============================================================
# 辅助函数
# ============================================================

def _make_task(task_id="task-001", status="剪辑中", retry_count=0):
    return Task(id=task_id, material_id="mat-001", status=status, retry_count=retry_count)


def _default_params(**overrides):
    """构建默认的视频生成参数"""
    p = {
        "filter": "warm_v1",
        "duration": 15.0,
        "bgm": "bgm_01.mp3",
        "font": "Arial",
        "font_color": "#FFFFFF",
        "font_position": "bottom",
    }
    p.update(overrides)
    return p


def _duplicate_result(is_duplicate=True):
    from video_batch.duplicate_detection import DuplicateResult
    return DuplicateResult(
        is_duplicate=is_duplicate,
        hamming_distance=0 if is_duplicate else 64,
        threshold=12,
    )


# ============================================================
# AC-2: 重试次数可配置，默认 3 次
# ============================================================

def test_config_default_max_retries():
    """默认最大重试次数为 3"""
    config = RetryConfig()
    assert config.max_retries == 3


def test_config_custom_max_retries():
    """自定义重试次数"""
    config = RetryConfig(max_retries=5)
    assert config.max_retries == 5


# ============================================================
# AC-3: 滤镜切换类别
# ============================================================

def test_perturb_filter_switches_to_different_category():
    """扰动的滤镜应来自不同类别"""
    perturber = ParameterPerturber()
    perturber.filter_categories = {
        "warm": ["warm_v1", "warm_v2"],
        "cool": ["cool_v1", "cool_v2"],
        "vintage": ["vintage_v1", "vintage_v2"],
    }

    random.seed(42)
    result = perturber.perturb_filter("warm_v1")
    assert result in ["cool_v1", "cool_v2", "vintage_v1", "vintage_v2"]
    assert result not in ["warm_v1", "warm_v2"]


def test_perturb_filter_returns_different_each_time():
    """多次扰动应返回不同的滤镜（来自不同类别）"""
    perturber = ParameterPerturber()
    perturber.filter_categories = {
        "warm": ["warm_v1"],
        "cool": ["cool_v1"],
        "vintage": ["vintage_v1"],
    }

    result = perturber.perturb_filter("warm_v1")
    assert result in ["cool_v1", "vintage_v1"]


# ============================================================
# AC-4: 时长 ±10% 调整
# ============================================================

def test_perturb_duration_within_10_percent():
    """时长调整在 ±10% 范围内"""
    perturber = ParameterPerturber()

    random.seed(42)
    result = perturber.perturb_duration(15.0)
    assert 13.5 <= result <= 16.5


def test_perturb_duration_respects_bounds():
    """时长调整不超出安全边界"""
    perturber = ParameterPerturber()

    random.seed(42)
    result = perturber.perturb_duration(55.0, min_d=5.0, max_d=60.0)
    assert 5.0 <= result <= 60.0


def test_perturb_duration_clamps_to_min():
    """时长短于最小值时被 clamp"""
    perturber = ParameterPerturber()

    random.seed(0)  # 可能将 3.0 * 0.9 = 2.7 < 5.0，clamp 到 5.0
    result = perturber.perturb_duration(3.0, min_d=5.0, max_d=60.0)
    assert result >= 5.0


# ============================================================
# AC-5: 背景音乐排除已使用
# ============================================================

def test_perturb_bgm_excludes_used():
    """扰动背景音乐排除已使用的"""
    perturber = ParameterPerturber()
    available = ["bgm_01.mp3", "bgm_02.mp3", "bgm_03.mp3", "bgm_04.mp3"]

    random.seed(42)
    result = perturber.perturb_bgm(
        current="bgm_01.mp3",
        used=["bgm_02.mp3"],
        available=available,
    )
    assert result not in ["bgm_01.mp3", "bgm_02.mp3"]
    assert result in ["bgm_03.mp3", "bgm_04.mp3"]


def test_perturb_bgm_accumulates_used():
    """多次扰动逐步排除已使用音乐"""
    perturber = ParameterPerturber()
    available = ["bgm_01.mp3", "bgm_02.mp3", "bgm_03.mp3"]

    used = []
    random.seed(42)
    r1 = perturber.perturb_bgm("bgm_01.mp3", used, available)
    used.append(r1)

    r2 = perturber.perturb_bgm(r1, used, available)
    assert r2 != r1
    assert r2 not in used


# ============================================================
# AC-6: 文字样式差异最大化
# ============================================================

def test_perturb_text_style_differs_from_current():
    """文字样式扰动后不同于原样式"""
    perturber = ParameterPerturber()
    available = [
        {"font": "Arial", "color": "#FFFFFF", "position": "bottom"},
        {"font": "Helvetica", "color": "#FF0000", "position": "top"},
        {"font": "Georgia", "color": "#000000", "position": "center"},
    ]

    current = {"font": "Arial", "color": "#FFFFFF", "position": "bottom"}

    result = perturber.perturb_text_style(current, available)
    assert result != current
    assert result in available
    assert result["font"] != current["font"]


def test_perturb_text_style_maximizes_difference():
    """文字样式选择差异最大的方案"""
    perturber = ParameterPerturber()
    available = [
        {"font": "Arial", "color": "#FFFFFF", "position": "bottom"},
        {"font": "Arial", "color": "#FF0000", "position": "bottom"},  # diff=1
        {"font": "Helvetica", "color": "#000000", "position": "top"},  # diff=3
    ]

    current = {"font": "Arial", "color": "#FFFFFF", "position": "bottom"}
    result = perturber.perturb_text_style(current, available)
    assert result == available[2]


# ============================================================
# AC-1: 检测到重复时自动触发重试流程
# ============================================================

def test_handle_duplicate_triggers_retry():
    """检测到重复时自动重试"""
    config = RetryConfig(max_retries=3)
    manager = RetryManager(config=config)

    task = _make_task()
    params = _default_params()
    call_count = [0]

    def generate_fn(p):
        call_count[0] += 1
        return f"/tmp/video_{call_count[0]}.mp4"

    def detect_fn(t, video_path):
        if call_count[0] == 1:
            return _duplicate_result(is_duplicate=True)
        return _duplicate_result(is_duplicate=False)

    result = manager.handle_duplicate(task, params, generate_fn, detect_fn)

    assert result.success is True
    assert result.retries_used == 1
    assert call_count[0] == 2
    assert len(result.perturbation_log) == 1


def test_handle_duplicate_returns_first_on_not_duplicate():
    """首次生成不重复，无需重试"""
    config = RetryConfig()
    manager = RetryManager(config=config)

    task = _make_task()
    params = _default_params()

    def generate_fn(p):
        return "/tmp/video.mp4"

    def detect_fn(t, video_path):
        return _duplicate_result(is_duplicate=False)

    result = manager.handle_duplicate(task, params, generate_fn, detect_fn)

    assert result.success is True
    assert result.retries_used == 0
    assert len(result.perturbation_log) == 0


def test_handle_duplicate_perturbs_parameters():
    """每次重试扰动参数"""
    config = RetryConfig(max_retries=3)
    manager = RetryManager(config=config)

    task = _make_task()
    params = _default_params(filter="warm_v1", duration=15.0)
    received_params = []

    def generate_fn(p):
        received_params.append(dict(p))
        return "/tmp/video.mp4"

    def detect_fn(t, video_path):
        if len(received_params) < 3:
            return _duplicate_result(is_duplicate=True)
        return _duplicate_result(is_duplicate=False)

    result = manager.handle_duplicate(task, params.copy(), generate_fn, detect_fn)

    assert result.success is True
    assert len(received_params) >= 2
    # 至少一个参数被扰动
    assert received_params[1]["filter"] != received_params[0]["filter"] or \
           received_params[1]["duration"] != received_params[0]["duration"]


# ============================================================
# AC-7: 重试耗尽标记任务失败并通知服务端
# ============================================================

def test_retries_exhausted_marks_task_failed():
    """重试次数耗尽后任务标记为 failed"""
    config = RetryConfig(max_retries=2)
    manager = RetryManager(config=config)

    task = _make_task()
    params = _default_params()

    def generate_fn(p):
        return "/tmp/video.mp4"

    def detect_fn(t, video_path):
        return _duplicate_result(is_duplicate=True)

    result = manager.handle_duplicate(task, params, generate_fn, detect_fn)

    assert result.success is False
    assert result.retries_used == 2
    assert task.status == "剪辑失败"


def test_retries_exhausted_notifies_server():
    """重试耗尽后通知服务端"""
    config = RetryConfig(max_retries=1)
    manager = RetryManager(config=config)
    notify_mock = MagicMock()

    task = _make_task()
    params = _default_params()

    def generate_fn(p):
        return "/tmp/video.mp4"

    def detect_fn(t, video_path):
        return _duplicate_result(is_duplicate=True)

    manager.handle_duplicate(task, params, generate_fn, detect_fn, notify_fn=notify_mock)

    notify_mock.assert_called_once_with(task, "剪辑失败")
    assert task.status == "剪辑失败"


def test_successful_retry_does_not_notify_failed():
    """重试成功后不发送失败通知"""
    config = RetryConfig(max_retries=2)
    manager = RetryManager(config=config)
    notify_mock = MagicMock()

    task = _make_task()
    params = _default_params()

    call_count = [0]

    def generate_fn(p):
        call_count[0] += 1
        return "/tmp/video.mp4"

    def detect_fn(t, video_path):
        if call_count[0] == 1:
            return _duplicate_result(is_duplicate=True)
        return _duplicate_result(is_duplicate=False)

    manager.handle_duplicate(task, params, generate_fn, detect_fn, notify_fn=notify_mock)

    notify_mock.assert_not_called()
    assert task.status != "剪辑失败"


# ============================================================
# AC-8: 重试行为记录日志
# ============================================================

def test_retry_logs_on_trigger():
    """触发重试时记录日志"""
    config = RetryConfig(max_retries=2)
    logger = MagicMock()
    manager = RetryManager(config=config, logger=logger)

    task = _make_task()
    params = _default_params()

    call_count = [0]

    def generate_fn(p):
        call_count[0] += 1
        return "/tmp/video.mp4"

    def detect_fn(t, video_path):
        if call_count[0] == 1:
            return _duplicate_result(is_duplicate=True)
        return _duplicate_result(is_duplicate=False)

    manager.handle_duplicate(task, params, generate_fn, detect_fn)

    logger.info.assert_called()


def test_retry_logs_on_exhausted():
    """重试耗尽时记录 ERROR 日志"""
    config = RetryConfig(max_retries=1)
    logger = MagicMock()
    manager = RetryManager(config=config, logger=logger)

    task = _make_task()
    params = _default_params()

    def generate_fn(p):
        return "/tmp/video.mp4"

    def detect_fn(t, video_path):
        return _duplicate_result(is_duplicate=True)

    manager.handle_duplicate(task, params, generate_fn, detect_fn)

    assert logger.error.called


def test_retry_logs_per_perturbation():
    """每次参数扰动记录日志"""
    config = RetryConfig(max_retries=2)
    logger = MagicMock()
    manager = RetryManager(config=config, logger=logger)

    task = _make_task()
    params = _default_params()

    def generate_fn(p):
        return "/tmp/video.mp4"

    def detect_fn(t, video_path):
        return _duplicate_result(is_duplicate=True)

    manager.handle_duplicate(task, params, generate_fn, detect_fn)

    # 每次重试 + 最终耗尽共 3 次日志调用（2 次 info + 1 次 error）
    assert logger.info.call_count + logger.error.call_count >= 2


# ============================================================
# RetryResult 测试
# ============================================================

def test_retry_result_success():
    """成功的 RetryResult"""
    result = RetryResult(success=True, retries_used=1, final_params=_default_params(), perturbation_log=[{"changed": "filter"}])
    assert result.success is True
    assert result.retries_used == 1
    assert len(result.perturbation_log) == 1


def test_retry_result_failure():
    """失败的 RetryResult"""
    result = RetryResult(success=False, retries_used=3, final_params=None, perturbation_log=[])
    assert result.success is False
    assert result.final_params is None


# ============================================================
# 综合流程测试
# ============================================================

def test_full_retry_flow_three_retries_then_success():
    """完整流程: 3次重复 → 第4次成功"""
    config = RetryConfig(max_retries=5)
    manager = RetryManager(config=config)

    task = _make_task()
    params = _default_params()

    call_count = [0]

    def generate_fn(p):
        call_count[0] += 1
        return f"/tmp/v{call_count[0]}.mp4"

    def detect_fn(t, video_path):
        if call_count[0] <= 3:
            return _duplicate_result(is_duplicate=True)
        return _duplicate_result(is_duplicate=False)

    result = manager.handle_duplicate(task, params, generate_fn, detect_fn)

    assert result.success is True
    assert result.retries_used == 3
    assert call_count[0] == 4
    assert task.status == "剪辑中"