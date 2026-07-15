# 独立输出目录 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 GUI 配置独立输出目录，并将视频写入 `output_dir/output/productId/video_1.mp4`。

**Architecture:** `AppConfig` 保存素材目录和输出目录。GUI 呈现并同步两项配置；任务处理器继续以素材目录读取素材，但单独使用输出目录构建 `EditDirs.output_dir`。空输出目录回退至素材目录。

**Tech Stack:** Python、PySide6、pytest、pytest-qt。

## Global Constraints

- 保持素材读取路径不变。
- 输出路径始终为 `<output_dir>/output/<productId>/video_1.mp4`。
- 旧配置没有 `output_dir` 时回退到 `material_dir`。
- 不纳入或覆盖无关工作区改动。

---

### Task 1: 增加可持久化的输出目录

**Files:**
- Modify: `video-batch-processing-system/src/video_batch/gui/app_config.py:16-49`
- Modify: `video-batch-processing-system/tests/test_gui_app_config.py:84-116`

**Interfaces:** Produces `AppConfig.output_dir: str`.

- [ ] **Step 1: Write failing tests**

```python
def test_default_output_dir_is_empty(self, tmp_path):
    assert AppConfig(config_dir=tmp_path).output_dir == ""

def test_save_and_load_output_dir(self, tmp_path):
    first = AppConfig(config_dir=tmp_path)
    first.output_dir = "E:/video"
    first.save()
    restored = AppConfig(config_dir=tmp_path)
    restored.load()
    assert restored.output_dir == "E:/video"
```

- [ ] **Step 2: Verify RED**

Run: `python -m pytest video-batch-processing-system/tests/test_gui_app_config.py -q`

Expected: fails because `AppConfig` has no `output_dir`.

- [ ] **Step 3: Implement minimally**

```python
# __init__
self.output_dir = ""

# save()
if self.output_dir:
    data["output_dir"] = self.output_dir

# load()
self.output_dir = data.get("output_dir", self.output_dir)
```

- [ ] **Step 4: Verify GREEN**

Run: `python -m pytest video-batch-processing-system/tests/test_gui_app_config.py -q`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add video-batch-processing-system/src/video_batch/gui/app_config.py video-batch-processing-system/tests/test_gui_app_config.py
git commit -m "feat: persist video output directory"
```

### Task 2: 显示、恢复并保存两个目录

**Files:**
- Modify: `video-batch-processing-system/src/video_batch/gui/material_dir_widget.py:11-46`
- Modify: `video-batch-processing-system/src/video_batch/gui/user_panel_page.py:29-47`
- Modify: `video-batch-processing-system/src/video_batch/gui/user_panel_controller.py:78-112`
- Modify: `video-batch-processing-system/tests/test_gui_panel_components.py:9-60`
- Modify: `video-batch-processing-system/tests/test_gui_user_panel.py:10-132,201-208`

**Interfaces:** Produces `UserPanelPage.output_dir_widget: MaterialDirWidget` and `UserPanelController._output_base_dir() -> str`.

- [ ] **Step 1: Write failing tests**

```python
def test_output_widget_has_its_own_input(self, page):
    assert isinstance(page.output_dir_widget, MaterialDirWidget)
    assert page.output_dir_widget.findChild(QLineEdit, "output_dir_input") is not None

def test_on_output_dir_changed_saves_config(self, controller, mock_app_config):
    controller._on_output_dir_changed("E:/video")
    assert mock_app_config.output_dir == "E:/video"
    mock_app_config.save.assert_called_once()

def test_output_base_falls_back_to_material_dir(self, controller, mock_app_config):
    mock_app_config.material_dir = "D:/materials"
    mock_app_config.output_dir = ""
    assert controller._output_base_dir() == "D:/materials"
```

- [ ] **Step 2: Verify RED**

Run: `python -m pytest video-batch-processing-system/tests/test_gui_panel_components.py video-batch-processing-system/tests/test_gui_user_panel.py -q`

Expected: fails because the output widget and controller methods do not exist.

- [ ] **Step 3: Implement minimally**

```python
# MaterialDirWidget: accept label and prefix; use them for object names.
MaterialDirWidget(label="素材目录", object_prefix="material")
MaterialDirWidget(label="输出目录", object_prefix="output")

# UserPanelPage
self.material_dir_widget = MaterialDirWidget("素材目录", "material")
self.output_dir_widget = MaterialDirWidget("输出目录", "output")

