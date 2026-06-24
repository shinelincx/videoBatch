import random
from pathlib import Path
from unittest.mock import MagicMock, patch

from video_batch.reference_video import ReferenceVideoError, ReferenceVideoProcessor


def _mock_run(returncode: int = 0, stderr: str = ""):
    result = MagicMock()
    result.returncode = returncode
    result.stderr = stderr
    return result


def test_process_calls_ffmpeg_with_filter_complex(tmp_path):
    """处理参考视频时调用 FFmpeg 并传递 -filter_complex 参数"""
    ref_video = tmp_path / "ref.mp4"
    ref_video.write_text("fake")
    output = tmp_path / "output.mp4"

    processor = ReferenceVideoProcessor()

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        processor.process(
            reference_video=ref_video,
            output_path=output,
            video_filters=["boxblur=1.5:1"],
            overlay_filters=[],
            overlay_inputs=[],
            audio_filters=[],
            audio_inputs=[],
        )

    args = mock_run.call_args[0][0]
    assert "ffmpeg" in args[0]
    assert "-y" in args
    assert "-filter_complex" in args
    assert "boxblur" in " ".join(args)
    assert str(ref_video) in args
    assert str(output) in args


def test_process_returns_output_path(tmp_path):
    """处理成功返回输出路径"""
    ref_video = tmp_path / "ref.mp4"
    ref_video.write_text("fake")
    output = tmp_path / "output.mp4"

    processor = ReferenceVideoProcessor()

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        result = processor.process(
            reference_video=ref_video,
            output_path=output,
            video_filters=[],
            overlay_filters=[],
            overlay_inputs=[],
            audio_filters=[],
            audio_inputs=[],
        )

    assert result == output


def test_output_dir_created_automatically(tmp_path):
    """输出目录不存在时自动创建"""
    ref_video = tmp_path / "ref.mp4"
    ref_video.write_text("fake")
    output_dir = tmp_path / "nested" / "out"
    output = output_dir / "video.mp4"

    processor = ReferenceVideoProcessor()

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        processor.process(
            reference_video=ref_video,
            output_path=output,
            video_filters=[],
            overlay_filters=[],
            overlay_inputs=[],
            audio_filters=[],
            audio_inputs=[],
        )

    assert output_dir.exists()


def test_ffmpeg_failure_raises_error(tmp_path):
    """FFmpeg 非零退出码抛出 ReferenceVideoError"""
    ref_video = tmp_path / "ref.mp4"
    ref_video.write_text("fake")
    output = tmp_path / "out.mp4"

    processor = ReferenceVideoProcessor()

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(1, stderr="encoder error")
        try:
            processor.process(
                reference_video=ref_video,
                output_path=output,
                video_filters=[],
                overlay_filters=[],
                overlay_inputs=[],
                audio_filters=[],
                audio_inputs=[],
            )
            assert False, "should have raised"
        except ReferenceVideoError as e:
            assert "encoder error" in str(e)


def test_video_filters_chained_in_filter_complex(tmp_path):
    """多个视频滤镜在 filter_complex 中正确链式连接"""
    ref_video = tmp_path / "ref.mp4"
    ref_video.write_text("fake")
    output = tmp_path / "out.mp4"

    processor = ReferenceVideoProcessor()

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        processor.process(
            reference_video=ref_video,
            output_path=output,
            video_filters=["select='not(eq(n,5))'", "boxblur=1.5:1"],
            overlay_filters=[],
            overlay_inputs=[],
            audio_filters=[],
            audio_inputs=[],
        )

    args = mock_run.call_args[0][0]
    fc = " ".join(args)
    assert "select" in fc
    assert "boxblur" in fc


def test_overlay_filters_included_in_complex(tmp_path):
    """叠加滤镜被包含在 filter_complex 中"""
    ref_video = tmp_path / "ref.mp4"
    ref_video.write_text("fake")
    output = tmp_path / "out.mp4"

    processor = ReferenceVideoProcessor()

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        processor.process(
            reference_video=ref_video,
            output_path=output,
            video_filters=[],
            overlay_filters=["drawtext=text='test':fontsize=24:fontcolor=white"],
            overlay_inputs=[],
            audio_filters=[],
            audio_inputs=[],
        )

    args = mock_run.call_args[0][0]
    fc = " ".join(args)
    assert "drawtext" in fc


