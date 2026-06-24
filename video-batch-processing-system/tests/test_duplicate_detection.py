import time

import pytest
from unittest.mock import MagicMock, patch

from video_batch.duplicate_detection import (
    DuplicateDetectionConfig,
    DuplicateDetectionError,
    DuplicateDetector,
    DuplicateResult,
    HashComputationError,
    VideoHashRecord,
    VideoHashStore,
    compute_phash,
    hamming_distance,
)

# ============================================================
# 辅助函数
# ============================================================

def _synthetic_frame_32x32(seed: float = 0.0) -> list[list[float]]:
    """生成确定性 32x32 灰度帧用于测试 pHash"""
    frame = [[0.0] * 32 for _ in range(32)]
    for x in range(32):
        for y in range(32):
            frame[x][y] = (x * 17 + y * 13 + seed * 100) % 256
    return frame


def _make_task(task_id="task-001", material_id="mat-001"):
    """创建模拟 Task 对象"""
    from video_batch.task_queue import Task
    return Task(id=task_id, material_id=material_id, status="剪辑中")


# ============================================================
# AC-1: pHash 算法正确实现，计算视频 64 位哈希
# ============================================================

def test_phash_returns_64bit_hex():
    """compute_phash 返回 16 位十六进制字符串（64 bit）"""
    frame = _synthetic_frame_32x32()
    hash_val = compute_phash(frame)
    assert isinstance(hash_val, str)
    assert len(hash_val) == 16
    assert all(c in "0123456789abcdef" for c in hash_val)


def test_phash_is_deterministic():
    """相同帧数据产生相同哈希"""
    frame1 = _synthetic_frame_32x32(seed=1.0)
    frame2 = _synthetic_frame_32x32(seed=1.0)
    assert compute_phash(frame1) == compute_phash(frame2)


def test_phash_different_frames_different_hash():
    """不同帧数据产生不同哈希"""
    frame1 = _synthetic_frame_32x32(seed=0.0)
    frame2 = _synthetic_frame_32x32(seed=1.0)
    assert compute_phash(frame1) != compute_phash(frame2)


# ============================================================
# AC-4: 汉明距离正确计算，阈值可配置
# ============================================================

def test_hamming_distance_same():
    """相同哈希的汉明距离为 0"""
    h = "0000000000000000"
    assert hamming_distance(h, h) == 0


def test_hamming_distance_different():
    """不同哈希正确计算汉明距离"""
    h1 = "0000000000000000"
    h2 = "000000000000000f"  # 低 4 位不同
    assert hamming_distance(h1, h2) == 4


def test_hamming_distance_max():
    """完全互补的哈希汉明距离为 64"""
    h1 = "0000000000000000"
    h2 = "ffffffffffffffff"
    assert hamming_distance(h1, h2) == 64


def test_hamming_distance_mid():
    """混合场景汉明距离计算"""
    h1 = "aaaaaaaaaaaaaaaa"
    h2 = "5555555555555555"
    assert hamming_distance(h1, h2) == 64


# ============================================================
# AC-2, AC-7: VideoHashStore SQLite 存储
# ============================================================

def test_store_insert_and_retrieve(tmp_path):
    """插入记录后可正确查询"""
    db_path = tmp_path / "hashes.db"
    store = VideoHashStore(db_path)

    record = VideoHashRecord(
        task_id="task-001",
        material_id="mat-001",
        user_id="user-a",
        clip_mode="image-to-video",
        hash_val="aaaaaaaaaaaaaaaa",
        created_at="2026-05-19T10:00:00",
    )
    store.insert(record)

    results = store.get_all_for_user("user-a")
    assert len(results) == 1
    assert results[0].task_id == "task-001"
    assert results[0].hash_val == "aaaaaaaaaaaaaaaa"


