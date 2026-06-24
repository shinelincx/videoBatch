"""Shared output settings for generated MP4 videos."""

WIDTH = 1080
HEIGHT = 1920
FPS = 30
VIDEO_BITRATE = "800k"
VIDEO_MINRATE = "516k"
VIDEO_BUFSIZE = "1032k"
AUDIO_BITRATE = "128k"
BACKGROUND_COLOR = "black"

OUTPUT_SIZE = (WIDTH, HEIGHT)


def normalize_video_filter(fps: int = FPS) -> str:
    """Scale media into a 9:16 canvas without cropping, padding empty space."""
    return (
        "scale={w}:{h}:force_original_aspect_ratio=decrease,"
        "pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:color={color},"
        "setsar=1,fps={fps}"
    ).format(w=WIDTH, h=HEIGHT, color=BACKGROUND_COLOR, fps=fps)


def video_encoding_args(codec: str = "libx264", fps: int = FPS) -> list[str]:
    return [
        "-c:v", codec,
        "-b:v", VIDEO_BITRATE,
        "-minrate", VIDEO_MINRATE,
        "-bufsize", VIDEO_BUFSIZE,
        "-r", str(fps),
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
    ]


def audio_encoding_args(codec: str = "aac") -> list[str]:
    return [
        "-c:a", codec,
        "-b:a", AUDIO_BITRATE,
    ]
