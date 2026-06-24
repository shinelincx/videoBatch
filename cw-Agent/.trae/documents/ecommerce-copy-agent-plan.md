# 电商文案智能体 — 实施计划

## 一、项目概述

基于 LangChain 框架构建一套电商文案智能体，用户输入产品品类、标题、卖点、时长等信息后，自动生成营销文案文本及对应音频文件。

---

## 二、技术选型

| 层面 | 选型 | 说明 |
|------|------|------|
| 编程语言 | Python 3.10+ | 与 LangChain 生态高度契合 |
| Agent 框架 | LangChain + LangChain Community | 链式调用、Prompt 模板、输出解析 |
| LLM | OpenAI API（兼容接口） | 支持 GPT-4o-mini / 本地 Ollama 模型，通过环境变量切换 |
| TTS 语音合成 | Edge TTS（默认）+ ElevenLabs（可选） | Edge TTS 免费无需 API Key，支持词级时间戳与多语言语音；ElevenLabs 高质量 |
| 字幕生成 | Edge TTS WordBoundary 事件 | 利用 TTS 返回的词级时间戳生成 SRT 字幕，与音频严格同步 |
| API 服务 | FastAPI + Uvicorn | 高性能异步 Web 框架 |
| CLI 模式 | argparse（Python 标准库） | 命令行一键调用，无需启动服务 |
| Web UI 前端 | 原生 HTML5 + CSS3 + Vanilla JS | 零框架依赖的 SPA，含音频播放器 + 字幕叠加显示 |
| 多语言 | LLM Prompt 语言约束 + Edge TTS 多语言语音 | 支持中文/英文/日文/韩文等，LLM 生成对应语言文案，TTS 匹配语种发音人 |
| 配置管理 | python-dotenv + .env 文件 | 环境变量统一管理 |
| 依赖管理 | pip + requirements.txt | 轻量依赖声明 |

---

## 三、领域模型

### 3.1 核心实体

```
ProductInput（聚合根）
├── category       : str    # 产品品类（如：美妆、数码、食品）
├── title          : str    # 产品标题
├── selling_points : list   # 核心卖点列表
├── duration       : int    # 目标文案时长（秒），用于估算字数
├── platform       : str    # 投放平台（如：抖音、淘宝、小红书）
├── tone           : str    # 文案风格（如：简洁、热血、幽默、温情）
├── language       : str    # 输出语言（zh/en/ja/ko，默认 zh）

MarketingCopy（值对象）
├── text           : str    # 生成的营销文案文本
├── word_count     : int    # 字数
├── estimated_duration : float  # 预估朗读时长

AudioOutput（值对象）
├── file_path      : str    # 音频文件路径
├── format         : str    # mp3 / wav
├── duration       : float  # 实际音频时长

SubtitleEntry（值对象）
├── index          : int    # 字幕序号（从1开始）
├── start_time     : str    # 起始时间 "HH:MM:SS,mmm"
├── end_time       : str    # 结束时间 "HH:MM:SS,mmm"
├── text           : str    # 字幕文本内容

SubtitleOutput（值对象）
├── srt_file_path  : str    # SRT 文件路径
├── entries        : list[SubtitleEntry]  # 字幕条目列表
```

### 3.2 处理流程

```
           ┌── CLI 命令行 ──┐
用户输入 ──┼── Web UI ─────┼── ProductInput（含 language）
           └── REST API ───┘
                    ↓
  Prompt组装（按 language 选择对应语言模板 + 按 platform 选择风格）
                    ↓
              LLM生成文案（指定语言）
                    ↓
            输出解析 & 字数校验
                    ↓
  TTS合成音频 + 提取词级时间戳（按 language 匹配发音人）
                    ↓
          基于时间戳生成SRT字幕文件
                    ↓
         返回(MarketingCopy + AudioOutput + SubtitleOutput)
```

---

## 四、项目目录结构

```
ecommerce-copy-agent/
├── .env.example              # 环境变量模板
├── .env                      # 实际环境变量（不提交git）
├── requirements.txt          # Python 依赖
├── main.py                   # FastAPI Web 服务入口
├── cli.py                    # CLI 命令行入口
│
├── app/
│   ├── __init__.py
│   ├── config.py             # 配置管理（读取 .env）
│   ├── models.py             # Pydantic 数据模型
│   ├── prompts.py            # Prompt 模板定义（多风格 + 多语言）
│   ├── agent.py              # LangChain Agent 核心链
│   ├── tts.py                # TTS 语音合成模块（含词级时间戳 + 多语言发音人）
│   ├── subtitle.py           # SRT 字幕生成模块
│   └── routes.py             # FastAPI 路由
│
├── static/                   # Web UI 前端静态资源
│   ├── index.html            # 主页面（输入表单 + 结果展示）
│   ├── style.css             # 样式
│   └── app.js                # 前端交互逻辑（含音频播放器 + 字幕叠加）
│
└── output/                   # 生成的音频 & 字幕输出目录
    └── .gitkeep
```

