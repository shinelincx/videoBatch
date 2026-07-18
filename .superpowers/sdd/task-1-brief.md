### Task 1: 增加可持久化的输出目录

**Files:**
- Modify: `video-batch-processing-system/src/video_batch/gui/app_config.py:16-49`
- Modify: `video-batch-processing-system/tests/test_gui_app_config.py:84-116`

**Interfaces:** Produces `AppConfig.output_dir: str`.

- [ ] 写失败测试：默认值为空；保存并重新加载 `E:/video`；空值时 JSON 不含 `output_dir`。
- [ ] 运行 `py -m pytest video-batch-processing-system/tests/test_gui_app_config.py -q`，确认因不存在 `output_dir` 而失败。
- [ ] 最小实现：初始化 `self.output_dir = ""`；仅非空时写入 `data["output_dir"]`；加载用 `data.get("output_dir", self.output_dir)`。
- [ ] 重新运行上述测试，确认通过。
- [ ] 仅提交任务相关文件，提交信息为 `feat: persist video output directory`。
