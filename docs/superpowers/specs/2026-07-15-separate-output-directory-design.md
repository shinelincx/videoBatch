# 独立输出目录设计

## 目标

GUI 中将“素材根目录”改为“素材目录”，新增独立的“输出目录”。剪辑仍从素材目录读取，而最终视频写入输出目录。

## 配置

`AppConfig` 新增 `output_dir`，与 `material_dir` 一同保存到 `app_config.json`。

为保持旧配置可用，未设置 `output_dir` 时，运行时将其视为 `material_dir`。

## 界面

素材目录控件显示“素材目录”；新增一个样式和交互一致的“输出目录”控件。两者均支持输入、浏览选择目录、加载已保存值并即时持久化。

## 路径规则

设素材目录为 `M`，输出目录为 `O`，产品 ID 为 `productId`：

- 素材扫描继续使用 `M/productId`。
- 最终视频固定写入 `O/output/productId/video_1.mp4`。
- “查看视频”打开 `O/output/productId`。

例如 `O = E:/video` 时，最终文件为 `E:/video/output/productId/video_1.mp4`。

## 测试

- 验证 `output_dir` 的默认值、保存和加载。
- 验证未设置输出目录时回退到素材目录。
- 验证目录解析使用输出目录并保留 `output/productId/video_1.mp4` 层级。
- 验证 GUI 控制器将输出目录传递给任务处理器，且查看视频使用同一目录。
