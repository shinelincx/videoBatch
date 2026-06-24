# 电商文案智能体 Spec

## Why
电商运营人员需要快速生成多平台、多语言的营销文案及配套音频，手动撰写效率低且无法保证风格一致性。通过 LangChain + LLM + TTS 构建智能体，输入产品信息即可一键输出文案文本、音频和同步字幕。

## What Changes
- 新增 `app/config.py`：环境变量配置管理（LLM、TTS、语言映射表）
- 新增 `app/models.py`：Pydantic 数据模型（ProductInput/MarketingCopy/AudioOutput/SubtitleEntry/SubtitleOutput/AgentResponse）
- 新增 `app/prompts.py`：多语言多风格 Prompt 模板 + 语种-语速换算
- 新增 `app/agent.py`：LangChain 文案生成链（prompt | LLM | output parser）
- 新增 `app/tts.py`：Edge TTS 语音合成 + WordBoundary 时间戳提取 + 多语言发音人映射
- 新增 `app/subtitle.py`：SRT 字幕生成（合并词级时间戳为合理字幕条目）
- 新增 `app/routes.py`：FastAPI 路由（POST /api/generate, GET /api/audio/{fn}, GET /api/subtitle/{fn}）
- 新增 `cli.py`：argparse 命令行入口
- 新增 `main.py`：FastAPI 服务入口 + 静态文件托管
- 新增 `static/`：Web UI 前端（index.html/style.css/app.js），含音频播放器 + 字幕实时同步
- 新增 `output/`：音频和字幕输出目录
- 新增 `.env.example` / `requirements.txt`

## Impact
- Affected specs: 无（新项目）
- Affected code: 全新代码，无历史变更

---

## ADDED Requirements

### Requirement: 项目初始化与配置管理
系统 SHALL 提供 `app/config.py` 从 `.env` 文件读取 LLM_API_KEY、LLM_BASE_URL、LLM_MODEL、TTS_PROVIDER、DEFAULT_LANGUAGE 等配置，并提供 `LANGUAGE_VOICE_MAP` 语言-发音人映射表及 `LANGUAGE_SPEED_MAP` 语种-语速映射表。

#### Scenario: 默认配置加载
- **WHEN** 应用启动且 `.env` 未设置 LLM_MODEL
- **THEN** 使用默认值 `gpt-4o-mini` 和 `TTS_PROVIDER=edge_tts`

#### Scenario: 语言映射查询
- **WHEN** 传入 `language="ja"`
- **THEN** 返回发音人 `ja-JP-NanamiNeural` 和语速 `5` 字/秒

---

### Requirement: 数据模型定义
系统 SHALL 提供完整的 Pydantic v2 数据模型，包括：
- `ProductInput`：含 category / title / selling_points / duration / platform / tone / language（默认 zh）
- `MarketingCopy`：含 text / word_count / estimated_duration
- `AudioOutput`：含 file_path / format / duration
- `SubtitleEntry`：含 index / start_time / end_time / text
- `SubtitleOutput`：含 srt_file_path / entries
- `AgentResponse`：含 input / copy / audio / subtitle

#### Scenario: 输入校验
- **WHEN** 传入 `ProductInput(category="", title="面霜", selling_points=["补水"])`
- **THEN** Pydantic 校验失败，返回 category 不能为空的错误信息

---

### Requirement: 文案生成 — Prompt 模板
系统 SHALL 在 `app/prompts.py` 中定义 `COPYWRITER_SYSTEM_PROMPT`（系统角色）和 `COPYWRITER_HUMAN_TEMPLATE`（含 {category}/{title}/{selling_points}/{duration}/{platform}/{tone}/{language}/{target_word_count} 占位符），并根据 language 注入输出语言约束。

#### Scenario: 中文文案 Prompt 组装
- **WHEN** `language="zh"`, `duration=30`
- **THEN** target_word_count 计算为 `30 × 4 = 120`，Prompt 含"必须使用 zh 撰写全部文案内容"

#### Scenario: 英文文案 Prompt 组装
- **WHEN** `language="en"`, `duration=30`
- **THEN** target_word_count 计算为 `30 × 3 = 90` 词

---

### Requirement: 文案生成 — LangChain 链
系统 SHALL 在 `app/agent.py` 中实现 LangChain 链：`ChatPromptTemplate | ChatOpenAI | StrOutputParser`，并封装 `async generate_copy(product_input) -> MarketingCopy` 方法。

#### Scenario: 正常生成文案
- **WHEN** 传入合法的 `ProductInput`
- **THEN** 返回 `MarketingCopy`，含生成的文案文本、字数、预估时长

#### Scenario: LLM 调用失败重试
- **WHEN** LLM API 返回 5xx 错误
- **THEN** 系统重试最多 2 次，若仍失败则抛出包含错误信息的异常

---

### Requirement: TTS 语音合成与时间戳提取
系统 SHALL 在 `app/tts.py` 中实现基于 Edge TTS 的 `text_to_speech(text, output_path, language) -> (AudioOutput, list)` 方法，利用 `stream()` 同时写入音频文件和收集 WordBoundary 事件时间戳。

