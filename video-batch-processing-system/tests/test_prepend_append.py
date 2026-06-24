from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from video_batch.prepend_append import (
    AffixError,
    AffixResult,
    VideoAffixer,
)


def _mock_run(returncode: int = 0, stderr: str = ""):
    result = MagicMock()
    result.returncode = returncode
    result.stderr = stderr
    return result


def _create_video_file(path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("fake_mp4")
    return path


# ============================================================
# AC-1: 从配置目录随机选择前贴视频拼接在主视频之前
# ============================================================

def test_prepend_append_concat_with_both_affixes(tmp_path):
    """前后贴均提供时，拼接顺序为 前贴 → 主视频 → 后贴"""
    prepend_dir = tmp_path / "prepend"
    append_dir = tmp_path / "append"
    _create_video_file(prepend_dir / "front.mp4")
    _create_video_file(append_dir / "back.mp4")

    main_video = _create_video_file(tmp_path / "main.mp4")
    output = tmp_path / "output.mp4"

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        affixer = VideoAffixer(
            prepend_dir=prepend_dir,
            append_dir=append_dir,
        )
        result = affixer.prepend_append(main_video, output)

    assert result.output_path == output
    assert result.prepend_path is not None
    assert result.append_path is not None

    # 验证 FFmpeg concat 参数包含三个文件
    cmd_args = mock_run.call_args[0][0]
    assert "ffmpeg" in cmd_args[0]
    assert "-filter_complex" in cmd_args
    assert "concat=n=3:v=1:a=1[outv][outa]" in " ".join(cmd_args)


def test_prepend_append_uses_vertical_canvas_and_bitrates(tmp_path):
    """前后贴拼接输出统一为 1080x1920 竖版并设置音视频码率"""
    prepend_dir = tmp_path / "prepend"
    append_dir = tmp_path / "append"
    _create_video_file(prepend_dir / "front.mp4")
    _create_video_file(append_dir / "back.mp4")

    main_video = _create_video_file(tmp_path / "main.mp4")
    output = tmp_path / "output.mp4"

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        affixer = VideoAffixer(
            prepend_dir=prepend_dir,
            append_dir=append_dir,
        )
        affixer.prepend_append(main_video, output)

    cmd_args = mock_run.call_args[0][0]
    cmd_str = " ".join(cmd_args)
    assert cmd_str.count("scale=1080:1920:force_original_aspect_ratio=decrease") == 3
    assert cmd_str.count("pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black") == 3
    assert "-b:v" in cmd_args
    assert cmd_args[cmd_args.index("-b:v") + 1] == "800k"
    assert "-minrate" in cmd_args
    assert cmd_args[cmd_args.index("-minrate") + 1] == "516k"
    assert "-b:a" in cmd_args
    assert cmd_args[cmd_args.index("-b:a") + 1] == "128k"


def test_prepend_only_concat(tmp_path):
    """仅提供前贴目录时，拼接 前贴 + 主视频"""
    prepend_dir = tmp_path / "prepend"
    _create_video_file(prepend_dir / "front.mp4")

    main_video = _create_video_file(tmp_path / "main.mp4")
    output = tmp_path / "output.mp4"

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        affixer = VideoAffixer(prepend_dir=prepend_dir)
        result = affixer.prepend_append(main_video, output)

    assert result.output_path == output
    assert result.prepend_path is not None
    assert result.append_path is None


def test_append_only_concat(tmp_path):
    """仅提供后贴目录时，拼接 主视频 + 后贴"""
    append_dir = tmp_path / "append"
    _create_video_file(append_dir / "back.mp4")

    main_video = _create_video_file(tmp_path / "main.mp4")
    output = tmp_path / "output.mp4"

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        affixer = VideoAffixer(append_dir=append_dir)
        result = affixer.prepend_append(main_video, output)

    assert result.output_path == output
    assert result.prepend_path is None
    assert result.append_path is not None


# ============================================================
# AC-2: 从配置目录随机选择后贴视频拼接在主视频之后
# ============================================================

def test_random_selection_from_directory(tmp_path):
    """从多文件目录中随机选择一个"""
    prepend_dir = tmp_path / "prepend"
    _create_video_file(prepend_dir / "a.mp4")
    _create_video_file(prepend_dir / "b.mp4")
    _create_video_file(prepend_dir / "c.mp4")

    main_video = _create_video_file(tmp_path / "main.mp4")
    output = tmp_path / "output.mp4"

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        # 固定随机选择 "b.mp4"
        with patch("random.choice", return_value=prepend_dir / "b.mp4"):
            affixer = VideoAffixer(prepend_dir=prepend_dir)
            result = affixer.prepend_append(main_video, output)

    assert result.prepend_path == prepend_dir / "b.mp4"


def test_both_dirs_random_selection(tmp_path):
    """前后贴各自从自己的目录中随机选择"""
    prepend_dir = tmp_path / "prepend"
    append_dir = tmp_path / "append"
    _create_video_file(prepend_dir / "p1.mp4")
    _create_video_file(prepend_dir / "p2.mp4")
    _create_video_file(append_dir / "a1.mp4")
    _create_video_file(append_dir / "a2.mp4")

    main_video = _create_video_file(tmp_path / "main.mp4")
    output = tmp_path / "output.mp4"

    chosen_prepend = prepend_dir / "p2.mp4"
    chosen_append = append_dir / "a1.mp4"

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        with patch("random.choice", side_effect=[chosen_prepend, chosen_append]):
            affixer = VideoAffixer(
                prepend_dir=prepend_dir,
                append_dir=append_dir,
            )
            result = affixer.prepend_append(main_video, output)

    assert result.prepend_path == chosen_prepend
    assert result.append_path == chosen_append


# ============================================================
# 边界条件
# ============================================================

def test_no_affix_dirs_returns_original_video(tmp_path):
    """无前后贴目录时直接返回主视频"""
    main_video = _create_video_file(tmp_path / "main.mp4")
    output = tmp_path / "output.mp4"

    affixer = VideoAffixer()
    result = affixer.prepend_append(main_video, output)

    assert result.output_path == main_video
    assert result.prepend_path is None
    assert result.append_path is None


def test_empty_prepend_dir_skips_prepend(tmp_path):
    """前贴目录为空时跳过前贴"""
    prepend_dir = tmp_path / "prepend"
    prepend_dir.mkdir()
    append_dir = tmp_path / "append"
    _create_video_file(append_dir / "back.mp4")

    main_video = _create_video_file(tmp_path / "main.mp4")
    output = tmp_path / "output.mp4"

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        affixer = VideoAffixer(
            prepend_dir=prepend_dir,
            append_dir=append_dir,
        )
        result = affixer.prepend_append(main_video, output)

    assert result.prepend_path is None
    assert result.append_path is not None


def test_empty_append_dir_skips_append(tmp_path):
    """后贴目录为空时跳过后贴"""
    prepend_dir = tmp_path / "prepend"
    _create_video_file(prepend_dir / "front.mp4")
    append_dir = tmp_path / "append"
    append_dir.mkdir()

    main_video = _create_video_file(tmp_path / "main.mp4")
    output = tmp_path / "output.mp4"

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        affixer = VideoAffixer(
            prepend_dir=prepend_dir,
            append_dir=append_dir,
        )
        result = affixer.prepend_append(main_video, output)

    assert result.prepend_path is not None
    assert result.append_path is None


def test_output_dir_created_automatically(tmp_path):
    """输出目录不存在时自动创建"""
    prepend_dir = tmp_path / "prepend"
    _create_video_file(prepend_dir / "front.mp4")
    main_video = _create_video_file(tmp_path / "main.mp4")
    output = tmp_path / "nested" / "output" / "final.mp4"

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        affixer = VideoAffixer(prepend_dir=prepend_dir)
        affixer.prepend_append(main_video, output)

    assert output.parent.exists()


def test_dir_with_only_non_video_files_skips(tmp_path):
    """目录中仅有非视频文件时视为空"""
    prepend_dir = tmp_path / "prepend"
    _create_video_file(prepend_dir / "readme.txt")
    _create_video_file(prepend_dir / "notes.md")

    main_video = _create_video_file(tmp_path / "main.mp4")
    output = tmp_path / "output.mp4"

    affixer = VideoAffixer(prepend_dir=prepend_dir)
    result = affixer.prepend_append(main_video, output)

    assert result.prepend_path is None


# ============================================================
# AC-3: 前后贴选择参数保存到任务日志
# ============================================================

def test_selection_params_logged(tmp_path):
    """前后贴选择参数记录到日志"""
    prepend_dir = tmp_path / "prepend"
    _create_video_file(prepend_dir / "front.mp4")
    main_video = _create_video_file(tmp_path / "main.mp4")
    output = tmp_path / "output.mp4"
    logger = MagicMock()

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        with patch("random.choice", return_value=prepend_dir / "front.mp4"):
            affixer = VideoAffixer(
                prepend_dir=prepend_dir,
                logger=logger,
            )
            affixer.prepend_append(main_video, output)

    # 验证日志包含选择信息
    info_calls = [c[1] for c in logger.info.call_args_list]
    messages = [str(c) for c in info_calls]
    assert any("front.mp4" in m for m in messages)


# ============================================================
# AC-4: 支持配置参数动态调整
# ============================================================

def test_config_can_be_updated(tmp_path):
    """前后贴目录可以动态调整"""
    dir_a = tmp_path / "dir_a"
    dir_b = tmp_path / "dir_b"
    _create_video_file(dir_a / "a1.mp4")
    _create_video_file(dir_b / "b1.mp4")

    main_video = _create_video_file(tmp_path / "main.mp4")
    output = tmp_path / "output.mp4"

    affixer = VideoAffixer(prepend_dir=dir_a)

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        with patch("random.choice", side_effect=[dir_a / "a1.mp4", dir_b / "b1.mp4"]):
            result1 = affixer.prepend_append(main_video, output)
            assert result1.prepend_path == dir_a / "a1.mp4"

            affixer.update_dirs(prepend_dir=dir_b)
            result2 = affixer.prepend_append(main_video, tmp_path / "output2.mp4")
            assert result2.prepend_path == dir_b / "b1.mp4"


def test_update_dirs_clears_previous(tmp_path):
    """update_dirs 可以清除之前的前后贴设置"""
    prepend_dir = tmp_path / "prepend"
    _create_video_file(prepend_dir / "front.mp4")
    main_video = _create_video_file(tmp_path / "main.mp4")

    affixer = VideoAffixer(prepend_dir=prepend_dir)

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        with patch("random.choice", return_value=prepend_dir / "front.mp4"):
            result1 = affixer.prepend_append(main_video, tmp_path / "out1.mp4")
            assert result1.prepend_path is not None

            affixer.update_dirs(prepend_dir=None)
            result2 = affixer.prepend_append(main_video, tmp_path / "out2.mp4")
            assert result2.prepend_path is None


# ============================================================
# AC-5: 关键流程节点记录日志
# ============================================================

def test_concat_logs_key_events(tmp_path):
    """拼接操作记录关键流程日志"""
    prepend_dir = tmp_path / "prepend"
    _create_video_file(prepend_dir / "front.mp4")
    main_video = _create_video_file(tmp_path / "main.mp4")
    output = tmp_path / "output.mp4"
    logger = MagicMock()

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        affixer = VideoAffixer(
            prepend_dir=prepend_dir,
            logger=logger,
        )
        affixer.prepend_append(main_video, output)

    logger.info.assert_called()


def test_no_affix_logs_skip_info(tmp_path):
    """无前后贴时记录跳过日志"""
    main_video = _create_video_file(tmp_path / "main.mp4")
    output = tmp_path / "output.mp4"
    logger = MagicMock()

    affixer = VideoAffixer(logger=logger)
    affixer.prepend_append(main_video, output)

    logger.info.assert_called()


# ============================================================
# 错误处理
# ============================================================

def test_ffmpeg_failure_raises_affix_error(tmp_path):
    """FFmpeg 非零退出码抛出 AffixError"""
    prepend_dir = tmp_path / "prepend"
    _create_video_file(prepend_dir / "front.mp4")
    main_video = _create_video_file(tmp_path / "main.mp4")
    output = tmp_path / "output.mp4"

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(1, stderr="concat error")
        affixer = VideoAffixer(prepend_dir=prepend_dir)

        with pytest.raises(AffixError, match="concat error"):
            affixer.prepend_append(main_video, output)


def test_prepend_dir_not_exists_skips(tmp_path):
    """前贴目录不存在时跳过"""
    main_video = _create_video_file(tmp_path / "main.mp4")
    output = tmp_path / "output.mp4"

    affixer = VideoAffixer(prepend_dir=Path("/nonexistent_dir_xyz"))
    result = affixer.prepend_append(main_video, output)

    assert result.prepend_path is None


def test_append_dir_not_exists_skips(tmp_path):
    """后贴目录不存在时跳过"""
    main_video = _create_video_file(tmp_path / "main.mp4")
    output = tmp_path / "output.mp4"

    affixer = VideoAffixer(append_dir=Path("/nonexistent_dir_xyz"))
    result = affixer.prepend_append(main_video, output)

    assert result.append_path is None
