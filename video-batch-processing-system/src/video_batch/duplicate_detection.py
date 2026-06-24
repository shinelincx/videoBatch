"""
重复检测模块 - 视频指纹与去重

基于 pHash（感知哈希）算法计算视频帧指纹，通过汉明距离判断视频相似度，
并使用 SQLite 存储历史哈希记录进行重复检测。
"""

import math
import sqlite3
import tempfile
import threading
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import TYPE_CHECKING, Any, Callable

from PIL import Image

from video_batch.environment import ffmpeg_path, _run_no_window
from video_batch.task_status import TaskStatus

if TYPE_CHECKING:
    from video_batch.logger import Logger
    from video_batch.task_queue import Task
    from video_batch.task_status import TaskStatusManager


class DuplicateDetectionError(Exception):
    """重复检测异常"""
    pass


class HashComputationError(DuplicateDetectionError):
    """哈希计算异常"""
    pass


def _now_utc() -> str:
    """
    获取当前 UTC 时间字符串

    返回:
        ISO 格式的 UTC 时间字符串（如 2024-01-01T12:00:00）
    """
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")


# ============================================================
# pHash 算法（纯 Python DCT 实现）
# ============================================================

def compute_phash(frame: list[list[float]]) -> str:
    """
    计算视频帧的 64 位 pHash（基于 DCT 的感知哈希）

    使用离散余弦变换（DCT）提取帧的低频特征，生成 64 位感知哈希值。

    参数:
        frame: 32x32 灰度帧数据，值范围 0-255

    返回:
        16 位十六进制字符串（64 bit）
    """
    N = 32
    # 初始化 DCT 系数矩阵
    dct_coeffs = [[0.0] * N for _ in range(N)]

    # 计算二维 DCT
    for u in range(N):
        for v in range(N):
            s = 0.0
            for x in range(N):
                cos_u = math.cos((2 * x + 1) * u * math.pi / (2 * N))
                for y in range(N):
                    s += frame[x][y] * cos_u * math.cos((2 * y + 1) * v * math.pi / (2 * N))
            # 归一化系数
            cu = math.sqrt(2 / N) if u > 0 else math.sqrt(1 / N)
            cv = math.sqrt(2 / N) if v > 0 else math.sqrt(1 / N)
            dct_coeffs[u][v] = s * cu * cv

    # 提取左上角 8x8 低频系数
    low_freq = [dct_coeffs[u][v] for u in range(8) for v in range(8)]
    # 计算低频系数的平均值
    mean_val = sum(low_freq) / 64.0

    # 根据与均值的比较生成哈希位
    hash_bits = 0
    for i, val in enumerate(low_freq):
        if val > mean_val:
            hash_bits |= (1 << (63 - i))

    return f"{hash_bits:016x}"


def hamming_distance(hash1: str, hash2: str) -> int:
    """
    计算两个 64 位十六进制哈希的汉明距离

    汉明距离越小，两个哈希值越相似。

    参数:
        hash1: 第一个哈希值（16 位十六进制字符串）
        hash2: 第二个哈希值（16 位十六进制字符串）

    返回:
        汉明距离（0-64 之间的整数）
    """
    val1 = int(hash1, 16)
    val2 = int(hash2, 16)
    return (val1 ^ val2).bit_count()


# ============================================================
# 数据模型
# ============================================================

@dataclass
class VideoHashRecord:
    """视频哈希记录数据模型"""
    task_id: str        # 任务 ID
    productId: str     # 产品 ID
    user_id: str        # 用户 ID
    clip_mode: str      # 剪辑模式
    hash_val: str       # pHash 值
    created_at: str     # 创建时间


@dataclass
class DuplicateResult:
    """重复检测结果"""
    is_duplicate: bool                  # 是否为重复视频
    hamming_distance: int               # 与最相似记录的汉明距离
    threshold: int                      # 判定重复的阈值
    matched_record: VideoHashRecord | None = None # 匹配到的记录（仅重复时有效）


@dataclass
class DuplicateDetectionConfig:
    """重复检测配置"""
    default_threshold: int = 12             # 默认判定阈值
    retention_days: int = 30                # 哈希记录保留天数
    max_records: int = 1000                 # 最大记录数
    mode_thresholds: dict[str, int] = field(default_factory=dict) # 按模式自定义阈值

    def get_threshold(self, clip_mode: str) -> int:
        """
        获取指定剪辑模式的判定阈值

        参数:
            clip_mode: 剪辑模式名称

        返回:
            该模式对应的判定阈值，未配置则返回默认阈值
        """
        return self.mode_thresholds.get(clip_mode, self.default_threshold)


# ============================================================
# SQLite 存储
# ============================================================

