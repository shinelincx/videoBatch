Status: ready-for-agent

## 父 Issue

视频智能剪辑客户端 PRD（`.scratch/video-batch-processing-system/PRD.md`）

## 构建什么

创建项目的基础目录结构和日志系统，为后续所有模块提供运行基础。

目录结构需包含：`assets/`（素材存储，含 `{task_id}/img/` 和 `{task_id}/mv/` 子目录）、`assets/output/`（输出视频）、`config/`（配置缓存，含 `user_config.json` 和 `metadata.json`）、`hashes/`（视频哈希存储）、`temp/`（临时文件，含 `audio/` 子目录）、`logs/`（日志目录）。

日志系统需实现按日期轮转（`logs/task_YYYY-MM-DD.log`），格式为 `[时间戳] [任务ID] [模块] [级别] 消息`。支持 INFO 和 ERROR 两个级别，关键流程节点（任务开始/结束、状态变更、异常触发、重试行为）必须记录。

## 验收标准

- [ ] 项目目录结构完整创建，包含所有必需的子目录
- [ ] 日志系统可正确输出格式化日志，包含时间戳、任务ID、模块名、级别和消息
- [ ] 日志按日期轮转，每天生成独立日志文件
- [ ] 系统启动时自动清理 `temp/` 目录下超过 24 小时的残留文件
- [ ] Python 环境配置完成，FFmpeg 依赖可正常调用

## 被阻塞于

无——可立即开始