def test_watermark_output_connected_when_video_filters_exist(tmp_path):
    """视频滤镜叠加水印时，水印输出标签不能悬空"""
    ref_video = tmp_path / "ref.mp4"
    ref_video.write_text("fake")
    output = tmp_path / "out.mp4"
    wm = tmp_path / "wm.png"
    wm.write_text("fake")

    processor = ReferenceVideoProcessor()

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        processor.process(
            reference_video=ref_video,
            output_path=output,
            video_filters=["subtitles=filename='generated.srt'"],
            overlay_filters=[
                "[1:v]format=rgba,colorchannelmixer=aa=0.5[wm];"
                "[v_base][wm]overlay=x=10:y=10[wm_out]",
            ],
            overlay_inputs=["-i", str(wm)],
            audio_filters=[],
            audio_inputs=[],
    )

    cmd_str = " ".join(mock_run.call_args[0][0])
    assert "[wm_out]scale=1080:1920:force_original_aspect_ratio=decrease" in cmd_str
    assert "-map [vout]" in cmd_str
    assert "overlay=x=10:y=10" in cmd_str


def test_watermark_output_connected_with_subtitle_bgm_and_replacement_audio(tmp_path):
    """字幕、水印、BGM 和生成音频共存时，水印流不能悬空"""
    ref_video = tmp_path / "ref.mp4"
    ref_video.write_text("fake")
    output = tmp_path / "out.mp4"
    subtitle = tmp_path / "generated.srt"
    subtitle.write_text("1\n00:00:00,000 --> 00:00:01,000\ntext\n", encoding="utf-8")
    wm = tmp_path / "wm.png"
    wm.write_text("fake")
    bgm = tmp_path / "bgm.mp3"
    bgm.write_text("fake bgm")
    mp3 = tmp_path / "generated.mp3"
    mp3.write_text("fake audio")

    processor = ReferenceVideoProcessor()

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        processor.process(
            reference_video=ref_video,
            output_path=output,
            video_filters=[],
            overlay_filters=[
                "[1:v]format=rgba,colorchannelmixer=aa=0.5[wm];"
                "[v_base][wm]overlay=x=10:y=10[wm_out]",
            ],
            overlay_inputs=["-i", str(wm)],
            audio_filters=[
                "[1:a]volume=0.200[bgm]",
                "[0:a][bgm]amix=inputs=2:duration=first",
            ],
            audio_inputs=["-i", str(bgm)],
            subtitle_srt_path=subtitle,
            replacement_audio_path=mp3,
    )

    cmd_str = " ".join(mock_run.call_args[0][0])
    assert "[wm_out]scale=1080:1920:force_original_aspect_ratio=decrease" in cmd_str
    assert "-map [vout]" in cmd_str
    assert "overlay=x=10:y=10[wm_out];" in cmd_str
    assert "[3:a][bgm]amix=inputs=2:duration=first[aout]" in cmd_str
    assert "-map [aout]" in cmd_str


def test_overlay_extra_inputs_added_to_command(tmp_path):
    """叠加元素的额外输入（如水印 PNG）被添加到 FFmpeg 命令"""
    ref_video = tmp_path / "ref.mp4"
    ref_video.write_text("fake")
    output = tmp_path / "out.mp4"
    wm = tmp_path / "wm.png"
    wm.write_text("fake")

    processor = ReferenceVideoProcessor()

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        processor.process(
            reference_video=ref_video,
            output_path=output,
            video_filters=[],
            overlay_filters=[],
            overlay_inputs=["-i", str(wm)],
            audio_filters=[],
            audio_inputs=[],
        )

    args = mock_run.call_args[0][0]
    assert str(wm) in args


def test_audio_filters_included_in_complex(tmp_path):
    """音频滤镜被包含在 filter_complex 中"""
    ref_video = tmp_path / "ref.mp4"
    ref_video.write_text("fake")
    output = tmp_path / "out.mp4"

    processor = ReferenceVideoProcessor()

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        processor.process(
            reference_video=ref_video,
            output_path=output,
            video_filters=[],
            overlay_filters=[],
            overlay_inputs=[],
            audio_filters=["atempo=1.05"],
            audio_inputs=[],
        )

    args = mock_run.call_args[0][0]
    fc = " ".join(args)
    assert "atempo" in fc


