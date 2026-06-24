Status: ready-for-agent

## 父 Issue

视频智能剪辑客户端 PRD（`.scratch/video-batch-processing-system/PRD.md`）

## 构建什么

在登录获取 Token 的基础上，实现 Token 的安全存储和生命周期管理。

Token 存储使用 AES-256 加密，密钥在首次运行时随机生成并存储于本地配置目录。安全边界为防普通用户窥探，不防御有代码访问权限的专业攻击者。

Token 过期策略：Access Token 有效期 24 小时，Refresh Token 有效期 7 天。Access Token 过期前 1 小时自动静默刷新（调用 `/api/auth/token`），无需用户操作。Refresh Token 过期后提示用户重新登录。刷新失败时自动降级为重新登录。

多端登录冲突处理：检测到异地登录时提示用户并提供"强制下线其他设备"选项。

## 验收标准

- [ ] Token 使用 AES-256 加密存储在本地，密钥首次运行时自动生成
- [ ] Access Token 过期前 1 小时自动静默刷新，用户无感知
- [ ] Refresh Token 过期后提示用户重新登录
- [ ] 刷新失败时自动降级为重新登录流程
- [ ] 检测到异地登录时提示用户，提供"强制下线其他设备"选项
- [ ] Token 相关操作记录日志

## 被阻塞于

- Issue #02（用户登录与Token获取）

## 覆盖的用户故事

- 故事 1：作为内容创作者，我希望通过账号密码登录系统，以便获取我的专属配置和任务
