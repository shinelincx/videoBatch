from unittest.mock import MagicMock

from video_batch.material_scanner import MaterialIndex, MaterialInfo, MaterialScanner, MaterialScanError


def test_scan_img_dir_returns_image_materials(tmp_path):
    """扫描 img/ 目录返回图片素材列表"""
    assets_dir = tmp_path / "assets"
    img_dir = assets_dir / "input" / "task-001" / "img"
    img_dir.mkdir(parents=True)

    (img_dir / "cover.jpg").write_text("fake jpg")
    (img_dir / "logo.png").write_text("fake png")
    (img_dir / "banner.webp").write_text("fake webp")

    scanner = MaterialScanner(assets_dir=assets_dir)
    index = scanner.scan(task_id="task-001")

    assert len(index.images) == 3
    jpg = next(m for m in index.images if m.path.name == "cover.jpg")
    assert jpg.material_type == "image"
    assert jpg.format == "jpg"
    assert jpg.size == 8
    assert jpg.created_at is not None


def test_scan_mv_dir_returns_video_materials(tmp_path):
    """扫描 mv/ 目录返回视频素材列表"""
    assets_dir = tmp_path / "assets"
    mv_dir = assets_dir / "input" / "task-001" / "mv"
    mv_dir.mkdir(parents=True)

    (mv_dir / "clip.mp4").write_text("fake mp4")

    scanner = MaterialScanner(assets_dir=assets_dir)
    index = scanner.scan(task_id="task-001")

    assert len(index.videos) == 1
    video = index.videos[0]
    assert video.path.name == "clip.mp4"
    assert video.material_type == "video"
    assert video.format == "mp4"


def test_scan_both_dirs_returns_material_index(tmp_path):
    """同时扫描 img 和 mv 目录"""
    assets_dir = tmp_path / "assets"
    (assets_dir / "input" / "task-001" / "img").mkdir(parents=True)
    (assets_dir / "input" / "task-001" / "mv").mkdir(parents=True)

    (assets_dir / "input" / "task-001" / "img" / "a.jpg").write_text("img")
    (assets_dir / "input" / "task-001" / "mv" / "b.mp4").write_text("vid")

    scanner = MaterialScanner(assets_dir=assets_dir)
    index = scanner.scan(task_id="task-001")

    assert index.task_id == "task-001"
    assert len(index.images) == 1
    assert len(index.videos) == 1


def test_empty_dirs_return_empty_index(tmp_path):
    """素材目录为空时返回空 MaterialIndex（不抛异常）"""
    assets_dir = tmp_path / "assets"
    (assets_dir / "input" / "task-001" / "img").mkdir(parents=True)
    (assets_dir / "input" / "task-001" / "mv").mkdir(parents=True)

    scanner = MaterialScanner(assets_dir=assets_dir)
    index = scanner.scan(task_id="task-001")

    assert index.task_id == "task-001"
    assert len(index.images) == 0
    assert len(index.videos) == 0


def test_missing_assets_dir_raises_error(tmp_path):
    """素材目录不存在时抛出 MaterialScanError"""
    scanner = MaterialScanner(assets_dir=tmp_path / "assets")

    try:
        scanner.scan(task_id="task-001")
        assert False, "should have raised"
    except MaterialScanError as e:
        assert "素材目录不存在" in str(e)


def test_unsupported_format_skipped_and_logged(tmp_path):
    """不支持的文件格式被跳过并记录日志"""
    assets_dir = tmp_path / "assets"
    img_dir = assets_dir / "input" / "task-001" / "img"
    img_dir.mkdir(parents=True)
    logger = MagicMock()

    (img_dir / "valid.jpg").write_text("img")
    (img_dir / "notes.txt").write_text("text")
    (img_dir / "data.bmp").write_text("bmp")

    scanner = MaterialScanner(assets_dir=assets_dir, logger=logger)
    index = scanner.scan(task_id="task-001")

    assert len(index.images) == 1
    logger.warning.assert_called()


