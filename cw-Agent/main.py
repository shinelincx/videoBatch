from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes import router
from app.cleanup import clean_old_outputs
from app.config import AUTH_ENABLED
from app.auth import get_token_store
import uvicorn
import os

app = FastAPI(title="电商文案智能体", description="基于 LangChain 的电商营销文案生成服务")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

os.makedirs("output", exist_ok=True)
clean_old_outputs("output")

# 初始化 Token 存储，如果启用认证且无 token 则自动创建默认 token
if AUTH_ENABLED:
    store = get_token_store()
    if store.is_empty:
        default_token = store.create("默认管理员 token")
        print(f"[Auth] 已启用认证，默认管理员 token: {default_token}")
    else:
        print("[Auth] 已启用认证，已加载已有 tokens")

app.mount("/static", StaticFiles(directory="static"), name="static")

if os.path.exists("static/index.html"):
    app.mount("/", StaticFiles(directory="static", html=True), name="frontend")

print("Server starting on http://0.0.0.0:8000 ...")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
