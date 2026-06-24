Status: ready-for-agent

## 父 Issue

视频智能剪辑客户端 PRD（`.scratch/video-batch-processing-system/PRD.md`）

## 构建什么

将 `audio_processor.py` 中语速调整的固定值（0.85x ~ 1.15x）改为从本地随机配置文件获取语速范围，每次执行时在该范围内随机选取语速值。

当前行为：
- 语速在固定范围 0.85x ~ 1.15x 内随机选取

目标行为：
- 随机配置文件中新增 `audio.speed` 配置项，定义 `min` / `max` 范围
- `audio_processor.py` 执行时从随机配置中读取范围并生成随机语速值
- 随机值记录到任务日志中，便于调试和问题复现

## 验收标准

- [ ] `randomization_config.py` 新增语速随机化配置项（`audio.speed`，含 `min` / `max`）
- [ ] `audio_processor.py` 中语速值改为从随机配置读取范围后随机选取
- [ ] 每次执行生成的随机语速值记录到任务日志
- [ ] 支持配置参数动态调整，无需重启
- [ ] 现有语速相关测试用例适配后通过

## 被阻塞于

无——可立即开始

## 覆盖的用户故事

- 故事 7：作为内容创作者，我希望系统自动检测生成视频的重复内容（语速随机化为防重提供参数差异化）