def test_scan_logs_results(tmp_path):
    """扫描完成后记录日志"""
    assets_dir = tmp_path / "assets"
    img_dir = assets_dir / "input" / "task-001" / "img"
    img_dir.mkdir(parents=True)
    (img_dir / "a.jpg").write_text("img")
    logger = MagicMock()

    scanner = MaterialScanner(assets_dir=assets_dir, logger=logger)
    scanner.scan(task_id="task-001")

    logger.info.assert_called()


def test_material_index_is_empty(tmp_path):
    """MaterialIndex.is_empty 判断是否有素材"""
    index = MaterialIndex(task_id="test", images=[], videos=[])
    assert index.is_empty() is True

    index.images.append(MaterialInfo(
        path=tmp_path / "a.jpg", material_type="image", format="jpg", size=100,
    ))
    assert index.is_empty() is False


def test_scan_stickers_returns_material_info_list(tmp_path):
    """扫描贴纸目录返回 MaterialInfo 列表"""
    sticker_dir = tmp_path / "stickers"
    sticker_dir.mkdir()

    (sticker_dir / "star.png").write_text("png data")
    (sticker_dir / "heart.webp").write_text("webp data")

    scanner = MaterialScanner(assets_dir=tmp_path / "assets")
    stickers = scanner.scan_stickers(str(sticker_dir))

    assert len(stickers) == 2
    star = next(s for s in stickers if s.path.name == "star.png")
    assert star.material_type == "sticker"
    assert star.format == "png"
    assert star.size == 8
    assert star.created_at is not None

    heart = next(s for s in stickers if s.path.name == "heart.webp")
    assert heart.material_type == "sticker"
    assert heart.format == "webp"


def test_scan_stickers_empty_dir_returns_empty_list(tmp_path):
    """贴纸目录为空时返回空列表，不抛异常"""
    sticker_dir = tmp_path / "stickers"
    sticker_dir.mkdir()

    scanner = MaterialScanner(assets_dir=tmp_path / "assets")
    stickers = scanner.scan_stickers(str(sticker_dir))

    assert isinstance(stickers, list)
    assert len(stickers) == 0


def test_scan_stickers_missing_dir_returns_empty_with_log(tmp_path):
    """贴纸目录不存在时返回空列表并记录警告日志"""
    logger = MagicMock()

    scanner = MaterialScanner(assets_dir=tmp_path / "assets", logger=logger)
    missing_dir = tmp_path / "nonexistent_stickers"
    stickers = scanner.scan_stickers(str(missing_dir))

    assert isinstance(stickers, list)
    assert len(stickers) == 0
    logger.warning.assert_called()
    call_args = str(logger.warning.call_args)
    assert "贴纸" in call_args


def test_scan_stickers_unsupported_format_skipped(tmp_path):
    """贴纸目录中不支持格式被跳过并记录日志"""
    sticker_dir = tmp_path / "stickers"
    sticker_dir.mkdir()
    logger = MagicMock()

    (sticker_dir / "valid.png").write_text("png")
    (sticker_dir / "notes.txt").write_text("text")
    (sticker_dir / "data.jpg").write_text("jpg")
    (sticker_dir / "image.bmp").write_text("bmp")

    scanner = MaterialScanner(assets_dir=tmp_path / "assets", logger=logger)
    stickers = scanner.scan_stickers(str(sticker_dir))

    assert len(stickers) == 1
    assert stickers[0].path.name == "valid.png"
    assert logger.warning.call_count >= 2


def test_scan_stickers_logs_results(tmp_path):
    """扫描完成后记录贴纸数量日志"""
    sticker_dir = tmp_path / "stickers"
    sticker_dir.mkdir()
    (sticker_dir / "emoji.png").write_text("png")
    logger = MagicMock()

    scanner = MaterialScanner(assets_dir=tmp_path / "assets", logger=logger)
    scanner.scan_stickers(str(sticker_dir))

    logger.info.assert_called()
    call_args = str(logger.info.call_args)
    assert "贴纸" in call_args