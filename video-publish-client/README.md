# video-publish-client

wxPython desktop client for Windows and macOS.

## Run

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -e .
python main.py
```

The default API base URL is `http://127.0.0.1:8080`. You can change it on the login page.

## Task logs

The main client window shows the task log only. Logs are persisted under the application data directory in daily files:

```text
logs/YYYY-MM-DD.log
```

## FFmpeg tools

The client provides a pipe-based FFmpeg helper at `services.ffmpeg_tools`.

```python
from services import FFmpegTools

ffmpeg = FFmpegTools()
ffmpeg.ensure_available()

ffmpeg.image_blur_background("input.mp4", "background.jpg", "out-image-bg.mp4")
ffmpeg.video_blur_background("input.mp4", "out-video-bg.mp4")
ffmpeg.bouncing_blurred_watermark("input.mp4", "watermark.png", "out-watermark.mp4")
ffmpeg.create_slideshow(["1.jpg", "2.jpg", "3.jpg"], "out-slideshow.mp4")
ffmpeg.change_voice("input.mp4", "out-voice.mp4", pitch_semitones=2)
ffmpeg.extract_random_frames("input.mp4", "frames", count=8)
ffmpeg.make_visual_variant("input.mp4", "out-variant.mp4")
```

If `output_path` is omitted, processed media is returned in `FFmpegRunResult.output_data`.

Run the FFmpeg integration tests with the local assets in `/Users/luqx/Downloads/video`:

```bash
python -m unittest discover -s tests -v
```

Generated videos and frames are written to `tests/video`.
