import os, sys, asyncio, json
os.chdir(os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv()

from main import app
from httpx import AsyncClient, ASGITransport

async def main():
    results = []
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test", timeout=120) as client:
        payload = {
            "category": "美妆",
            "title": "补水精华液",
            "selling_points": ["瞬效补水", "天然成分"],
            "duration": 15,
            "platform": "小红书",
            "tone": "温情",
            "language": "zh",
        }
        results.append("POST /api/generate ...")
        resp = await client.post("/api/generate", json=payload)
        results.append(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            results.append(f"text: {data['marketing_copy']['text'][:80]}...")
            results.append(f"words: {data['marketing_copy']['word_count']}")
            results.append(f"audio: {data['audio']['file_path']}")
            results.append(f"subtitle entries: {len(data['subtitle']['entries'])}")
        else:
            results.append(f"Error: {resp.text[:200]}")

    with open("test_result.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(results))

asyncio.run(main())