---

## 五、SRT 字幕同步方案（关键技术设计）

### 5.1 同步原理

Edge TTS 在合成语音时会触发 `WordBoundary` 事件，每个事件携带：

| 字段 | 说明 | 示例 |
|------|------|------|
| `text` | 当前词/短语 | "大家好" |
| `offset` | 起始偏移（100纳秒单位） | 1,500,000 → 即 0.15秒 |
| `duration` | 持续时长（100纳秒单位） | 3,200,000 → 即 0.32秒 |

**关键优势**：时间戳由 TTS 引擎原生提供，无需手动估算，字幕与音频天然严格同步。

### 5.2 处理流程

```
TTS 合成文本 "大家好，今天给大家推荐一款超好用的面霜..."
  ↓
收集 WordBoundary 事件流：
  [(text="大家好", offset=0.0s, duration=0.36s),
   (text="，",        offset=0.36s, duration=0.12s),
   (text="今天",     offset=0.48s, duration=0.24s),
   (text="给大家",   offset=0.72s, duration=0.28s),
   ...]
  ↓
合并相邻短语为合理字幕条目（每条 ≤20字 或 时长 2~5秒）：
  [(index=1, start="00:00:00,000", end="00:00:02,150", text="大家好，今天给大家推荐"),
   (index=2, start="00:00:02,150", end="00:00:04,800", text="一款超好用的面霜..."),
   ...]
  ↓
输出标准 SRT 文件
```

### 5.3 SRT 格式示例

```
1
00:00:00,000 --> 00:00:02,150
大家好，今天给大家推荐一款超好用的面霜

2
00:00:02,150 --> 00:00:04,800
它含有三重玻尿酸，补水锁水一步到位

3
00:00:04,800 --> 00:00:07,200
现在下单立减50元，点击下方链接抢购吧！
```

### 5.4 API 响应结构（JSON）

```json
{
  "input": { "category": "美妆", "title": "...", ... },
  "copy": {
    "text": "大家好，今天给大家推荐...",
    "word_count": 85,
    "estimated_duration": 21.25
  },
  "audio": {
    "file_path": "/output/20240601_143052.mp3",
    "format": "mp3",
    "duration": 21.8
  },
  "subtitle": {
    "srt_file_path": "/output/20240601_143052.srt",
    "entries": [
      { "index": 1, "start_time": "00:00:00,000", "end_time": "00:00:02,150", "text": "..." },
      { "index": 2, "start_time": "00:00:02,150", "end_time": "00:00:04,800", "text": "..." }
    ]
  }
}
```

---

## 六、多语言支持方案（关键技术设计）

### 6.1 工作原理

```
ProductInput.language = "ja"（用户选择日语）
  → Prompt 中注入语言约束："请用日语输出文案"
    → LLM 生成日语营销文案
      → 日语字数统计（按字符数/假名数估算朗读时长）
        → TTS 根据语言匹配日文发音人（ja-JP-NanamiNeural）
          → 生成日语音频 + 日语 SRT 字幕
```

### 6.2 支持语种及 Edge TTS 发音人映射

| 语言代码 | 语言名称 | Edge TTS 发音人 | 字数-语速换算 |
|----------|----------|-----------------|--------------|
| `zh` | 中文（简体） | `zh-CN-XiaoxiaoNeural` (女) | ~4 字/秒 |
| `en` | 英语 | `en-US-JennyNeural` (女) | ~3 词/秒 |
| `ja` | 日语 | `ja-JP-NanamiNeural` (女) | ~5 字/秒 |
| `ko` | 韩语 | `ko-KR-SunHiNeural` (女) | ~4 字/秒 |

### 6.3 Prompt 多语言适配

Prompt 模板中根据 `language` 动态注入输出语言约束：

```
- 输出语言：{language}（zh=简体中文, en=English, ja=日本語, ko=한국어）
```

---

## 七、CLI 命令行模式（关键技术设计）