def test_audio_extra_inputs_added_to_command(tmp_path):
    """音频额外输入（如 BGM 文件）被添加到 FFmpeg 命令"""
    ref_video = tmp_path / "ref.mp4"
    ref_video.write_text("fake")
    output = tmp_path / "out.mp4"
    bgm = tmp_path / "bgm.mp3"
    bgm.write_text("fake")

    processor = ReferenceVideoProcessor()

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        processor.process(
            reference_video=ref_video,
            output_path=output,
            video_filters=[],
            overlay_filters=[],
            overlay_inputs=[],
            audio_filters=[],
            audio_inputs=["-i", str(bgm)],
        )

    args = mock_run.call_args[0][0]
    assert str(bgm) in args


def test_output_uses_h264_and_aac_codecs(tmp_path):
    """输出使用 H.264 视频编码和 AAC 音频编码"""
    ref_video = tmp_path / "ref.mp4"
    ref_video.write_text("fake")
    output = tmp_path / "out.mp4"

    processor = ReferenceVideoProcessor()

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        processor.process(
            reference_video=ref_video,
            output_path=output,
            video_filters=[],
            overlay_filters=[],
            overlay_inputs=[],
            audio_filters=[],
            audio_inputs=[],
        )

    args = mock_run.call_args[0][0]
    assert "-c:v" in args
    vid_idx = args.index("-c:v")
    assert args[vid_idx + 1] == "libx264"
    assert "-c:a" in args
    aud_idx = args.index("-c:a")
    assert args[aud_idx + 1] == "aac"


def test_output_uses_vertical_canvas_and_audio_bitrate(tmp_path):
    """参考视频输出为 1080x1920 竖版，并设置音视频码率"""
    ref_video = tmp_path / "ref.mp4"
    ref_video.write_text("fake")
    output = tmp_path / "out.mp4"

    processor = ReferenceVideoProcessor()

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        processor.process(
            reference_video=ref_video,
            output_path=output,
            video_filters=["boxblur=1.5:1"],
            overlay_filters=[],
            overlay_inputs=[],
            audio_filters=[],
            audio_inputs=[],
        )

    args = mock_run.call_args[0][0]
    cmd_str = " ".join(args)
    assert "scale=1080:1920:force_original_aspect_ratio=decrease" in cmd_str
    assert "pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black" in cmd_str
    assert "fps=30" in cmd_str
    assert "-b:v" in args
    assert args[args.index("-b:v") + 1] == "800k"
    assert "-minrate" in args
    assert args[args.index("-minrate") + 1] == "516k"
    assert "-b:a" in args
    assert args[args.index("-b:a") + 1] == "128k"


def test_output_fps_configurable(tmp_path):
    """输出帧率可配置，默认为 30fps"""
    ref_video = tmp_path / "ref.mp4"
    ref_video.write_text("fake")
    output = tmp_path / "out.mp4"

    processor = ReferenceVideoProcessor()

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        processor.process(
            reference_video=ref_video,
            output_path=output,
            video_filters=[],
            overlay_filters=[],
            overlay_inputs=[],
            audio_filters=[],
            audio_inputs=[],
            fps=30,
        )

    args = mock_run.call_args[0][0]
    r_idx = args.index("-r")
    assert args[r_idx + 1] == "30"


def test_logs_key_events(tmp_path):
    """关键流程节点记录日志"""
    ref_video = tmp_path / "ref.mp4"
    ref_video.write_text("fake")
    output = tmp_path / "out.mp4"
    logger = MagicMock()

    processor = ReferenceVideoProcessor(logger=logger)

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        processor.process(
            reference_video=ref_video,
            output_path=output,
            video_filters=["boxblur=1.5:1"],
            overlay_filters=[],
            overlay_inputs=[],
            audio_filters=[],
            audio_inputs=[],
        )

    logger.info.assert_called()


