"""
素材扫描模块 - 媒体文件扫描与索引

负责扫描指定任务目录下的图片和视频素材文件，
构建素材索引供后续处理流程使用。
"""

from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from video_batch.logger import Logger
    from video_batch.metadata_config import MetadataConfig

# 支持的图片格式集合
IMAGE_FORMATS = {"jpg", "jpeg", "png", "webp"}
# 支持的视频格式集合
VIDEO_FORMATS = {"mp4"}
STICKER_FORMATS = {"png", "webp"}


class MaterialScanError(Exception):
    """素材扫描异常"""
    pass


@dataclass
class MaterialInfo:
    """素材信息数据模型"""
    path: Path                    # 文件绝对路径
    material_type: str            # 素材类型（image/video）
    format: str                   # 文件格式扩展名
    size: int                     # 文件大小（字节）
    created_at: datetime | None = field(default=None) # 文件创建时间


@dataclass
class MaterialIndex:
    """素材索引，包含某个任务的所有图片和视频素材"""
    task_id: str                                     # 关联的任务 ID
    images: list[MaterialInfo] = field(default_factory=list) # 图片素材列表
    videos: list[MaterialInfo] = field(default_factory=list) # 视频素材列表

    def is_empty(self) -> bool:
        """
        检查素材索引是否为空

        返回:
            无任何素材时返回 True，否则返回 False
        """
        return len(self.images) == 0 and len(self.videos) == 0


class MaterialScanner:
    """
    素材扫描器

    扫描指定任务目录下的 img/（图片）和 mv/（视频）子目录，
    构建包含所有有效素材的索引。
    """

    def __init__(self, assets_dir: Path, logger: "Logger | None" = None) -> None:
        """
        初始化素材扫描器

        参数:
            assets_dir: 素材根目录路径
            logger: 日志记录器
        """
        self._assets_dir = Path(assets_dir)
        self._logger = logger

    def scan(self, task_id: str) -> MaterialIndex:
        """
        扫描指定任务的素材目录

        扫描 task_id/img/ 目录获取图片素材，
        扫描 task_id/mv/ 目录获取视频素材。

        参数:
            task_id: 任务 ID（对应 assets_dir 下的子目录名）

        返回:
            MaterialIndex: 包含所有扫描到的素材信息

        异常:
            MaterialScanError: 素材目录不存在时抛出
        """
        base = self._assets_dir / "input" / task_id
        # 检查任务目录是否存在
        if not base.exists():
            raise MaterialScanError("素材目录不存在: %s" % base)
        # 扫描图片和视频子目录
        images = self._scan_dir(base / "img", IMAGE_FORMATS, "image")
        videos = self._scan_dir(base / "mv", VIDEO_FORMATS, "video")
        # 构建素材索引
        index = MaterialIndex(task_id=task_id, images=images, videos=videos)
        # 记录扫描结果到日志
        if self._logger:
            self._logger.info(
                task_id=task_id,
                module="素材扫描",
                message="图片 %d 个, 视频 %d 个" % (len(images), len(videos)),
            )
        return index

    def scan_stickers(self, sticker_dir: str) -> list[MaterialInfo]:
        """
        扫描贴纸目录，建立贴纸素材索引

        扫描指定目录下的贴纸文件（PNG、WebP 等透明背景格式），
        返回 MaterialInfo 列表供叠加模块使用。

        参数:
            sticker_dir: 贴纸目录路径

        返回:
            贴纸素材信息列表，目录不存在或为空时返回空列表
        """
        dir_path = Path(sticker_dir)
        if not dir_path.exists():
            if self._logger:
                self._logger.warning(
                    task_id="material",
                    module="素材扫描",
                    message="贴纸目录不存在: %s" % sticker_dir,
                )
            return []
        stickers = self._scan_dir(dir_path, STICKER_FORMATS, "sticker")
        if self._logger:
            self._logger.info(
                task_id="material",
                module="素材扫描",
                message="贴纸 %d 个" % len(stickers),
            )
        return stickers

    def _scan_dir(self, dir_path: Path, formats: set[str], material_type: str) -> list[MaterialInfo]:
        """
        扫描指定目录下的媒体文件

        遍历目录中的所有文件，筛选出支持格式的文件并提取文件信息。

        参数:
            dir_path: 待扫描的目录路径
            formats: 支持的文件格式集合
            material_type: 素材类型标识

        返回:
            扫描到的素材信息列表
        """
        # 目录不存在时返回空列表
        if not dir_path.exists():
            return []
        result = []
        for f in sorted(dir_path.iterdir()):
            # 跳过非文件项
            if not f.is_file():
                continue
            # 检查文件格式
            ext = f.suffix.lstrip(".").lower()
            if ext not in formats:
                if self._logger:
                    self._logger.warning(
                        task_id="material",
                        module="素材扫描",
                        message="不支持的格式: %s" % f.name,
                    )
                continue
            # 提取文件元信息
            stat = f.stat()
            result.append(MaterialInfo(
                path=f.resolve(),
                material_type=material_type,
                format=ext,
                size=stat.st_size,
                created_at=datetime.fromtimestamp(stat.st_ctime),
            ))
        return result


@dataclass
class MaterialScanResult(MaterialIndex):
    """素材扫描扩展结果，在基础索引上增加 metadata 路径。

    继承 MaterialIndex 的所有字段（task_id、images、videos），
    并增加 metadata.json 中的 bgm_dir、prepend_dir、append_dir 路径。
    """

    bgm_dir: str | None = None
    prepend_dir: str | None = None
    append_dir: str | None = None

    def has_images(self) -> bool:
        return len(self.images) > 0

    def has_videos(self) -> bool:
        return len(self.videos) > 0


StatusReporter = Callable[[str, str], None]


class MaterialScanService:
    """素材扫描服务，集成 metadata 解析和任务状态上报。

    组合基础 MaterialScanner 与 MetadataConfig，实现:
      - 委托 MaterialScanner 执行文件系统扫描
      - 关联 metadata.json 中的可选目录路径
      - 素材目录缺失时通过 status_reporter 回调标记任务失败
    """

    def __init__(
        self,
        assets_dir: Path,
        metadata: "MetadataConfig",
        status_reporter: StatusReporter,
        logger: "Logger | None" = None,
    ) -> None:
        self._scanner = MaterialScanner(assets_dir=assets_dir, logger=logger)
        self._metadata = metadata
        self._status_reporter = status_reporter
        self._logger = logger

    def scan(self, task_id: str) -> MaterialScanResult:
        try:
            index = self._scanner.scan(task_id)
        except MaterialScanError:
            if self._logger:
                self._logger.error(
                    task_id=task_id, module="素材扫描",
                    message="素材目录不存在，标记任务失败",
                )
            self._status_reporter(task_id, "剪辑失败")
            return MaterialScanResult(task_id=task_id)

        return MaterialScanResult(
            task_id=task_id,
            images=index.images,
            videos=index.videos,
            bgm_dir=self._metadata.bgm_dir,
            prepend_dir=self._metadata.prepend_dir,
            append_dir=self._metadata.append_dir,
        )
