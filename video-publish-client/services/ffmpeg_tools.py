from __future__ import annotations

import json
import math
import random
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any


PathLike = str | Path


@dataclass
class FFmpegRunResult:
    command: list[str]
    output_path: Path | None = None
    output_data: bytes | None = None
    stderr: str = ""


@dataclass
class ExtractedFrame:
    timestamp: float
    path: Path | None
    data: bytes | None


class FFmpegError(RuntimeError):
    def __init__(self, message: str, command: list[str] | None = None, stderr: str = "") -> None:
        super().__init__(message)
        self.command = command or []
        self.stderr = stderr


class FFmpegTools:
    """Small FFmpeg wrapper for stream-friendly video transformations.

    Every method uses subprocess pipes. If output_path is omitted, the processed
    media is returned from stdout in FFmpegRunResult.output_data.
    """

    def __init__(
        self,
        ffmpeg_bin: str = "ffmpeg",
        ffprobe_bin: str = "ffprobe",
        video_codec: str = "libx264",
        audio_codec: str = "aac",
        preset: str = "veryfast",
        crf: int = 20,
    ) -> None:
        self.ffmpeg_bin = ffmpeg_bin
        self.ffprobe_bin = ffprobe_bin
        self.video_codec = video_codec
        self.audio_codec = audio_codec
        self.preset = preset
        self.crf = crf

    def image_blur_background(
        self,
        input_video: PathLike | None,
        background_image: PathLike,
        output_path: PathLike | None = None,
        *,
        input_data: bytes | None = None,
        width: int = 1080,
        height: int = 1920,
        background_blur: float = 24,
        background_opacity: float = 0.82,
        foreground_scale: float = 0.88,
        fps: int | None = None,
    ) -> FFmpegRunResult:
        """Use a blurred image as video background and center the original video."""

        main_input = self._main_input_args(input_video, input_data)
        max_w = self._even(width * foreground_scale)
        max_h = self._even(height * foreground_scale)
        video_tail = self._video_tail("[v]", output_path, fps=fps)
        filter_complex = (
            f"[1:v]scale={width}:{height}:force_original_aspect_ratio=increase,"
            f"crop={width}:{height},gblur=sigma={background_blur},format=rgba,"
            f"colorchannelmixer=aa={self._clamp(background_opacity, 0, 1)}[bg];"
            f"color=c=black:s={width}x{height}[canvas];"
            f"[canvas][bg]overlay=format=auto[base];"
            f"[0:v]scale={max_w}:{max_h}:force_original_aspect_ratio=decrease,setsar=1[fg];"
            f"[base][fg]overlay=(W-w)/2:(H-h)/2:shortest=1,format=yuv420p[v]"
        )
        args = (
            main_input
            + ["-loop", "1", "-i", str(background_image), "-filter_complex", filter_complex]
            + video_tail.args
        )
        return self._run(args, input_data=input_data, output_path=video_tail.path, pipe_output=video_tail.pipe)

    def video_blur_background(
        self,
        input_video: PathLike | None,
        output_path: PathLike | None = None,
        *,
        input_data: bytes | None = None,
        width: int = 1080,
        height: int = 1920,
        background_blur: float = 24,
        foreground_scale: float = 0.86,
        background_brightness: float = -0.04,
        background_saturation: float = 0.9,
        fps: int | None = None,
    ) -> FFmpegRunResult:
        """Blur the original video as background and overlay a smaller original."""

        main_input = self._main_input_args(input_video, input_data)
        max_w = self._even(width * foreground_scale)
        max_h = self._even(height * foreground_scale)
        video_tail = self._video_tail("[v]", output_path, fps=fps)
        filter_complex = (
            "[0:v]split=2[bgsrc][fgsrc];"
            f"[bgsrc]scale={width}:{height}:force_original_aspect_ratio=increase,"
            f"crop={width}:{height},gblur=sigma={background_blur},"
            f"eq=brightness={background_brightness}:saturation={background_saturation}[bg];"
            f"[fgsrc]scale={max_w}:{max_h}:force_original_aspect_ratio=decrease,setsar=1[fg];"
            "[bg][fg]overlay=(W-w)/2:(H-h)/2:shortest=1,format=yuv420p[v]"
        )
        args = main_input + ["-filter_complex", filter_complex] + video_tail.args
        return self._run(args, input_data=input_data, output_path=video_tail.path, pipe_output=video_tail.pipe)

    def bouncing_blurred_watermark(
        self,
        input_video: PathLike | None,
        watermark_image: PathLike,
        output_path: PathLike | None = None,
        *,
        input_data: bytes | None = None,
        watermark_width: int = 220,
        opacity: float = 0.28,
        blur: float = 2.0,
        speed_x: float = 170,
        speed_y: float = 120,
        margin: int = 24,
        fps: int | None = None,
    ) -> FFmpegRunResult:
        """Overlay a blurred watermark that bounces around the frame."""

        main_input = self._main_input_args(input_video, input_data)
        video_tail = self._video_tail("[v]", output_path, fps=fps)
        range_x = f"max(W-w-{margin * 2}\\,1)"
        range_y = f"max(H-h-{margin * 2}\\,1)"
        x_expr = f"{margin}+abs(mod(t*{speed_x}\\,2*{range_x})-{range_x})"
        y_expr = f"{margin}+abs(mod(t*{speed_y}\\,2*{range_y})-{range_y})"
        filter_complex = (
            f"[1:v]scale={self._even(watermark_width)}:-2,gblur=sigma={blur},format=rgba,"
            f"colorchannelmixer=aa={self._clamp(opacity, 0, 1)}[wm];"
            f"[0:v][wm]overlay=x='{x_expr}':y='{y_expr}':shortest=1,format=yuv420p[v]"
        )
        args = (
            main_input
            + ["-loop", "1", "-i", str(watermark_image), "-filter_complex", filter_complex]
            + video_tail.args
        )
        return self._run(args, input_data=input_data, output_path=video_tail.path, pipe_output=video_tail.pipe)

    def create_slideshow(
        self,
        images: list[PathLike],
        output_path: PathLike | None = None,
        *,
        audio_path: PathLike | None = None,
        width: int = 1080,
        height: int = 1920,
        seconds_per_image: float = 2.5,
        transition: str = "fade",
        transition_seconds: float = 0.45,
        fps: int = 30,
    ) -> FFmpegRunResult:
        """Create a slideshow video from images, optionally with xfade transitions."""

        if not images:
            raise ValueError("images cannot be empty")
        transition_seconds = min(max(transition_seconds, 0), max(seconds_per_image - 0.05, 0))

        args: list[str] = []
        for image in images:
            args.extend(["-loop", "1", "-t", f"{seconds_per_image:.3f}", "-i", str(image)])
        audio_index = len(images) if audio_path else None
        if audio_path:
            args.extend(["-stream_loop", "-1", "-i", str(audio_path)])

        filters: list[str] = []
        for index in range(len(images)):
            filters.append(
                f"[{index}:v]scale={width}:{height}:force_original_aspect_ratio=increase,"
                f"crop={width}:{height},setsar=1,format=yuv420p[v{index}]"
            )

        if len(images) == 1:
            video_label = "[v]"
            filters.append(f"[v0]fps={fps},format=yuv420p{video_label}")
        elif transition_seconds > 0:
            last_label = "v0"
            step = seconds_per_image - transition_seconds
            for index in range(1, len(images)):
                out_label = f"x{index}"
                offset = step * index
                filters.append(
                    f"[{last_label}][v{index}]xfade=transition={transition}:"
                    f"duration={transition_seconds:.3f}:offset={offset:.3f}[{out_label}]"
                )
                last_label = out_label
            filters.append(f"[{last_label}]fps={fps},format=yuv420p[v]")
        else:
            concat_inputs = "".join(f"[v{index}]" for index in range(len(images)))
            filters.append(f"{concat_inputs}concat=n={len(images)}:v=1:a=0,fps={fps},format=yuv420p[v]")

        output_tail = self._pipe_or_file_output(output_path, fmt="mp4")
        total_duration = len(images) * seconds_per_image - max(len(images) - 1, 0) * transition_seconds
        args.extend(["-filter_complex", ";".join(filters), "-map", "[v]"])
        if audio_index is not None:
            args.extend(["-map", f"{audio_index}:a?", "-c:a", self.audio_codec, "-shortest"])
        args.extend(
            [
                "-t",
                f"{total_duration:.3f}",
                "-c:v",
                self.video_codec,
                "-preset",
                self.preset,
                "-crf",
                str(self.crf),
            ]
        )
        args.extend(output_tail.args)
        return self._run(args, output_path=output_tail.path, pipe_output=output_tail.pipe)

    def change_voice(
        self,
        input_media: PathLike | None,
        output_path: PathLike | None = None,
        *,
        input_data: bytes | None = None,
        pitch_semitones: float = 0,
        speed: float = 1.0,
        sample_rate: int = 44100,
    ) -> FFmpegRunResult:
        """Change voice pitch and/or speed while keeping the video stream copied."""

        if speed <= 0:
            raise ValueError("speed must be greater than 0")
        main_input = self._main_input_args(input_media, input_data)
        factor = math.pow(2, pitch_semitones / 12)
        tempo = speed / factor
        filters: list[str] = []
        if abs(pitch_semitones) > 0.001:
            filters.extend([f"asetrate={sample_rate}*{factor:.8f}", f"aresample={sample_rate}"])
        if abs(tempo - 1) > 0.001:
            filters.extend(self._atempo_filters(tempo))
        audio_filter = ",".join(filters) if filters else "anull"

        output_tail = self._pipe_or_file_output(output_path, fmt="mp4")
        args = (
            main_input
            + [
                "-map",
                "0:v?",
                "-map",
                "0:a?",
                "-filter:a",
                audio_filter,
                "-c:v",
                "copy",
                "-c:a",
                self.audio_codec,
            ]
            + output_tail.args
        )
        return self._run(args, input_data=input_data, output_path=output_tail.path, pipe_output=output_tail.pipe)

    def extract_random_frames(
        self,
        input_video: PathLike,
        output_dir: PathLike | None = None,
        *,
        count: int = 8,
        seed: int | None = None,
        image_format: str = "jpg",
        scale_width: int | None = None,
    ) -> list[ExtractedFrame]:
        """Randomly sample frames through image2pipe; optionally write them to disk."""

        if count <= 0:
            return []
        duration = self.duration(input_video)
        if duration <= 0:
            raise FFmpegError("Cannot read video duration")

        rng = random.Random(seed)
        start = min(0.25, duration / 4)
        end = max(start, duration - start)
        timestamps = sorted(rng.uniform(start, end) for _ in range(count))
        out_dir = Path(output_dir) if output_dir else None
        if out_dir:
            out_dir.mkdir(parents=True, exist_ok=True)

        frames: list[ExtractedFrame] = []
        codec = "mjpeg" if image_format.lower() in ("jpg", "jpeg") else "png"
        fmt = "image2pipe"
        for index, timestamp in enumerate(timestamps, start=1):
            vf_args: list[str] = []
            if scale_width:
                vf_args = ["-vf", f"scale={self._even(scale_width)}:-2"]
            args = [
                "-ss",
                f"{timestamp:.3f}",
                "-i",
                str(input_video),
                *vf_args,
                "-frames:v",
                "1",
                "-f",
                fmt,
                "-vcodec",
                codec,
                "pipe:1",
            ]
            result = self._run(args, pipe_output=True)
            path = None
            if out_dir:
                suffix = "jpg" if codec == "mjpeg" else "png"
                path = out_dir / f"frame_{index:03d}_{timestamp:.3f}.{suffix}"
                path.write_bytes(result.output_data or b"")
                frames.append(ExtractedFrame(timestamp=timestamp, path=path, data=None))
            else:
                frames.append(ExtractedFrame(timestamp=timestamp, path=None, data=result.output_data))
        return frames

    def make_visual_variant(
        self,
        input_video: PathLike | None,
        output_path: PathLike | None = None,
        *,
        input_data: bytes | None = None,
        crop_percent: float = 0.018,
        speed: float = 1.0,
        brightness: float = 0.01,
        contrast: float = 1.02,
        saturation: float = 1.04,
        noise_strength: float = 2.0,
        hflip: bool = False,
        fps: int | None = None,
    ) -> FFmpegRunResult:
        """Create a subtle visual/audio variant for legitimate derivative edits."""

        if speed <= 0:
            raise ValueError("speed must be greater than 0")
        main_input = self._main_input_args(input_video, input_data)
        vf: list[str] = []
        crop_percent = self._clamp(crop_percent, 0, 0.12)
        if crop_percent > 0:
            keep = 1 - crop_percent * 2
            vf.append(
                f"crop=iw*{keep:.6f}:ih*{keep:.6f}:iw*{crop_percent:.6f}:ih*{crop_percent:.6f},"
                f"scale=trunc(iw/{keep:.6f}/2)*2:trunc(ih/{keep:.6f}/2)*2"
            )
        if hflip:
            vf.append("hflip")
        vf.append(f"eq=brightness={brightness}:contrast={contrast}:saturation={saturation}")
        if noise_strength > 0:
            vf.append(f"noise=alls={noise_strength}:allf=t+u")
        if abs(speed - 1) > 0.001:
            vf.append(f"setpts=PTS/{speed:.8f}")
        if fps:
            vf.append(f"fps={fps}")
        vf.append("format=yuv420p")

        output_tail = self._pipe_or_file_output(output_path, fmt="mp4")
        args = main_input + ["-vf", ",".join(vf), "-map", "0:v:0", "-map", "0:a?"]
        if abs(speed - 1) > 0.001:
            args.extend(["-filter:a", ",".join(self._atempo_filters(speed))])
        args.extend(
            [
                "-c:v",
                self.video_codec,
                "-preset",
                self.preset,
                "-crf",
                str(self.crf),
                "-c:a",
                self.audio_codec,
            ]
        )
        args.extend(output_tail.args)
        return self._run(args, input_data=input_data, output_path=output_tail.path, pipe_output=output_tail.pipe)

    def probe(self, input_media: PathLike) -> dict[str, Any]:
        command = [
            self.ffprobe_bin,
            "-v",
            "error",
            "-show_format",
            "-show_streams",
            "-of",
            "json",
            str(input_media),
        ]
        completed = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
        if completed.returncode != 0:
            raise FFmpegError("ffprobe failed", command, completed.stderr.decode("utf-8", errors="ignore"))
        return json.loads(completed.stdout.decode("utf-8") or "{}")

    def duration(self, input_media: PathLike) -> float:
        data = self.probe(input_media)
        value = (data.get("format") or {}).get("duration")
        try:
            return float(value)
        except (TypeError, ValueError):
            return 0.0

    def ensure_available(self) -> None:
        for binary in (self.ffmpeg_bin, self.ffprobe_bin):
            completed = subprocess.run([binary, "-version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
            if completed.returncode != 0:
                raise FFmpegError(f"{binary} is not available", [binary, "-version"])

    def _run(
        self,
        args: list[str],
        *,
        input_data: bytes | None = None,
        output_path: Path | None = None,
        pipe_output: bool = False,
    ) -> FFmpegRunResult:
        command = [self.ffmpeg_bin, "-hide_banner", "-y", *args]
        process = subprocess.Popen(
            command,
            stdin=subprocess.PIPE if input_data is not None else subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        stdout, stderr = process.communicate(input_data)
        stderr_text = stderr.decode("utf-8", errors="ignore")
        if process.returncode != 0:
            raise FFmpegError("ffmpeg failed", command, stderr_text)
        return FFmpegRunResult(
            command=command,
            output_path=output_path,
            output_data=stdout if pipe_output else None,
            stderr=stderr_text,
        )

    def _main_input_args(self, input_media: PathLike | None, input_data: bytes | None) -> list[str]:
        if input_data is not None:
            return ["-i", "pipe:0"]
        if input_media is None:
            raise ValueError("input_media is required when input_data is not provided")
        return ["-i", str(input_media)]

    @dataclass
    class _OutputTail:
        args: list[str]
        path: Path | None
        pipe: bool

    def _pipe_or_file_output(self, output_path: PathLike | None, *, fmt: str) -> _OutputTail:
        if output_path is not None:
            return self._OutputTail(args=[str(output_path)], path=Path(output_path), pipe=False)
        if fmt == "mp4":
            return self._OutputTail(
                args=["-f", "mp4", "-movflags", "frag_keyframe+empty_moov", "pipe:1"],
                path=None,
                pipe=True,
            )
        return self._OutputTail(args=["-f", fmt, "pipe:1"], path=None, pipe=True)

    def _video_tail(self, video_label: str, output_path: PathLike | None, *, fps: int | None = None) -> _OutputTail:
        output = self._pipe_or_file_output(output_path, fmt="mp4")
        args = ["-map", video_label, "-map", "0:a?"]
        if fps:
            args.extend(["-r", str(fps)])
        args.extend(
            [
                "-c:v",
                self.video_codec,
                "-preset",
                self.preset,
                "-crf",
                str(self.crf),
                "-c:a",
                self.audio_codec,
                "-shortest",
            ]
        )
        args.extend(output.args)
        return self._OutputTail(args=args, path=output.path, pipe=output.pipe)

    def _atempo_filters(self, tempo: float) -> list[str]:
        if tempo <= 0:
            raise ValueError("tempo must be greater than 0")
        values: list[float] = []
        current = tempo
        while current > 2.0:
            values.append(2.0)
            current /= 2.0
        while current < 0.5:
            values.append(0.5)
            current /= 0.5
        values.append(current)
        return [f"atempo={value:.8f}" for value in values]

    def _even(self, value: float) -> int:
        return max(2, int(value) // 2 * 2)

    def _clamp(self, value: float, min_value: float, max_value: float) -> float:
        return max(min_value, min(value, max_value))