def test_store_get_all_for_user_filters_correctly(tmp_path):
    """仅返回指定用户的记录"""
    db_path = tmp_path / "hashes.db"
    store = VideoHashStore(db_path)

    store.insert(VideoHashRecord("t1", "m1", "user-a", "image-to-video", "a" * 16, "2026-05-19T10:00:00"))
    store.insert(VideoHashRecord("t2", "m2", "user-b", "reference-video", "b" * 16, "2026-05-19T10:00:00"))
    store.insert(VideoHashRecord("t3", "m3", "user-a", "image-to-video", "c" * 16, "2026-05-19T10:00:00"))

    results = store.get_all_for_user("user-a")
    assert len(results) == 2


def test_store_get_by_material(tmp_path):
    """按素材 ID 过滤"""
    db_path = tmp_path / "hashes.db"
    store = VideoHashStore(db_path)

    store.insert(VideoHashRecord("t1", "mat-a", "user-x", "image-to-video", "a" * 16, "2026-05-19T10:00:00"))
    store.insert(VideoHashRecord("t2", "mat-b", "user-x", "image-to-video", "b" * 16, "2026-05-19T10:00:00"))
    store.insert(VideoHashRecord("t3", "mat-a", "user-x", "image-to-video", "c" * 16, "2026-05-19T10:00:00"))

    results = store.get_by_material("user-x", "mat-a")
    assert len(results) == 2
    assert all(r.material_id == "mat-a" for r in results)


def test_store_get_by_task(tmp_path):
    """按任务 ID 过滤"""
    db_path = tmp_path / "hashes.db"
    store = VideoHashStore(db_path)

    store.insert(VideoHashRecord("task-a", "m1", "user-x", "image-to-video", "a" * 16, "2026-05-19T10:00:00"))
    store.insert(VideoHashRecord("task-b", "m1", "user-x", "image-to-video", "b" * 16, "2026-05-19T10:00:00"))

    results = store.get_by_task("user-x", "task-a")
    assert len(results) == 1
    assert results[0].task_id == "task-a"


def test_store_count(tmp_path):
    """count 返回正确数量"""
    db_path = tmp_path / "hashes.db"
    store = VideoHashStore(db_path)

    assert store.count() == 0
    store.insert(VideoHashRecord("t1", "m1", "u1", "image-to-video", "a" * 16, "2026-05-19T10:00:00"))
    assert store.count() == 1


# ============================================================
# AC-6: 历史记录自动清理（30 天/1000 条上限）
# ============================================================

def test_cleanup_removes_expired_records(tmp_path):
    """清理超过 30 天的记录"""
    db_path = tmp_path / "hashes.db"
    store = VideoHashStore(db_path)

    store.insert(VideoHashRecord("t-old", "m1", "u1", "image-to-video", "11" * 8, "2026-04-01T10:00:00"))
    store.insert(VideoHashRecord("t-new", "m2", "u1", "image-to-video", "22" * 8, "2026-05-19T10:00:00"))

    with patch("video_batch.duplicate_detection._now_utc", return_value="2026-05-19T12:00:00"):
        store.cleanup(retention_days=30)

    results = store.get_all_for_user("u1")
    assert len(results) == 1
    assert results[0].task_id == "t-new"


def test_cleanup_enforces_max_records(tmp_path):
    """记录超过上限时保留最新的"""
    db_path = tmp_path / "hashes.db"
    store = VideoHashStore(db_path)

    for i in range(5):
        store.insert(
            VideoHashRecord(f"t{i}", "m1", "u1", "image-to-video", f"{i:0>16}", f"2026-05-{12+i:02d}T10:00:00")
        )

    store.cleanup(max_records=3)
    results = store.get_all_for_user("u1")
    assert len(results) == 3
    task_ids = [r.task_id for r in results]
    assert "t2" in task_ids
    assert "t3" in task_ids
    assert "t4" in task_ids


# ============================================================
# AC-9: 历史记录文件损坏重新创建
# ============================================================