### 7.1 入口文件

`cli.py` — 基于 `argparse` 的命令行工具，直接调用 `app/agent.py` 和 `app/tts.py`。

### 7.2 使用方式

```bash
# 基础用法
python cli.py \
  --category 美妆 \
  --title "三重玻尿酸补水霜" \
  --selling-points "48小时锁水,敏感肌可用,买二送一" \
  --duration 30 \
  --platform 抖音 \
  --tone 热情 \
  --language zh

# 英文文案
python cli.py \
  --category Beauty \
  --title "Triple Hyaluronic Acid Cream" \
  --selling-points "48h hydration,sensitive skin friendly" \
  --duration 30 \
  --platform TikTok \
  --tone enthusiastic \
  --language en
```

### 7.3 CLI 参数设计

| 参数 | 简写 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| `--category` | `-c` | str | 是 | — | 产品品类 |
| `--title` | `-t` | str | 是 | — | 产品标题 |
| `--selling-points` | `-s` | str | 是 | — | 卖点，逗号分隔 |
| `--duration` | `-d` | int | 否 | 30 | 目标秒数 |
| `--platform` | `-p` | str | 否 | 抖音 | 投放平台 |
| `--tone` | `-o` | str | 否 | 简洁 | 文案风格 |
| `--language` | `-l` | str | 否 | zh | 输出语言 |
| `--output-dir` | — | str | 否 | `./output` | 输出目录 |

### 7.4 CLI 输出格式

```
=== 文案生成结果 ===
字数: 120 字 | 预估时长: 30.0 秒
----------------------------
[文案内容显示]
----------------------------
音频文件: ./output/20240601_143052.mp3 (29.8 秒)
字幕文件: ./output/20240601_143052.srt
```

---

## 八、Web UI 前端（关键技术设计）

### 8.1 页面结构

```
┌──────────────────────────────────────────────────┐
│  🛒 电商文案智能体                                 │
├────────────────────┬─────────────────────────────┤
│  输入表单           │  结果展示区                   │
│                    │                              │
│  品类 [_______]    │  ┌───────────────────────┐  │
│  标题 [_______]    │  │ 文案文本              │  │
│  卖点 [_______]    │  │ ...                   │  │
│  时长 [___] 秒     │  │ ...                   │  │
│  平台 [▼选择]      │  └───────────────────────┘  │
│  风格 [▼选择]      │                              │
│  语言 [▼选择]      │  ▶ 音频播放器                │
│                    │  ═══════════○════           │
│  [生成文案]        │  00:15 / 00:30              │
│                    │                              │
│                    │  ┌── 字幕叠加 ────────────┐ │
│                    │  │ 补水锁水一步到位        │ │
│                    │  └────────────────────────┘ │
└────────────────────┴─────────────────────────────┘
```

### 8.2 技术栈

| 层面 | 选择 | 说明 |
|------|------|------|
| HTML | 原生 HTML5 | 表单 + `<audio>` 元素 |
| CSS | 原生 CSS3（Grid + Flexbox） | 响应式左右分栏布局 |
| JS | 原生 Vanilla JS（ES6+） | `fetch()` 调 API、`<audio>` 控制播放、字幕时间轴同步 |
| 音频 | 浏览器原生 `<audio>` + `ontimeupdate` | 实时同步 SRT 字幕逐条高亮 |
| 部署 | FastAPI `StaticFiles` 挂载 `/static` | `app.mount("/", StaticFiles(directory="static", html=True))` |

### 8.3 字幕同步原理（前端）

```javascript
// app.js 核心逻辑
audio.addEventListener('timeupdate', () => {
  const current = audio.currentTime;
  // 遍历 subtitle.entries，找到当前播放位置对应的字幕
  const entry = entries.find(e =>
    timeToSeconds(e.start_time) <= current &&
    timeToSeconds(e.end_time) >= current
  );
  if (entry) {
    subtitleOverlay.textContent = entry.text;
    highlightEntry(entry.index);
  }
});
```

### 8.4 前端交互流程

```
用户填写表单 → 点击「生成」
  → fetch POST /api/generate
    → 显示 Loading 动画
      → 收到响应后：
        ① 文字渐入显示文案
        ② 设置 <audio src="/api/audio/{filename}">
        ③ 加载 subtitle.entries 到内存
        ④ 用户点击播放 → 字幕实时同步滚动
```

---

## 九、实施步骤

### 步骤 1：初始化项目结构与环境

