# Matt Pocock Skills

一组由 Claude Code 加载的 agent skill（包含 slash command 和行为）。这些 skill 按分类文件夹组织，并由 `/setup-matt-pocock-skills` 生成的每个仓库配置来调用。

## 术语定义

**Issue tracker**：
托管仓库 issue 的工具——例如 GitHub Issues、Linear、本地 `.scratch/` markdown 约定或其他类似工具。`to-issues`、`to-prd`、`triage` 和 `qa` 等 skill 会从中读取和写入数据。
_避免使用_：backlog manager、backlog backend、issue host

**Issue**：
**Issue tracker** 中单个被追踪的工作单元——由 `to-issues` 产生的 bug、任务、PRD 或切片。
_避免使用_：ticket（仅在引用外部系统将其称为 ticket 时使用）

**Triage role**：
在 triage 过程中应用于 **Issue** 的标准状态机标签（例如 `needs-triage`、`ready-for-afk`）。每个 role 通过 `docs/agents/triage-labels.md` 映射到 **Issue tracker** 中的实际标签字符串。
_避免使用_：triage status、workflow state

### 视频剪辑领域术语

**素材（Material）**：
视频剪辑的输入文件，包括图片（JPG、PNG、WebP）和视频（MP4）。每个素材有唯一的素材ID标识。
_避免使用_：媒体文件、资源文件

**任务（Task）**：
一个视频剪辑工作单元，由服务端下发，包含任务ID和关联的素材ID。一个任务对应一个素材，但一个素材可以被多个任务处理。
_避免使用_：作业、工作项

**剪辑（Editing）**：
视频处理过程，分为三个层级：剪辑模式、视频处理能力（确定性操作）、随机性配置项（用于防重）。
_避免使用_：视频处理、后期制作

**视频（Video）**：
剪辑任务的输出产物，经过重复检测后保存的最终视频文件。
_避免使用_：成品、输出文件

**文案（Copywriting）**：
通过AI生成的营销文案及其对应的TTS音频文件，可作为视频元素添加到剪辑中。文案可由外部系统通过 API 独立生成，生成后可被一个或多个 **任务（Task）** 关联使用。文案包含两个交付件：**字幕文案**（SRT 格式字幕文件）和 **配音**（MP3 格式音频文件）。
_避免使用_：营销文本、AI文案、旁白

**配置（Config）**：
视频剪辑的参数集合，由服务端管理并下发给客户端，包含剪辑模式、画面处理、音频、文本等各项设置。每个任务关联一个配置。
_避免使用_：用户配置、配置参数、剪辑参数

**桌面端（Desktop Client）**：
基于 Python GUI 框架（PySide6/PyQt6）的原生桌面应用，提供登录、素材根目录配置和任务管理的可视化界面，作为后端核心模块的交互入口层。
_避免使用_：前端、Web 客户端

**素材根目录（Material Root Directory）**：
用户在本地配置的素材存放根路径，系统从此路径扫描和索引 **素材（Material）**。
_避免使用_：素材文件夹、资源目录

### 文案智能体领域术语

**话术（Copy Script）**：
从热门视频中提取或 AI 生成的营销口播文本片段，按语义分段后用于指导文案生成的结构化参考数据。
_避免使用_：文案模板、话术模板

**知识库（Knowledge Base）**：
**话术（Copy Script）** 和 **热词（HotWord）** 的持久化存储，支持语义检索和生命周期管理的向量数据库集合。
_避免使用_：话术库、素材库

**采集（Collect）**：
从各短视频平台获取热门视频内容并提取话术的过程，按平台和频率定时执行。
_避免使用_：爬取、抓取

**热词（HotWord）**：
从平台热点内容中提取的高频关键词，含趋势分数和时间衰减，用于注入文案生成 Prompt 增强时效性。
_避免使用_：热门关键词、热度词

## 关系

- 一个 **Issue tracker** 包含多个 **Issue**
- 一个 **Issue** 同时只能携带一个 **Triage role**
- 一个 **任务（Task）** 关联一个 **素材（Material）**
- 一个 **素材（Material）** 可以被多个 **任务（Task）** 处理
- 一个 **任务（Task）** 生成一个 **视频（Video）**
- 一个 **任务（Task）** 关联一个 **配置（Config）**
- 一个 **任务（Task）** 可以关联一个 **文案（Copywriting）**
- 一个 **文案（Copywriting）** 可通过 API 独立生成，再被多个 **任务（Task）** 关联
- 一个 **素材根目录（Material Root Directory）** 包含一个或多个 **素材（Material）**
- 一个 **知识库（Knowledge Base）** 包含多条 **话术（Copy Script）** 和 **热词（HotWord）**
- **采集（Collect）** 从平台获取数据后，经结构化处理生成 **话术（Copy Script）** 和 **热词（HotWord）** 存入 **知识库（Knowledge Base）**


## 已标记的歧义

- "backlog" 过去同时用于指代托管 issue 的*工具*和其中的*工作集合*——现已解决：该工具称为 **Issue tracker**，"backlog" 不再作为领域术语使用。
- "backlog backend" / "backlog manager"——现已解决：统一归入 **Issue tracker**。