class VideoHashStore:
    """
    视频哈希 SQLite 存储

    使用 SQLite 数据库持久化存储视频 pHash 记录，支持按用户、任务、素材
    等维度查询，以及过期记录和超限记录的自动清理。
    """

    def __init__(self, db_path: Path, logger: "Logger | None" = None) -> None:
        """
        初始化哈希存储

        参数:
            db_path: 数据库文件路径（支持 :memory: 内存数据库）
            logger: 日志记录器
        """
        self._db_path = Path(db_path) if not isinstance(db_path, Path) else db_path
        self._logger = logger
        self._lock = threading.Lock()  # 线程锁，保证并发安全
        self._shared_conn: sqlite3.Connection | None = None  # 共享连接（内存数据库用）
        self._init_db()

    def _init_db(self) -> None:
        """
        初始化数据库表和索引

        对于内存数据库直接创建表；对于文件数据库，检测损坏时自动重建。
        """
        if str(self._db_path) == ":memory:":
            self._shared_conn = sqlite3.connect(":memory:")
            self._shared_conn.execute("""
                CREATE TABLE IF NOT EXISTS video_hashes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    task_id TEXT NOT NULL,
                    productId TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    clip_mode TEXT NOT NULL,
                    hash_val TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
            """)
            self._shared_conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_user_id ON video_hashes(user_id)
            """)
            self._shared_conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_created_at ON video_hashes(created_at)
            """)
            self._shared_conn.row_factory = sqlite3.Row
            return

        # 尝试连接现有数据库，检查表是否存在
        try:
            conn = sqlite3.connect(str(self._db_path))
            conn.execute("SELECT COUNT(*) FROM video_hashes")
            conn.close()
        except Exception:
            # 数据库损坏，重新创建
            self._db_path.write_text("")
            if self._logger:
                self._logger.error(
                    task_id="hashes",
                    module="重复检测",
                    message="哈希数据库已损坏，重新创建",
                )

    def _get_conn(self) -> sqlite3.Connection:
        """
        获取数据库连接

        对于内存数据库复用共享连接，对于文件数据库每次创建新连接。

        返回:
            SQLite 数据库连接对象
        """
        if self._shared_conn is not None:
            return self._shared_conn

        # 确保数据库目录存在
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(self._db_path))
        # 创建表和索引
        conn.execute("""
            CREATE TABLE IF NOT EXISTS video_hashes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id TEXT NOT NULL,
                productId TEXT NOT NULL,
                user_id TEXT NOT NULL,
                clip_mode TEXT NOT NULL,
                hash_val TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_user_id ON video_hashes(user_id)
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_created_at ON video_hashes(created_at)
        """)
        conn.row_factory = sqlite3.Row
        return conn

    def insert(self, record: VideoHashRecord) -> None:
        """
        插入新的哈希记录

        参数:
            record: 待插入的视频哈希记录
        """
        with self._lock:
            conn = self._get_conn()
            conn.execute(
                """INSERT INTO video_hashes
                   (task_id, productId, user_id, clip_mode, hash_val, created_at)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (record.task_id, record.productId, record.user_id,
                 record.clip_mode, record.hash_val, record.created_at),
            )
            conn.commit()
            if self._shared_conn is None:
                conn.close()

    def get_all_for_user(self, user_id: str) -> list[VideoHashRecord]:
        """
        获取指定用户的所有哈希记录

        参数:
            user_id: 用户 ID

        返回:
            按创建时间降序排列的哈希记录列表
        """
        with self._lock:
            conn = self._get_conn()
            rows = conn.execute(
                "SELECT * FROM video_hashes WHERE user_id = ? ORDER BY created_at DESC",
                (user_id,),
            ).fetchall()
            if self._shared_conn is None:
                conn.close()
        return [self._row_to_record(r) for r in rows]

    def get_by_material(self, user_id: str, productId: str) -> list[VideoHashRecord]:
        """
        获取指定用户和产品的哈希记录

        参数:
            user_id: 用户 ID
            productId: 产品 ID

        返回:
            按创建时间降序排列的哈希记录列表
        """
        with self._lock:
            conn = self._get_conn()
            rows = conn.execute(
                "SELECT * FROM video_hashes WHERE user_id = ? AND productId = ? ORDER BY created_at DESC",
                (user_id, productId),
            ).fetchall()
            if self._shared_conn is None:
                conn.close()
        return [self._row_to_record(r) for r in rows]

    def get_by_task(self, user_id: str, task_id: str) -> list[VideoHashRecord]:
        """
        获取指定用户和任务的哈希记录

        参数:
            user_id: 用户 ID
            task_id: 任务 ID

        返回:
            按创建时间降序排列的哈希记录列表
        """
        with self._lock:
            conn = self._get_conn()
            rows = conn.execute(
                "SELECT * FROM video_hashes WHERE user_id = ? AND task_id = ? ORDER BY created_at DESC",
                (user_id, task_id),
            ).fetchall()
            if self._shared_conn is None:
                conn.close()
        return [self._row_to_record(r) for r in rows]

    def cleanup(self, retention_days: int | None = None, max_records: int | None = None) -> int:
        """
        清理过期或超限的哈希记录

        参数:
            retention_days: 保留天数，超过此天数的记录将被删除
            max_records: 最大记录数，超过时删除最旧的记录

        返回:
            被删除的记录数量
        """
        deleted = 0
        with self._lock:
            conn = self._get_conn()
            # 按保留天数清理
            if retention_days is not None:
                cutoff = (datetime.now(timezone.utc) - timedelta(days=retention_days)).strftime("%Y-%m-%dT%H:%M:%S")
                cur = conn.execute(
                    "DELETE FROM video_hashes WHERE created_at < ?",
                    (cutoff,),
                )
                deleted += cur.rowcount

            # 按最大记录数清理（删除最旧的记录）
            if max_records is not None:
                total = conn.execute("SELECT COUNT(*) FROM video_hashes").fetchone()[0]
                if total > max_records:
                    conn.execute(
                        """DELETE FROM video_hashes WHERE id IN (
                            SELECT id FROM video_hashes ORDER BY created_at ASC LIMIT ?
                        )""",
                        (total - max_records,),
                    )
                    deleted += (total - max_records)

            conn.commit()
            if self._shared_conn is None:
                conn.close()

        # 记录清理信息到日志
        if self._logger and deleted > 0:
            self._logger.info(
                task_id="hashes",
                module="重复检测",
                message=f"清理了 {deleted} 条过期/超限记录",
            )

        return deleted

    def count(self) -> int:
        """
        获取数据库中的总记录数

        返回:
            哈希记录总数
        """
        with self._lock:
            conn = self._get_conn()
            row = conn.execute("SELECT COUNT(*) FROM video_hashes").fetchone()
            if self._shared_conn is None:
                conn.close()
        return row[0]

    @staticmethod
    def _row_to_record(row: sqlite3.Row) -> VideoHashRecord:
        """
        将 SQLite 行数据转换为 VideoHashRecord 对象

        参数:
            row: SQLite 行数据

        返回:
            VideoHashRecord 对象
        """
        return VideoHashRecord(
            task_id=row["task_id"],
            productId=row["productId"],
            user_id=row["user_id"],
            clip_mode=row["clip_mode"],
            hash_val=row["hash_val"],
            created_at=row["created_at"],
        )


# ============================================================
# 重复检测器
# ============================================================

class DuplicateDetector:
    """
    视频重复检测器

    计算视频 pHash 并与数据库中已有记录对比，通过汉明距离判断是否为重复视频。
    支持全量、任务级别和素材级别三种检测范围。
    """

    def __init__(
        self,
        hash_store: VideoHashStore,                  # 哈希存储
        config: DuplicateDetectionConfig | None = None, # 重复检测配置
        logger: "Logger | None" = None,              # 日志记录器
        status_manager: "TaskStatusManager | None" = None,  # 任务状态管理器
    ) -> None:
        self.hash_store = hash_store
        self.config = config or DuplicateDetectionConfig()
        self._logger = logger
        self._status_manager = status_manager

    def compute_phash(self, video_path: str) -> str:
        """
        从视频文件提取代表性帧并计算 pHash

        使用 ffmpeg 从视频中间位置提取一帧，转为 32x32 灰度图后计算 DCT 感知哈希。

        参数:
            video_path: 视频文件路径

        返回:
            64 位 pHash 值（16 位十六进制字符串）

        异常:
            HashComputationError: 帧提取或哈希计算失败时抛出
        """
        video = Path(video_path)
        if not video.exists():
            raise HashComputationError(f"视频文件不存在: {video_path}")

        # 使用 ffprobe 获取视频时长
        try:
            probe_result = _run_no_window(
                ["ffprobe", "-v", "quiet", "-print_format", "json",
                 "-show_entries", "format=duration",
                 "-select_streams", "v:0", str(video)],
                capture_output=True, text=True,
                encoding="utf-8", errors="replace",
            )
            duration = 1.0
            if probe_result.returncode == 0 and probe_result.stdout.strip():
                import json
                info = json.loads(probe_result.stdout)
                duration = float(info.get("format", {}).get("duration", 1.0))
        except Exception:
            duration = 1.0

        # 取视频中间位置（约一半时长处）作为代表性帧
        seek_time = max(0.0, duration / 2.0)

        # 使用 ffmpeg 提取单帧为 32x32 灰度原始像素数据
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            extract_cmd = [
                ffmpeg_path(), "-y",
                "-ss", str(seek_time),
                "-i", str(video),
                "-frames:v", "1",
                "-s", "32x32",
                "-pix_fmt", "gray",
                str(tmp_path),
            ]
            result = _run_no_window(
                extract_cmd, capture_output=True, text=True,
                encoding="utf-8", errors="replace",
            )
            if result.returncode != 0:
                raise HashComputationError(
                    f"ffmpeg 帧提取失败: {(result.stderr or '').strip()}"
                )

            # 使用 PIL 读取 32x32 灰度帧数据
            img = Image.open(tmp_path)
            img_gray = img.convert("L")
            pixels = list(img_gray.getdata())

            # 转换为 32x32 二维列表
            frame_2d = [
                [float(pixels[y * 32 + x]) for x in range(32)]
                for y in range(32)
            ]

            return compute_phash(frame_2d)

        except HashComputationError:
            raise
        except Exception as e:
            raise HashComputationError(f"帧处理失败: {e}") from e
        finally:
            try:
                Path(tmp_path).unlink(missing_ok=True)
            except Exception:
                pass

    def _mark_failed(self, task: "Task", access_token: str) -> None:
        if self._status_manager is not None:
            self._status_manager.transition(task, TaskStatus.FAILED, access_token)
        else:
            task.status = TaskStatus.FAILED

    def check_duplicate(
        self,
        task: "Task",
        video_path: str,
        user_id: str,
        clip_mode: str,
        scope: str = "full",
        access_token: str = "",
    ) -> DuplicateResult:
        """
        检查视频是否重复

        计算当前视频的 pHash，与数据库中已有记录对比，返回检测结果。
        无论是否重复，都会将当前视频的哈希记录存入数据库。

        参数:
            task: 当前任务对象
            video_path: 视频文件路径
            user_id: 用户 ID
            clip_mode: 剪辑模式
            scope: 检测范围（full=全量, task=任务级别, material=素材级别）

        返回:
            DuplicateResult: 重复检测结果

        异常:
            视频哈希计算失败时，将任务状态标记为 failed 并重新抛出异常
        """
        # 计算当前视频的哈希值
        try:
            current_hash = self.compute_phash(video_path)
        except Exception:
            self._mark_failed(task, access_token)
            raise

        # 获取该模式的判定阈值
        threshold = self.config.get_threshold(clip_mode)

        # 根据检测范围获取对比记录集
        if scope == "task":
            records = self.hash_store.get_by_task(user_id, task.id)
        elif scope == "material":
            records = self.hash_store.get_by_material(user_id, task.productId)
        else:
            records = self.hash_store.get_all_for_user(user_id)

        # 寻找汉明距离最小的匹配记录
        best_distance = 64
        best_match: VideoHashRecord | None = None

        for record in records:
            dist = hamming_distance(current_hash, record.hash_val)
            if dist < best_distance:
                best_distance = dist
                best_match = record

        # 判断是否重复
        is_duplicate = best_distance <= threshold

        # 将当前视频的哈希记录存入数据库
        self.hash_store.insert(VideoHashRecord(
            task_id=task.id,
            productId=task.productId,
            user_id=user_id,
            clip_mode=clip_mode,
            hash_val=current_hash,
            created_at=_now_utc(),
        ))

        # 构建检测结果
        result = DuplicateResult(
            is_duplicate=is_duplicate,
            hamming_distance=best_distance,
            threshold=threshold,
            matched_record=best_match if is_duplicate else None,
        )

        # 记录检测结果到日志
        if self._logger:
            status_text = "重复" if is_duplicate else "唯一"
            self._logger.info(
                task_id=task.id,
                module="重复检测",
                message=f"检测完成: {status_text} (距离={best_distance}, 阈值={threshold})",
            )

        return result

    def detect_async(
        self,
        task: "Task",
        video_path: str,
        user_id: str,
        clip_mode: str,
        callback: Callable[[str, bool, DuplicateResult], Any],
        scope: str = "full",
        access_token: str = "",
    ) -> None:
        """
        异步执行重复检测

        在后台线程中执行检测，完成后调用回调函数。

        参数:
            task: 当前任务对象
            video_path: 视频文件路径
            user_id: 用户 ID
            clip_mode: 剪辑模式
            callback: 回调函数，接收 (task_id, is_duplicate, result)
            scope: 检测范围
        """
        def _run() -> None:
            """后台线程执行的检测逻辑"""
            try:
                result = self.check_duplicate(task, video_path, user_id, clip_mode, scope, access_token)
                callback(task.id, result.is_duplicate, result)
            except Exception:
                self._mark_failed(task, access_token)
                callback(task.id, False, DuplicateResult(
                    is_duplicate=False,
                    hamming_distance=64,
                    threshold=0,
                ))

        # 启动后台线程
        thread = threading.Thread(target=_run, daemon=True)
        thread.start()