def test_corrupted_db_recreates(tmp_path):
    """损坏的数据库文件应重新创建"""
    db_path = tmp_path / "hashes.db"
    db_path.write_text("not a valid sqlite database")

    store = VideoHashStore(db_path)
    store.insert(VideoHashRecord("t1", "m1", "u1", "image-to-video", "a" * 16, "2026-05-19T10:00:00"))

    assert store.count() == 1


# ============================================================
# AC-2, AC-4: DuplicateDetector 重复检测
# ============================================================

def test_detector_checks_against_history(tmp_path):
    """检测时对比历史记录"""
    db_path = tmp_path / "hashes.db"
    store = VideoHashStore(db_path)
    config = DuplicateDetectionConfig(default_threshold=12)

    store.insert(VideoHashRecord("t-old", "m1", "user-a", "image-to-video", "a" * 16, "2026-05-19T10:00:00"))

    detector = DuplicateDetector(config=config, hash_store=store)

    with patch.object(detector, "compute_phash", return_value="a" * 16):
        task = _make_task("task-new", "m2")
        result = detector.check_duplicate(task, video_path="/tmp/v.mp4", user_id="user-a", clip_mode="image-to-video")

    assert result.is_duplicate is True
    assert result.hamming_distance == 0
    assert result.matched_record is not None


def test_detector_no_duplicate_found(tmp_path):
    """无相似历史记录时返回非重复"""
    db_path = tmp_path / "hashes.db"
    store = VideoHashStore(db_path)
    config = DuplicateDetectionConfig(default_threshold=12)

    store.insert(VideoHashRecord("t-old", "m1", "user-a", "image-to-video", "a" * 16, "2026-05-19T10:00:00"))

    detector = DuplicateDetector(config=config, hash_store=store)

    with patch.object(detector, "compute_phash", return_value="f" * 16):
        task = _make_task("task-new", "m2")
        result = detector.check_duplicate(task, video_path="/tmp/v.mp4", user_id="user-a", clip_mode="image-to-video")

    assert result.is_duplicate is False


def test_detector_stores_new_hash_after_check(tmp_path):
    """检测后将当前哈希存入数据库"""
    db_path = tmp_path / "hashes.db"
    store = VideoHashStore(db_path)
    config = DuplicateDetectionConfig(default_threshold=12)

    detector = DuplicateDetector(config=config, hash_store=store)

    with patch.object(detector, "compute_phash", return_value="bb" * 8):
        task = _make_task("task-new", "mat-001")
        detector.check_duplicate(task, video_path="/tmp/v.mp4", user_id="user-a", clip_mode="image-to-video")

    assert store.count() == 1
    records = store.get_all_for_user("user-a")
    assert records[0].hash_val == "bb" * 8


# ============================================================
# AC-3: 支持降级检测范围
# ============================================================

def test_scope_full_checks_all_user_records(tmp_path):
    """full 范围检测用户所有历史"""
    db_path = tmp_path / "hashes.db"
    store = VideoHashStore(db_path)
    config = DuplicateDetectionConfig(default_threshold=12)

    store.insert(VideoHashRecord("t1", "mat-a", "user-a", "image-to-video", "a" * 16, "2026-05-19T10:00:00"))
    store.insert(VideoHashRecord("t2", "mat-b", "user-a", "image-to-video", "a" * 16, "2026-05-19T10:00:00"))

    detector = DuplicateDetector(config=config, hash_store=store)

    with patch.object(detector, "compute_phash", return_value="a" * 16):
        task = _make_task("task-new", "mat-c")
        result = detector.check_duplicate(task, video_path="/tmp/v.mp4", user_id="user-a", clip_mode="image-to-video", scope="full")

    assert result.is_duplicate is True


