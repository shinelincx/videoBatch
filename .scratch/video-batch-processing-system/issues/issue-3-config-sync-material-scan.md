# Issue #3: 配置同步 + 素材扫描

**标签**: `ready-for-agent`

**类型**: AFK

**被阻塞于**: #1

---

## 构建什么

从服务端同步配置到本地只读缓存，扫描素材根目录建立素材索引（含图片、视频、metadata.json 中的可选素材目录）。这是视频剪辑的前置依赖。

端到端路径：调用 `GET /clip_config/config_map` → 按版本号机制缓存到本地 `config/user_config.json` → 扫描素材根目录 → 解析 `metadata.json` → 建立素材索引（含背景音乐/前后贴目录）→ 支持图片/视频格式识别。

## 验收标准

### 配置同步
- [ ] 调用 `GET /clip_config/config_map?config_id=xxx` 获取配置（config_id 从任务列表获取）
- [ ] 配置包含版本号字段，服务端变更时能检测到版本号递增并更新本地缓存
- [ ] 配置缓存为只读 JSON 文件 `config/user_config.json`，禁止本地修改
- [ ] 配置解析失败时回滚到上一版本缓存
- [ ] 网络异常时使用本地缓存配置（离线模式）
- [ ] 配置项包含：剪辑模式、视频项（抽帧/裁剪/模糊/抖动/水印）、原视频参考模式专用参数（img_video_position、image_duration）、语音项（声音类型/语速/背景音乐/变调）、文本项（字幕/弹幕）、前后贴、重复循环次数

### 素材扫描
- [ ] 扫描素材根目录下 `assets/{task_id}/img/` 中的图片素材（JPG/PNG/WebP）
- [ ] 扫描素材根目录下 `assets/{task_id}/mv/` 中的视频素材（MP4）
- [ ] 解析 `config/metadata.json` 获取背景音乐、前贴视频、后贴视频等可选素材的目录
- [ ] 建立素材索引（路径、类型、尺寸、创建时间）
- [ ] 素材缺失时标记任务失败并通知服务端（调用 `PUT /api/tasks/{id}/status`）
- [ ] 不支持的格式给出错误提示

## 涉及 API

| 接口 | 方法 | 说明 |
|------|------|------|
| `/clip_config/config_map` | GET | 获取用户配置 |
| `/api/tasks/{id}/status` | PUT | 更新任务状态 |

## 被阻塞于

- #1（桌面端 GUI 框架 + 登录页 + 认证集成）