def test_all_effects_combined(tmp_path):
    """所有效果（画面随机化 + 叠加 + 音频）同时启用时正确组合"""
    ref_video = tmp_path / "ref.mp4"
    ref_video.write_text("fake")
    output = tmp_path / "out.mp4"
    wm = tmp_path / "wm.png"
    wm.write_text("fake")
    bgm = tmp_path / "bgm.mp3"
    bgm.write_text("fake")

    processor = ReferenceVideoProcessor()

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        processor.process(
            reference_video=ref_video,
            output_path=output,
            video_filters=["select='not(eq(n\\,5))'", "setpts=N/FRAME_RATE/TB", "boxblur=1.5:1"],
            overlay_filters=["drawtext=text='test':fontsize=24:fontcolor=white"],
            overlay_inputs=["-i", str(wm)],
            audio_filters=["atempo=1.05"],
            audio_inputs=["-i", str(bgm)],
        )

    args = mock_run.call_args[0][0]
    cmd_str = " ".join(args)

    assert "-i" in args
    assert str(ref_video) in args
    assert str(wm) in args
    assert str(bgm) in args

    assert "select" in cmd_str
    assert "boxblur" in cmd_str
    assert "drawtext" in cmd_str
    assert "atempo" in cmd_str

    assert "-filter_complex" in args
    assert "-c:v" in args
    assert "-c:a" in args
    assert "-r" in args


def test_subtitle_srt_adds_subtitles_filter(tmp_path):
    """SRT 字幕文件通过 subtitles 滤镜加入视频处理命令"""
    ref_video = tmp_path / "ref.mp4"
    ref_video.write_text("fake")
    subtitle = tmp_path / "generated.srt"
    subtitle.write_text("1\n00:00:00,000 --> 00:00:01,000\n字幕\n", encoding="utf-8")
    output = tmp_path / "out.mp4"

    processor = ReferenceVideoProcessor()

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        processor.process(
            reference_video=ref_video,
            output_path=output,
            video_filters=[],
            overlay_filters=[],
            overlay_inputs=[],
            audio_filters=[],
            audio_inputs=[],
            subtitle_srt_path=subtitle,
        )

    cmd_str = " ".join(mock_run.call_args[0][0])
    assert "subtitles=" in cmd_str
    assert "generated.srt" in cmd_str
    assert "force_style=" in cmd_str
    assert "Fontsize=9" in cmd_str
    assert "WrapStyle=2" in cmd_str


def test_replacement_audio_maps_mp3_instead_of_original_audio(tmp_path):
    """替换音频启用时，输出音轨显式映射到生成的 MP3 输入"""
    ref_video = tmp_path / "ref.mp4"
    ref_video.write_text("fake")
    mp3 = tmp_path / "generated.mp3"
    mp3.write_text("fake audio")
    output = tmp_path / "out.mp4"

    processor = ReferenceVideoProcessor()

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        processor.process(
            reference_video=ref_video,
            output_path=output,
            video_filters=[],
            overlay_filters=[],
            overlay_inputs=[],
            audio_filters=[],
            audio_inputs=[],
            replacement_audio_path=mp3,
        )

    args = mock_run.call_args[0][0]
    assert str(mp3) in args
    assert "-map" in args
    map_values = [
        args[i + 1]
        for i, value in enumerate(args)
        if value == "-map" and i + 1 < len(args)
    ]
    assert "1:a:0" in map_values
    assert "0:a" not in map_values


def test_replacement_audio_preserves_bgm_mix(tmp_path):
    """替换音频时保留配置的 BGM，并用生成 MP3 替代原视频音轨参与混音"""
    ref_video = tmp_path / "ref.mp4"
    ref_video.write_text("fake")
    bgm = tmp_path / "bgm.mp3"
    bgm.write_text("fake bgm")
    mp3 = tmp_path / "generated.mp3"
    mp3.write_text("fake audio")
    output = tmp_path / "out.mp4"

    processor = ReferenceVideoProcessor()

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        processor.process(
            reference_video=ref_video,
            output_path=output,
            video_filters=[],
            overlay_filters=[],
            overlay_inputs=[],
            audio_filters=[
                "[1:a]volume=0.200[bgm]",
                "[0:a][bgm]amix=inputs=2:duration=first",
            ],
            audio_inputs=["-i", str(bgm)],
            replacement_audio_path=mp3,
        )

    args = mock_run.call_args[0][0]
    cmd_str = " ".join(args)
    assert str(bgm) in args
    assert str(mp3) in args
    assert "[1:a]volume=0.200[bgm]" in cmd_str
    assert "[2:a][bgm]amix=inputs=2:duration=first[aout]" in cmd_str
    assert "-map [aout]" in cmd_str
    assert "[0:a][bgm]amix" not in cmd_str