- 创建项目目录结构（含 `static/`、`output/`）
- 编写 `requirements.txt`
- 编写 `.env.example`（LLM_API_KEY, LLM_BASE_URL, LLM_MODEL, TTS_PROVIDER, DEFAULT_LANGUAGE）
- 实现 `app/config.py`：读取环境变量，提供全局配置对象（含语言映射表）

### 步骤 2：定义数据模型

- 实现 `app/models.py`：
  - `ProductInput`：输入模型（category, title, selling_points, duration, platform, tone, language）
  - `MarketingCopy`：文案输出模型（text, word_count, estimated_duration）
  - `AudioOutput`：音频输出模型（file_path, format, duration）
  - `SubtitleEntry`：单条字幕模型（index, start_time, end_time, text）
  - `SubtitleOutput`：字幕输出模型（srt_file_path, entries）
  - `AgentResponse`：最终响应模型（input, copy, audio, subtitle）

### 步骤 3：设计 Prompt 模板

- 实现 `app/prompts.py`：
  - 定义 `COPYWRITER_SYSTEM_PROMPT`：系统角色设定（资深电商文案专家）
  - 定义 `COPYWRITER_HUMAN_TEMPLATE`：用户输入模板，包含所有字段占位符（含 `{language}`）
  - 时长-字数换算逻辑（按语种区分：中文 ~4字/秒，英语 ~3词/秒，日语 ~5字/秒，韩语 ~4字/秒）
  - 不同平台风格预设（抖音口语化、淘宝详实、小红书种草）
  - 语言约束注入：`请使用{language}撰写文案`

### 步骤 4：实现 LangChain 文案生成链

- 实现 `app/agent.py`：
  - 创建 `ChatPromptTemplate`，组合 system + human 消息
  - 创建 `ChatOpenAI` 实例（支持 base_url 切换）
  - 构建链：`prompt | llm | StrOutputParser`
  - 封装 `generate_copy(product_input) -> MarketingCopy` 方法

### 步骤 5：实现 TTS 语音合成模块

- 实现 `app/tts.py`：
  - 基于 Edge TTS 实现 `text_to_speech(text, output_path, language) -> Tuple[AudioOutput, list[WordBoundary]]`
  - 核心：利用 `edge_tts.Communicate.stream()` 的 `WordBoundary` 事件提取每个词/句的起止时间戳（100纳秒单位）
  - 按 `language` 参数自动选择对应语种发音人（`LANGUAGE_VOICE_MAP` 映射表）
  - 收集全量 WordBoundary 数据，供后续 SRT 字幕生成使用
  - 异步合成支持，音频写入文件同时收集时间戳
  - 可选：ElevenLabs 适配器（根据配置切换 provider）

### 步骤 5.5：实现 SRT 字幕生成模块

- 实现 `app/subtitle.py`：
  - 接收 WordBoundary 列表，合并相邻短语为合理长度的字幕条目（每条字幕 ≤20字 或 2~5秒）
  - 将 100纳秒单位时间戳转为 SRT 标准格式 `HH:MM:SS,mmm`
  - 生成符合 SRT 规范的字幕文件（`.srt`）
  - 封装 `generate_srt(word_boundaries, output_path) -> SubtitleOutput` 方法

### 步骤 6：实现 CLI 命令行入口

- 实现 `cli.py`：
  - 使用 `argparse` 定义全量命令行参数（category/title/selling-points/duration/platform/tone/language/output-dir）
  - 解析参数后构造 `ProductInput` 对象
  - 调用 `agent.generate_copy()` → `tts.text_to_speech()` → `subtitle.generate_srt()` 流水线
  - 终端输出格式化的文案 + 文件路径
  - 支持 `python cli.py -h` 查看帮助

### 步骤 7：实现 Web UI 前端

- 实现 `static/index.html`：
  - 左右分栏布局：左侧表单（7个输入字段 + 语言下拉），右侧结果展示区
  - 平台/风格/语言使用 `<select>` 下拉选择，预填默认值
- 实现 `static/style.css`：
  - CSS Grid 左右分栏，响应式适配（窄屏切换上下布局）
  - 音频播放器自定义样式
  - 字幕叠加层固定在音频下方，高亮样式
  - Loading 动画（CSS spinner）
- 实现 `static/app.js`：
  - 表单提交后 `fetch POST /api/generate`，展示 loading
  - 响应成功后：显示文案文本、设置 `<audio>` src、加载字幕条目列表
  - `audio.ontimeupdate` 实时匹配当前字幕条目并高亮显示
  - 错误处理：网络异常 / API 错误 toast 提示

