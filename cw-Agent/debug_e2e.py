import os, sys, json, asyncio, time
from dotenv import load_dotenv
os.chdir(os.path.dirname(os.path.abspath(__file__)))
load_dotenv()

results = []

def log(msg):
    results.append(msg)

log("=== 端到端全链路测试 ===")

log("[1/5] 配置加载...")
from app.config import LLM_API_KEY, LLM_BASE_URL, LLM_MODEL
log(f"  model={LLM_MODEL}")

log("[2/5] 文案生成...")
from app.models import ProductInput
from app.agent import generate_copy_sync

pi = ProductInput(
    category="美妆", title="三重玻尿酸补水霜",
    selling_points=["48小时锁水", "敏感肌可用", "买二送一"],
    duration=30, platform="抖音", tone="热情", language="zh",
)
start = time.time()
try:
    copy = generate_copy_sync(pi)
    log(f"  OK ({time.time()-start:.1f}s): {copy.word_count}字")
except Exception as e:
    log(f"  FAIL: {type(e).__name__}: {e}")
    with open("test_result.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(results))
    sys.exit(1)

log("[3/5] TTS语音合成...")
from app.tts import text_to_speech_sync
timestamp = time.strftime("%Y%m%d_%H%M%S")
audio_path = f"output/{timestamp}_audio.mp3"
start = time.time()
try:
    audio_output, word_boundaries = text_to_speech_sync(copy.text, audio_path, pi.language)
    log(f"  OK ({time.time()-start:.1f}s): {audio_output.duration:.1f}秒, {len(word_boundaries)}词")
except Exception as e:
    log(f"  FAIL: {type(e).__name__}: {e}")
    with open("test_result.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(results))
    sys.exit(1)

log("[4/5] SRT字幕生成...")
from app.subtitle import generate_srt
srt_path = f"output/{timestamp}_subtitle.srt"
try:
    subtitle_output = generate_srt(word_boundaries, srt_path, pi.language)
    log(f"  OK: {len(subtitle_output.entries)}条字幕")
except Exception as e:
    log(f"  FAIL: {type(e).__name__}: {e}")
    with open("test_result.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(results))
    sys.exit(1)

log("[5/5] AgentResponse...")
from app.models import AgentResponse
resp = AgentResponse(input=pi, marketing_copy=copy, audio=audio_output, subtitle=subtitle_output)
resp_json = resp.model_dump()
log(f"  subtitle entries count: {len(resp_json['subtitle']['entries'])}")

log("ALL PASSED!")
with open("test_result.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(results))
