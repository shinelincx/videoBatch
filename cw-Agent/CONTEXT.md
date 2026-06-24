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
视频处理过程，分为三个层级：
1. **剪辑模式**：决定视频的基础生成方式（图生视频、原视频参考）
2. **视频处理能力**：确定性操作，由配置决定是否启用（抽帧、裁剪、模糊、抖动、水印、语音处理、文本处理、前后贴处理、重复处理）
3. **随机性配置项**：在确定性操作的基础上引入随机变化，用于防重（背景音乐随机、文字样式随机、滤镜效果随机、视频时长随机、转场效果随机、画面裁剪随机、前后贴随机）
_避免使用_：视频处理、后期制作

**视频（Video）**：
剪辑任务的输出产物，经过重复检测后保存的最终视频文件。
_避免使用_：成品、输出文件

**文案（Copywriting）**：
通过AI生成的营销文案及其对应的TTS音频文件，可作为视频元素添加到剪辑中。
_避免使用_：营销文本、AI文案、旁白

## 关系

- 一个 **Issue tracker** 包含多个 **Issue**
- 一个 **Issue** 同时只能携带一个 **Triage role**
- 一个 **任务（Task）** 关联一个 **素材（Material）**
- 一个 **素材（Material）** 可以被多个 **任务（Task）** 处理
- 一个 **任务（Task）** 生成一个 **视频（Video）**
- 一个 **任务（Task）** 可以关联一个 **文案（Copywriting）**

## 示例对话

> **Dev:** "当 **任务（Task）** 关联了 **文案（Copywriting）** 后，如果文案生成失败，任务应该如何处理？"
> **Domain expert:** "任务会进入失败状态，需要人工介入检查文案生成失败的原因。"

> **Dev:** "一个 **素材（Material）** 可以被多个 **任务（Task）** 处理，那这些任务是并行执行还是顺序执行？"
> **Domain expert:** "默认情况下是顺序执行，以避免资源竞争。但可以通过配置改为并行执行。"

> **Dev:** "**剪辑（Editing）** 过程中可以同时应用多种处理操作吗？"
> **Domain expert:** "可以，但操作顺序会影响最终结果，需要按照业务规则确定执行顺序。"

## 已标记的歧义

- "backlog" 过去同时用于指代托管 issue 的*工具*和其中的*工作集合*——现已解决：该工具称为 **Issue tracker**，"backlog" 不再作为领域术语使用。
- "backlog backend" / "backlog manager"——现已解决：统一归入 **Issue tracker**。
