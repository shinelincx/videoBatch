import os, sys, asyncio, time, traceback
from dotenv import load_dotenv
os.chdir(os.path.dirname(os.path.abspath(__file__)))
load_dotenv()

RESULT = "test_final.txt"

with open(RESULT, "w", encoding="utf-8") as out:
    def log(msg):
        print(msg, flush=True)
        out.write(msg + "\n")
        out.flush()

    log("=== 全链路诊断 ===")

    try:
        log("\n--- STEP 1: LLM 文案生成 ---")
        from app.models import ProductInput
        from app.agent import generate_copy_sync
        pi = ProductInput(category="美妆", title="补水霜", selling_points=["锁水","抗皱"], duration=15, language="zh")
        t0 = time.time()
        copy = generate_copy_sync(pi)
        log(f"  PASS ({time.time()-t0:.1f}s): {copy.word_count}字")

        log("\n--- STEP 2: TTS 语音合成 ---")
        from app.tts import text_to_speech_sync
        t0 = time.time()
        audio, wb = text_to_speech_sync(copy.text, "output/test_final.mp3", pi.language)
        log(f"  PASS ({time.time()-t0:.1f}s): {audio.duration:.1f}s, {len(wb)} boundaries")

        log("\n--- STEP 3: SRT 字幕生成 ---")
        from app.subtitle import generate_srt
        t0 = time.time()
        sub = generate_srt(wb, "output/test_final.srt", pi.language)
        log(f"  PASS ({time.time()-t0:.1f}s): {len(sub.entries)} entries")

        log("\n--- STEP 4: FastAPI ASGI 全链路 ---")
        from main import app
        from httpx import AsyncClient, ASGITransport

        async def test_api():
            t = ASGITransport(app=app)
            async with AsyncClient(transport=t, base_url="http://test", timeout=120) as c:
                r = await c.post("/api/generate", json={
                    "category": "美妆", "title": "精华", "selling_points": ["补水"],
                    "duration": 10, "platform": "抖音", "tone": "简洁", "language": "zh"
                })
            log(f"  HTTP {r.status_code}")
            if r.status_code == 200:
                d = r.json()
                log(f"  copy: {d['marketing_copy']['text'][:60]}...")
                log(f"  audio: {d['audio']['file_path']}")
                log(f"  subtitle entries: {len(d['subtitle']['entries'])}")
            else:
                log(f"  ERROR: {r.text[:300]}")

        t0 = time.time()
        asyncio.run(test_api())
        log(f"  PASS ({time.time()-t0:.1f}s)")

        log("\n========== ALL PASSED ==========")
    except Exception:
        log(traceback.format_exc())
