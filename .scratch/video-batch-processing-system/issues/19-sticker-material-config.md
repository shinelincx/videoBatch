Status: completed

## 父 Issue

视频智能剪辑客户端 PRD（`.scratch/video-batch-processing-system/PRD.md`）

## 构建什么

在素材管理模块中新增贴纸素材的支持：从本地配置目录扫描贴纸文件，建立素材索引供剪辑模块使用。

端到端行为：
1. 客户端启动时读取 `metadata.json` 中新增的贴纸目录配置项
2. 扫描贴纸目录，识别支持的图片格式（PNG、WebP 等带透明通道的格式）
3. 将贴纸素材加入素材索引（路径、尺寸、文件名），供后续叠加模块消费

## 验收标准

- [x] `metadata.json` 支持贴纸目录路径配置（通过 `local_config.json` 中的 `MaterialPathsConfig.sticker_dir` 实现，遵循现有双轨配置架构）
- [x] 扫描贴纸目录，识别 PNG、WebP 等透明背景格式（新增 `STICKER_FORMATS = {"png", "webp"}`）
- [x] 贴纸素材信息（路径、尺寸、文件名）加入素材索引（复用 `MaterialInfo`，`material_type="sticker"`）
- [x] 贴纸目录为空时记录警告日志但不阻塞任务（返回空列表）
- [x] 贴纸格式不支持时报错提示并记录日志（复用 `_scan_dir` 的格式跳过 + 告警逻辑）

## 被阻塞于

- Issue #8（素材索引与识别）—— 需复用素材扫描与索引基础设施

## 覆盖的用户故事

- 故事 4/5：作为内容创作者，我希望系统支持图生视频/原视频参考模式（贴纸素材准备阶段）