def test_scope_material_only_checks_same_material(tmp_path):
    """material 范围仅检测同素材历史"""
    db_path = tmp_path / "hashes.db"
    store = VideoHashStore(db_path)
    config = DuplicateDetectionConfig(default_threshold=12)

    store.insert(VideoHashRecord("t1", "mat-a", "user-a", "image-to-video", "a" * 16, "2026-05-19T10:00:00"))
    store.insert(VideoHashRecord("t2", "mat-b", "user-a", "image-to-video", "a" * 16, "2026-05-19T10:00:00"))

    detector = DuplicateDetector(config=config, hash_store=store)

    with patch.object(detector, "compute_phash", return_value="a" * 16):
        task = _make_task("task-new", "mat-c")
        result = detector.check_duplicate(task, video_path="/tmp/v.mp4", user_id="user-a", clip_mode="image-to-video", scope="material")

    assert result.is_duplicate is False


def test_scope_task_only_checks_same_task(tmp_path):
    """task 范围仅检测同任务历史"""
    db_path = tmp_path / "hashes.db"
    store = VideoHashStore(db_path)
    config = DuplicateDetectionConfig(default_threshold=12)

    store.insert(VideoHashRecord("t1", "mat-a", "user-a", "image-to-video", "a" * 16, "2026-05-19T10:00:00"))

    detector = DuplicateDetector(config=config, hash_store=store)

    with patch.object(detector, "compute_phash", return_value="a" * 16):
        task = _make_task("t1", "mat-a")
        result = detector.check_duplicate(task, video_path="/tmp/v.mp4", user_id="user-a", clip_mode="image-to-video", scope="task")

    assert result.is_duplicate is True


# ============================================================
# AC-4: 按剪辑模式设置不同阈值
# ============================================================

def test_mode_specific_threshold(tmp_path):
    """不同剪辑模式使用不同阈值"""
    db_path = tmp_path / "hashes.db"
    store = VideoHashStore(db_path)
    config = DuplicateDetectionConfig(
        default_threshold=12,
        mode_thresholds={"image-to-video": 5, "reference-video": 20},
    )

    store.insert(VideoHashRecord("t1", "m1", "u1", "image-to-video", "0000000000000000", "2026-05-19T10:00:00"))

    detector = DuplicateDetector(config=config, hash_store=store)

    # 生成一个汉明距离约 8 的哈希（01 交替 = 32 个1）
    with patch.object(detector, "compute_phash", return_value="5555555555555555"):
        task = _make_task()
        # image-to-video 阈值 5，汉明距离 32 > 5 → 不重复
        result = detector.check_duplicate(task, video_path="/tmp/v.mp4", user_id="u1", clip_mode="image-to-video")
        assert result.is_duplicate is False

    # reference-video 阈值 20，汉明距离 32 > 20 → 仍不重复
    # 用更接近的哈希
    with patch.object(detector, "compute_phash", return_value="00000000000000ff"):
        task2 = _make_task("task-002", "m2")
        result2 = detector.check_duplicate(task2, video_path="/tmp/v.mp4", user_id="u1", clip_mode="reference-video")
        assert result2.is_duplicate is True


# ============================================================
# AC-5: 异步检测 + 回调
# ============================================================

def test_detect_async_runs_in_thread(tmp_path):
    """detect_async 在独立线程中运行"""
    db_path = tmp_path / "hashes.db"
    store = VideoHashStore(db_path)
    config = DuplicateDetectionConfig()

    detector = DuplicateDetector(config=config, hash_store=store)
    callback = MagicMock()

    task = _make_task()

    with patch.object(detector, "compute_phash", return_value="a" * 16):
        detector.detect_async(
            task=task,
            video_path="/tmp/v.mp4",
            user_id="user-a",
            clip_mode="image-to-video",
            callback=callback,
        )

    time.sleep(0.3)
    callback.assert_called_once()


def test_detect_async_callback_receives_result(tmp_path):
    """异步检测回调接收正确结果"""
    db_path = tmp_path / "hashes.db"
    store = VideoHashStore(db_path)
    config = DuplicateDetectionConfig(default_threshold=12)

    store.insert(VideoHashRecord("t-old", "m1", "user-a", "image-to-video", "a" * 16, "2026-05-19T10:00:00"))

    detector = DuplicateDetector(config=config, hash_store=store)
    callback = MagicMock()

    task = _make_task("task-new", "m2")

    with patch.object(detector, "compute_phash", return_value="a" * 16):
        detector.detect_async(
            task=task,
            video_path="/tmp/v.mp4",
            user_id="user-a",
            clip_mode="image-to-video",
            callback=callback,
        )

    time.sleep(0.3)
    args, kwargs = callback.call_args
    assert args[0] == "task-new"
    assert args[1] is True
    assert isinstance(args[2], DuplicateResult)


