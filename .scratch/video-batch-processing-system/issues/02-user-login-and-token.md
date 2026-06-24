Status: ready-for-agent

## 父 Issue

视频智能剪辑客户端 PRD（`.scratch/video-batch-processing-system/PRD.md`）

## 构建什么

实现用户通过账号密码登录系统，调用服务端 `/api/auth/login` 接口获取 Access Token 和 Refresh Token。登录成功后，根据用户凭证从服务端下载用户专属配置信息（调用 `/clip_config/config_map`）和待剪辑任务列表（调用 `/clip_record/pending_clip/list`）。

需处理网络超时自动重试、认证失败提示重新登录等异常场景。

## 验收标准

- [ ] 调用 `/api/auth/login` 接口完成账号密码登录，获取 Access Token 和 Refresh Token
- [ ] 登录成功后调用 `/clip_config/config_map` 获取用户专属配置
- [ ] 登录成功后调用 `/clip_record/pending_clip/list` 获取待剪辑任务列表
- [ ] 网络超时时自动重试（最多 3 次）
- [ ] 认证失败时提示用户重新登录
- [ ] 关键流程节点记录日志

## 被阻塞于

- Issue #01（项目骨架与日志系统）

## 覆盖的用户故事

- 故事 1：作为内容创作者，我希望通过账号密码登录系统，以便获取我的专属配置和任务