def test_loop_count_repeats_bgm_and_replacement_audio_inputs(tmp_path):
    """loop_count>1 时，BGM 和生成音频输入也要循环到后续轮次"""
    ref_video = tmp_path / "ref.mp4"
    ref_video.write_text("fake")
    bgm = tmp_path / "bgm.mp3"
    bgm.write_text("fake bgm")
    mp3 = tmp_path / "generated.mp3"
    mp3.write_text("fake audio")
    output = tmp_path / "out.mp4"

    processor = ReferenceVideoProcessor()

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        processor.process(
            reference_video=ref_video,
            output_path=output,
            video_filters=[],
            overlay_filters=[],
            overlay_inputs=[],
            audio_filters=[
                "[1:a]volume=0.200[bgm]",
                "[0:a][bgm]amix=inputs=2:duration=first",
            ],
            audio_inputs=["-i", str(bgm)],
            loop_count=3,
            replacement_audio_path=mp3,
        )

    args = mock_run.call_args[0][0]
    bgm_idx = args.index(str(bgm))
    mp3_idx = args.index(str(mp3))
    assert args[bgm_idx - 3:bgm_idx] == ["-stream_loop", "-1", "-i"]
    assert args[mp3_idx - 3:mp3_idx] == ["-stream_loop", "2", "-i"]


def test_loop_count_expands_subtitle_srt_for_repeated_video(tmp_path):
    """loop_count>1 时，SRT 字幕时间轴要复制到后续轮次"""
    ref_video = tmp_path / "ref.mp4"
    ref_video.write_text("fake")
    subtitle = tmp_path / "generated.srt"
    subtitle.write_text(
        "1\n00:00:01,000 --> 00:00:02,500\nhello\n",
        encoding="utf-8",
    )
    output = tmp_path / "out.mp4"

    ffprobe_result = _mock_run(0)
    ffprobe_result.stdout = '{"format":{"duration":"10.0"}}'
    ffmpeg_result = _mock_run(0)

    processor = ReferenceVideoProcessor()

    with patch("subprocess.run") as mock_run:
        mock_run.side_effect = [ffprobe_result, ffmpeg_result]
        processor.process(
            reference_video=ref_video,
            output_path=output,
            video_filters=[],
            overlay_filters=[],
            overlay_inputs=[],
            audio_filters=[],
            audio_inputs=[],
            loop_count=2,
            subtitle_srt_path=subtitle,
        )

    args = mock_run.call_args_list[-1][0][0]
    cmd_str = " ".join(args)
    looped_srt = output.with_name("%s_looped.srt" % subtitle.stem)
    assert str(looped_srt).replace("\\", "/").replace(":", r"\:") in cmd_str
    content = looped_srt.read_text(encoding="utf-8")
    assert "00:00:01,000 --> 00:00:02,500" in content
    assert "00:00:11,000 --> 00:00:12,500" in content


def test_generated_full_loop_media_is_not_expanded_or_stream_looped(tmp_path):
    ref_video = tmp_path / "ref.mp4"
    ref_video.write_text("fake")
    subtitle = tmp_path / "generated.srt"
    subtitle.write_text(
        "1\n00:00:01,000 --> 00:00:02,500\nhello\n",
        encoding="utf-8",
    )
    mp3 = tmp_path / "generated.mp3"
    mp3.write_text("fake audio")
    output = tmp_path / "out.mp4"

    processor = ReferenceVideoProcessor()

    with patch("subprocess.run") as mock_run:
        mock_run.return_value = _mock_run(0)
        processor.process(
            reference_video=ref_video,
            output_path=output,
            video_filters=[],
            overlay_filters=[],
            overlay_inputs=[],
            audio_filters=[],
            audio_inputs=[],
            loop_count=2,
            subtitle_srt_path=subtitle,
            replacement_audio_path=mp3,
            repeat_subtitle_and_replacement_audio=False,
        )

    assert mock_run.call_count == 1
    args = mock_run.call_args[0][0]
    cmd_str = " ".join(args)
    looped_srt = output.with_name("%s_looped.srt" % subtitle.stem)
    assert not looped_srt.exists()
    assert str(subtitle).replace("\\", "/").replace(":", r"\:") in cmd_str

    ref_idx = args.index(str(ref_video))
    mp3_idx = args.index(str(mp3))
    assert args[ref_idx - 3:ref_idx] == ["-stream_loop", "1", "-i"]
    assert args[mp3_idx - 1] == "-i"
    assert args[mp3_idx - 3:mp3_idx] != ["-stream_loop", "1", "-i"]