# ============================================================
# AC-8: 哈希计算失败标记任务失败
# ============================================================

def test_hash_failure_marks_task_failed(tmp_path):
    """哈希计算失败时任务标记为 failed"""
    db_path = tmp_path / "hashes.db"
    store = VideoHashStore(db_path)
    config = DuplicateDetectionConfig()

    detector = DuplicateDetector(config=config, hash_store=store)

    task = _make_task()
    with patch.object(detector, "compute_phash", side_effect=HashComputationError("提取帧失败")):
        with pytest.raises(HashComputationError):
            detector.check_duplicate(task, video_path="/tmp/v.mp4", user_id="user-a", clip_mode="image-to-video")

    assert task.status == "剪辑失败"


def test_hash_failure_in_async_marks_failed_and_calls_callback(tmp_path):
    """异步检测中哈希计算失败也标记任务并回调"""
    db_path = tmp_path / "hashes.db"
    store = VideoHashStore(db_path)
    config = DuplicateDetectionConfig()

    detector = DuplicateDetector(config=config, hash_store=store)
    callback = MagicMock()

    task = _make_task()
    with patch.object(detector, "compute_phash", side_effect=HashComputationError("提取帧失败")):
        detector.detect_async(
            task=task,
            video_path="/tmp/v.mp4",
            user_id="user-a",
            clip_mode="image-to-video",
            callback=callback,
        )

    time.sleep(0.2)
    assert task.status == "剪辑失败"
    callback.assert_called_once()


# ============================================================
# AC-10: 关键流程节点记录日志
# ============================================================

def test_check_duplicate_logs_result(tmp_path):
    """检测完成后记录日志"""
    db_path = tmp_path / "hashes.db"
    store = VideoHashStore(db_path)
    config = DuplicateDetectionConfig()
    logger = MagicMock()

    detector = DuplicateDetector(config=config, hash_store=store, logger=logger)

    with patch.object(detector, "compute_phash", return_value="a" * 16):
        task = _make_task()
        detector.check_duplicate(task, video_path="/tmp/v.mp4", user_id="user-a", clip_mode="image-to-video")

    logger.info.assert_called()


def test_cleanup_logs_result(tmp_path):
    """清理操作记录日志"""
    db_path = tmp_path / "hashes.db"
    store = VideoHashStore(db_path)
    for i in range(3):
        store.insert(VideoHashRecord(f"t{i}", "m1", "u1", "image-to-video", "a" * 16, "2026-05-19T10:00:00"))

    logger = MagicMock()
    store._logger = logger
    store.cleanup(max_records=1)
    logger.info.assert_called()


# ============================================================
# DuplicateDetectionConfig 测试
# ============================================================

def test_config_default_values():
    """默认配置值正确"""
    config = DuplicateDetectionConfig()
    assert config.default_threshold == 12
    assert config.retention_days == 30
    assert config.max_records == 1000
    assert config.mode_thresholds == {}


def test_config_get_threshold_for_mode():
    """获取指定剪辑模式的阈值"""
    config = DuplicateDetectionConfig(
        default_threshold=12,
        mode_thresholds={"image-to-video": 8},
    )
    assert config.get_threshold("image-to-video") == 8
    assert config.get_threshold("reference-video") == 12


def test_detector_initializes_with_default_config(tmp_path):
    """不传 config 时使用默认配置"""
    db_path = tmp_path / "hashes.db"
    store = VideoHashStore(db_path)
    detector = DuplicateDetector(hash_store=store)
    assert detector.config.default_threshold == 12