### 步骤 8：实现 FastAPI API 层

- 实现 `app/routes.py`：
  - `POST /api/generate`：接收 ProductInput，调用 agent 生成文案 + 音频 + 字幕，返回 AgentResponse（含 subtitle 字段）
  - `GET /api/audio/{filename}`：下载生成的音频文件
  - `GET /api/subtitle/{filename}`：下载生成的 SRT 字幕文件
- 实现 `main.py`：
  - 创建 FastAPI 实例
  - 挂载 API 路由
  - 挂载静态文件目录 `StaticFiles(directory="static", html=True)` 提供 Web UI
  - 配置 CORS
  - 提供 `python main.py` 一键启动 Web 服务

### 步骤 9：集成测试与验证

- 使用不同产品品类（美妆/数码/食品）进行测试
- 验证 CLI 模式：`python cli.py -c 美妆 -t "面霜" -s "补水,抗皱" -d 30`
- 验证 Web UI：打开浏览器 `http://localhost:8000`，填写表单提交
- 验证多语言：分别使用 `--language zh/en/ja/ko` 生成对应语种文案
- 验证文案质量（相关性、字数控制、风格匹配）
- 验证音频输出（可播放、时长合理、发音人语种匹配）
- 验证 SRT 字幕同步：用播放器加载音频和字幕，确认字幕切换时间与语音一致
- 验证 Web UI 字幕叠加：播放器中字幕实时高亮切换

---

## 十、核心 Prompt 设计（多语言版）

```
系统角色：你是一位拥有10年经验的顶级电商文案专家，擅长根据不同平台
和产品特性撰写高转化率营销文案。

输入信息：
- 产品品类：{category}
- 产品标题：{title}
- 核心卖点：{selling_points}
- 投放平台：{platform}
- 文案风格：{tone}

要求：
1. **必须使用 {language} 撰写全部文案内容**
2. 文案总字数约 {target_word_count} 字（对应 {duration} 秒播报时长）
3. 开头3秒内抓住注意力
4. 突出核心卖点，避免冗长描述
5. 结尾包含明确的行动号召（CTA）
6. 适配 {platform} 平台的文案调性

请直接输出文案，不要包含任何解释说明。
```

---

## 十一、非功能需求

| 需求 | 说明 |
|------|------|
| 可扩展性 | LLM 提供商和 TTS 引擎可通过 .env 配置切换 |
| 多语言扩展 | 新增语种只需在 `LANGUAGE_VOICE_MAP` 添加映射 + 语速常量 |
| 错误处理 | LLM 调用失败重试 + TTS 转换异常兜底 + Web UI toast 提示 |
| 异步支持 | FastAPI 全异步，避免阻塞 |
| 输出持久化 | 音频及 SRT 字幕文件按时间戳命名，存放于 output/ 目录 |
| SRT 同步精度 | 词级时间戳由 TTS 引擎直接提供，字幕与音频天然严格同步 |
| 前端兼容性 | 支持 Chrome / Edge / Firefox 主流浏览器 |

---

## 十二、关键依赖清单

```
langchain>=0.3.0
langchain-openai>=0.2.0
langchain-community>=0.3.0
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
edge-tts>=6.1.0
python-dotenv>=1.0.0
pydantic>=2.0.0
```

---

## 十三、验收标准

- [ ] **CLI 模式**：`python cli.py -c 美妆 -t "面霜" -s "补水" -d 30` 成功输出文案 + 音频 + 字幕
- [ ] **Web UI**：浏览器打开后可填写表单、提交生成、播放音频、查看字幕同步
- [ ] **多语言**：zh/en/ja/ko 四种语言全部可生成对应语种文案和匹配发音人的音频
- [ ] 输入产品信息后，30秒内输出完整营销文案
- [ ] 文案字数与目标时长匹配（误差 ±15%）
- [ ] 文案风格与指定平台/调性一致
- [ ] 成功生成可播放的 .mp3 音频文件
- [ ] 成功生成 .srt 字幕文件，格式符合 SRT 标准规范
- [ ] 字幕时间戳与音频播放严格同步（由 TTS WordBoundary 事件保证）
- [ ] API 响应包含文本、音频下载链接和字幕下载链接
- [ ] 可通过 .env 切换 LLM 提供商和 TTS 引擎