# UserPanelController
panel.output_dir_widget.path_changed.connect(self._on_output_dir_changed)
def _on_output_dir_changed(self, path):
    self._app_config.output_dir = path
    self._app_config.save()
def _output_base_dir(self):
    return self._app_config.output_dir or self._app_config.material_dir
```

Call an output restore method beside `_restore_material_dir()`; update test fixtures with `output_dir` and `output_dir_widget`.

- [ ] **Step 4: Verify GREEN**

Run: `python -m pytest video-batch-processing-system/tests/test_gui_panel_components.py video-batch-processing-system/tests/test_gui_user_panel.py -q`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add video-batch-processing-system/src/video_batch/gui/material_dir_widget.py video-batch-processing-system/src/video_batch/gui/user_panel_page.py video-batch-processing-system/src/video_batch/gui/user_panel_controller.py video-batch-processing-system/tests/test_gui_panel_components.py video-batch-processing-system/tests/test_gui_user_panel.py
git commit -m "feat: add output directory selector"
```

### Task 3: 使用输出目录生成和查看最终视频

**Files:**
- Modify: `video-batch-processing-system/src/video_batch/gui/task_processor.py:60-76,319-354`
- Modify: `video-batch-processing-system/src/video_batch/gui/user_panel_controller.py:154-168,250-291`
- Create: `video-batch-processing-system/tests/test_gui_task_processor_paths.py`
- Modify: `video-batch-processing-system/tests/test_gui_user_panel.py:140-195`

**Interfaces:** `TaskProcessorWorker.configure(..., material_dir: str, output_dir: str = "", ...)`; it produces `EditDirs.output_dir = Path(output_dir) / "output" / productId`.

- [ ] **Step 1: Write failing tests**

```python
def test_resolve_edit_dirs_uses_output_root(tmp_path):
    worker = TaskProcessorWorker()
    worker._material_dir = tmp_path / "materials"
    worker._output_dir = tmp_path / "videos"
    dirs = worker._resolve_edit_dirs(LocalConfig(), "product-42", MagicMock())
    assert dirs.output_dir == tmp_path / "videos" / "output" / "product-42"
    assert dirs.img_dir == tmp_path / "materials" / "input" / "product-42" / "img"

def test_resolve_edit_dirs_falls_back_to_material_root(tmp_path):
    worker = TaskProcessorWorker()
    worker._material_dir = tmp_path / "materials"
    worker._output_dir = Path()
    dirs = worker._resolve_edit_dirs(LocalConfig(), "product-42", MagicMock())
    assert dirs.output_dir == tmp_path / "materials" / "output" / "product-42"
```

- [ ] **Step 2: Verify RED**

Run: `python -m pytest video-batch-processing-system/tests/test_gui_task_processor_paths.py -q`

Expected: fails because output resolution uses the material root.

- [ ] **Step 3: Implement minimally**

```python
# TaskProcessorWorker
self._output_dir = Path("")
def configure(..., material_dir: str, output_dir: str = "", ...):
    self._material_dir = Path(material_dir)
    self._output_dir = Path(output_dir) if output_dir else self._material_dir

# _resolve_edit_dirs: keep local assets under material_dir.
output_root = self._output_dir or self._material_dir
output_dir = output_root / "output" / task_id

# UserPanelController
self._task_worker.configure(..., material_dir=self._app_config.material_dir or "", output_dir=self._output_base_dir(), ...)
self._open_folder(task_id, material_id, "output", base_dir=self._output_base_dir())
```

The existing pipeline appends `video_1.mp4`; do not change the filename rule.

- [ ] **Step 4: Verify GREEN and regressions**

Run: `python -m pytest video-batch-processing-system/tests/test_gui_app_config.py video-batch-processing-system/tests/test_gui_panel_components.py video-batch-processing-system/tests/test_gui_user_panel.py video-batch-processing-system/tests/test_gui_task_processor_generate_media.py video-batch-processing-system/tests/test_gui_task_processor_paths.py video-batch-processing-system/tests/test_pipeline.py -q`

Expected: all selected tests pass.

- [ ] **Step 5: Commit**

```bash
git add video-batch-processing-system/src/video_batch/gui/task_processor.py video-batch-processing-system/src/video_batch/gui/user_panel_controller.py video-batch-processing-system/tests/test_gui_task_processor_paths.py video-batch-processing-system/tests/test_gui_user_panel.py
git commit -m "feat: write clips to configured output directory"
```
