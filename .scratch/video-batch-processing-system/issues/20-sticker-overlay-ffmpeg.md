Status: completed

## 父 Issue

视频智能剪辑客户端 PRD（`.scratch/video-batch-processing-system/PRD.md`）

## 构建什么

基于贴纸素材索引，使用 FFmpeg overlay 滤镜实现贴纸叠加功能。

端到端行为：
1. 从贴纸素材索引中随机选择贴纸
2. 随机决定出现 1-4 个贴纸
3. 每个贴纸随机分布在视频 4 个角（左上、右上、左下、右下）
4. 每个贴纸设置 10%-30% 的随机透明度
5. 每个贴纸附加小范围运动轨迹（`overlay` 坐标随时间微调，模拟轻微浮动/晃动）
6. 应用参数保存到任务日志

## 验收标准

- [x] 从贴纸索引随机选取贴纸文件（`os.listdir` + `self._rng.choice` 从贴纸目录选取）
- [x] 随机出现 1-4 个贴纸（`self._rng.randint(1, 4)`）
- [x] 贴纸随机分布在视频 4 个角（4 角 bounding box：左上/右上/左下/右下，`self._rng.sample` 不重复选择）
- [x] 贴纸透明度在 10%-30% 范围内随机（`self._rng.uniform(0.7, 0.9)` = 70%-90% 不透明度）
- [x] 贴纸具有小范围运动轨迹（sin/cos 表达式，振幅 1%-4%，速度 0.3-0.8）
- [x] 贴纸叠加不破坏视频编码兼容性（复用现有 overlay + format=rgba + colorchannelmixer 滤镜链）
- [x] 叠加参数（选中的贴纸、位置、透明度、运动参数）写入任务日志（记录到 `AppliedOverlayParams` 并通过 logger.info 输出）

## 被阻塞于

- Issue #19（贴纸素材配置与目录扫描）
- Issue #11（视频叠加元素）—— 复用 overlay 滤镜基础设施

## 覆盖的用户故事

- 故事 7：作为内容创作者，我希望系统自动检测生成视频的重复内容，以避免被平台判定为重复（贴纸随机性贡献防重效果）
