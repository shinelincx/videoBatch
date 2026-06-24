# Tasks

## 基础设施层

- [x] **Task 1**: 初始化项目结构与环境
  - [x] 创建 `ecommerce-copy-agent/` 全部目录结构（`app/`, `static/`, `output/`）
  - [x] 编写 `requirements.txt`（langchain / langchain-openai / langchain-community / fastapi / uvicorn / edge-tts / python-dotenv / pydantic）
  - [x] 编写 `.env.example`（LLM_API_KEY / LLM_BASE_URL / LLM_MODEL / TTS_PROVIDER / DEFAULT_LANGUAGE）
  - [x] 实现 `app/__init__.py`
  - [x] 实现 `app/config.py`：dotenv 加载 + LANGUAGE_VOICE_MAP + LANGUAGE_SPEED_MAP + get_tts_voice(language) 工具函数
  - [x] 创建 `output/.gitkeep` 和 `static/.gitkeep`

- [x] **Task 2**: 定义数据模型
  - [x] 实现 `app/models.py`：ProductInput / MarketingCopy / AudioOutput / SubtitleEntry / SubtitleOutput / AgentResponse
  - [x] ProductInput 包含 `language: str = "zh"` 字段及基础校验（category/title 非空、duration > 0）

## 核心业务层

- [x] **Task 3**: 设计 Prompt 模板
  - [x] 实现 `app/prompts.py`：COPYWRITER_SYSTEM_PROMPT + COPYWRITER_HUMAN_TEMPLATE
  - [x] 实现 `estimate_word_count(duration, language) -> int` 字数换算函数
  - [x] 实现 `build_prompt_params(product_input) -> dict` 组装模板参数

- [x] **Task 4**: 实现 LangChain 文案生成链
  - [x] 实现 `app/agent.py`：ChatOpenAI（支持 base_url）+ ChatPromptTemplate + StrOutputParser 链
  - [x] 封装 `async generate_copy(product_input) -> MarketingCopy`（含重试逻辑）
  - [x] 同步封装 `generate_copy_sync(product_input)` 给 CLI 使用

- [x] **Task 5**: 实现 TTS 语音合成模块
  - [x] 实现 `app/tts.py`：`async text_to_speech(text, output_path, language) -> (AudioOutput, list)`
  - [x] 使用 `edge_tts.Communicate` + `stream()` 写入 .mp3 同时收集 WordBoundary 事件
  - [x] 实现 `LANGUAGE_VOICE_MAP` 查询逻辑，按 language 选择发音人
  - [x] 同步封装供 CLI 调用

- [x] **Task 6**: 实现 SRT 字幕生成模块
  - [x] 实现 `app/subtitle.py`：`generate_srt(word_boundaries, output_path) -> SubtitleOutput`
  - [x] 实现 WordBoundary 合并算法（≤20字 或 2~5秒规则）
  - [x] 实现 100纳秒 → `HH:MM:SS,mmm` 时间转换
  - [x] 输出标准 SRT 格式文件（序号 + 时间轴 + 文本 + 空行）

## 用户接入层

- [x] **Task 7**: 实现 FastAPI API 层
  - [x] 实现 `app/routes.py`：POST /api/generate / GET /api/audio/{filename} / GET /api/subtitle/{filename}
  - [x] POST 端点串联 agent → tts → subtitle 完整流水线
  - [x] 文件下载端点使用 FileResponse，设置正确 Content-Type
  - [x] 错误处理：LLM 失败 / TTS 失败返回 500 + 错误详情

- [x] **Task 8**: 实现 CLI 命令行入口
  - [x] 实现 `cli.py`：argparse 参数定义（-c/-t/-s/-d/-p/-o/-l/--output-dir）
  - [x] 调用同步版 agent.generate_copy_sync → tts.text_to_speech_sync → subtitle.generate_srt
  - [x] 终端格式化输出（文案 + 文件路径）
  - [x] 支持 `python cli.py -h` 帮助信息

- [x] **Task 9**: 实现 Web UI 前端
  - [x] 实现 `static/index.html`：左右分栏、表单（品类/标题/卖点/时长/平台下拉/风格下拉/语言下拉）、结果展示区、音频播放器占位
  - [x] 实现 `static/style.css`：CSS Grid 布局、响应式适配、播放器样式、loading spinner、toast 样式
  - [x] 实现 `static/app.js`：fetch POST /api/generate → 渲染结果 → audio.ontimeupdate 字幕同步逻辑 → 错误 toast

## 服务入口

- [x] **Task 10**: 实现 main.py 服务入口
  - [x] 实现 `main.py`：FastAPI 实例化 + 挂载 routes + 挂载 StaticFiles(directory="static", html=True) + CORS 配置
  - [x] 启动命令：`python main.py` → `uvicorn.run(app, host="0.0.0.0", port=8000)`

# Task Dependencies
- Task 3 依赖 Task 1（config）和 Task 2（models）
- Task 4 依赖 Task 3（prompts）
- Task 5 依赖 Task 1（config）
- Task 6 无依赖（仅依赖 Task 5 的 output 数据结构，可并行）
- Task 7 依赖 Task 4、Task 5、Task 6
- Task 8 依赖 Task 4、Task 5、Task 6
- Task 9 无代码依赖，可并行开发
- Task 10 依赖 Task 7、Task 9

可并行组：
  - Task 1 + Task 2 → 同步进行
  - Task 3 + Task 5 → 并行（仅依赖 Task 1）
  - Task 6 + Task 9 → 并行（前端独立）
  - Task 7 + Task 8 → 并行（共用底层模块）