#### Scenario: 中文语音合成
- **WHEN** `language="zh"`, text 为中文营销文案
- **THEN** 使用发音人 `zh-CN-XiaoxiaoNeural` 生成 .mp3 文件，并返回 WordBoundary 列表

#### Scenario: TTS 异常兜底
- **WHEN** Edge TTS 调用异常
- **THEN** 抛出包含原始异常信息的 RuntimeError

---

### Requirement: SRT 字幕生成
系统 SHALL 在 `app/subtitle.py` 中实现 `generate_srt(word_boundaries, output_path) -> SubtitleOutput`，将 WordBoundary 列表合并为合理字幕条目，输出标准 SRT 格式文件。

#### Scenario: 字幕合并规则
- **WHEN** 连续多个 WordBoundary 条目总字数 ≤ 20 字且总时长 ≤ 5 秒
- **THEN** 合并为一条字幕条目，时间戳取首条 start 和末条 end

#### Scenario: SRT 格式输出
- **WHEN** 生成的字幕写入文件
- **THEN** 文件内容符合 SRT 标准（序号 + `HH:MM:SS,mmm --> HH:MM:SS,mmm` + 文本 + 空行）

---

### Requirement: REST API 接口
系统 SHALL 提供以下 FastAPI 接口：
- `POST /api/generate`：接收 `ProductInput`，返回 `AgentResponse`（含 input/copy/audio/subtitle）
- `GET /api/audio/{filename}`：下载音频文件（`application/octet-stream`）
- `GET /api/subtitle/{filename}`：下载 SRT 字幕文件（`text/plain; charset=utf-8`）

#### Scenario: 完整生成流程调用
- **WHEN** POST /api/generate 传入有效 ProductInput
- **THEN** 返回 200 + AgentResponse，包含文案文本、音频文件名、字幕文件名和字幕条目

#### Scenario: 文件下载
- **WHEN** GET /api/audio/20240601_143052.mp3
- **THEN** 返回 200 + Content-Type: audio/mpeg，文件内容为对应 .mp3

---

### Requirement: CLI 命令行入口
系统 SHALL 提供 `cli.py`，基于 `argparse` 支持以下参数：

| 参数 | 必填 | 默认值 |
|------|------|--------|
| -c / --category | 是 | — |
| -t / --title | 是 | — |
| -s / --selling-points | 是 | — |
| -d / --duration | 否 | 30 |
| -p / --platform | 否 | 抖音 |
| -o / --tone | 否 | 简洁 |
| -l / --language | 否 | zh |
| --output-dir | 否 | ./output |

CLI SHALL 调用与 API 相同的 agent/tts/subtitle 模块流水线，并在终端输出结构化结果。

#### Scenario: CLI 基础调用
- **WHEN** `python cli.py -c 美妆 -t "面霜" -s "补水,抗皱"`
- **THEN** 终端输出文案内容 + 音频路径 + 字幕路径，退出码 0

#### Scenario: CLI 帮助
- **WHEN** `python cli.py -h`
- **THEN** 输出所有参数的帮助信息

---

### Requirement: Web UI 前端
系统 SHALL 在 `static/` 目录下提供完整的单页面 Web 应用，包括：
- `index.html`：左右分栏布局（左侧表单、右侧结果展示 + 音频播放器 + 字幕叠加层）
- `style.css`：CSS Grid 响应式布局 + 自定义播放器样式 + loading spinner
- `app.js`：表单提交 fetch API → 展示结果 → 音频播放 + `ontimeupdate` 字幕实时同步

#### Scenario: 表单提交与结果展示
- **WHEN** 用户填写表单并点击「生成文案」
- **THEN** 显示 loading 动画，后端返回后展示文案文本、播放器和字幕叠加

#### Scenario: 字幕实时同步
- **WHEN** 音频播放进度变化
- **THEN** 字幕叠加层显示当前时间对应的字幕条目并高亮

#### Scenario: 错误处理
- **WHEN** API 返回错误或网络不可达
- **THEN** 页面显示 toast 错误提示

---

### Requirement: 多语言支持
系统 SHALL 支持 zh / en / ja / ko 四种语言：
- LLM 通过 Prompt 语言约束生成对应语言文案
- TTS 通过 `LANGUAGE_VOICE_MAP` 匹配对应语种 Edge TTS 发音人
- 字数统计按 `LANGUAGE_SPEED_MAP` 区分语速

#### Scenario: 日语文案生成
- **WHEN** `language="ja"`, duration=30
- **THEN** target_word_count=150（30×5），Prompt 含日语约束，TTS 使用 ja-JP-NanamiNeural

---

### Requirement: 静态文件服务
系统 SHALL 在 `main.py` 中通过 `StaticFiles` 挂载 `static/` 目录为 Web UI 入口，设置 `html=True` 支持 SPA 路由，并配置 CORS 允许跨域。

#### Scenario: 访问 Web UI
- **WHEN** 浏览器访问 `http://localhost:8000/`
- **THEN** 展示 `static/index.html` 页面
