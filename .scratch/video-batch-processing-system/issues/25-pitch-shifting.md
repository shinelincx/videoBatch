Status: ready-for-agent

## 父 Issue

视频智能剪辑客户端 PRD（`.scratch/video-batch-processing-system/PRD.md`）

## 构建什么

新增变调（pitch shifting）处理能力，通过 FFmpeg `rubberband` 滤镜调整音频音调，实现不同声音模式（男声、女声、童声、老人等）的切换。

设计要点：
- **本地配置**：`randomization_config.py` 新增声音选项配置文件，定义可用变调模式及对应的 pitch 偏移值（如男声 `-3` 半音、女声 `+3` 半音、童声 `+6` 半音、老人 `-5` 半音）
- **服务端控制**：服务端下发配置新增 `pitch.enabled`（bool）和 `pitch.mode`（string）字段，控制是否启用变调及使用哪种声音模式
- **FFmpeg 实现**：通过 `rubberband` 音频滤镜实现变调效果，在音频滤镜链中位于 BGM 混音之前
- **日志记录**：每次执行时选用的变调模式记录到任务日志

## 验收标准

- [ ] `randomization_config.py` 新增变调声音选项配置（`audio.pitch`），定义可用模式及 pitch 偏移值
- [ ] `config_sync.py` 服务端配置模型新增 `pitch.enabled` 和 `pitch.mode` 字段
- [ ] `audio_processor.py` 新增 `rubberband` 滤镜处理逻辑，根据服务端配置决定是否启用及使用哪种模式
- [ ] 变调在音频滤镜链中位置正确（BGM 混音之前执行）
- [ ] 变调模式及参数记录到任务日志
- [ ] 新增变调相关的单元测试（各模式验证、禁用变调时的旁路验证）
- [ ] 无 `rubberband` 库时给出友好错误提示（FFmpeg 需编译 `--enable-librubberband`）

## 被阻塞于

无——可立即开始

## 覆盖的用户故事

- 故事 4：作为内容创作者，我希望系统支持图生视频模式（变调为音频处理可选增强）
- 故事 5：作为内容创作者，我希望系统支持原视频参考模式（变调为音频处理可选增强）
- 故事 7：作为内容创作者，我希望系统自动检测生成视频的重复内容（变调为防重提供声音差异化）
