# Task 1 review package

Base: 618fa3c8
Head: 063bae02

```diff
diff --git a/video-batch-processing-system/src/video_batch/gui/app_config.py b/video-batch-processing-system/src/video_batch/gui/app_config.py
index f78a8b6f..b2a773a4 100644
--- a/video-batch-processing-system/src/video_batch/gui/app_config.py
+++ b/video-batch-processing-system/src/video_batch/gui/app_config.py
@@ -13,36 +13,40 @@ class AppConfig:
         self.saved_username = ""
         self.material_dir = ""
+        self.output_dir = ""
@@
         if self.material_dir:
             data["material_dir"] = self.material_dir
+        if self.output_dir:
+            data["output_dir"] = self.output_dir
@@
         self.material_dir = data.get("material_dir", self.material_dir)
+        self.output_dir = data.get("output_dir", self.output_dir)
diff --git a/video-batch-processing-system/tests/test_gui_app_config.py b/video-batch-processing-system/tests/test_gui_app_config.py
@@
+class TestAppConfigOutputDir:
+    """输出目录配置测试。"""
+    def test_default_output_dir_is_empty(self, tmp_path):
+        config = AppConfig(config_dir=tmp_path)
+        assert config.output_dir == ""
+    def test_save_and_load_output_dir(self, tmp_path):
+        c1 = AppConfig(config_dir=tmp_path)
+        c1.output_dir = "E:/video"
+        c1.save()
+        c2 = AppConfig(config_dir=tmp_path)
+        c2.load()
+        assert c2.output_dir == "E:/video"
+    def test_output_dir_not_in_json_when_empty(self, tmp_path):
+        c1 = AppConfig(config_dir=tmp_path)
+        c1.save()
+        data = json.loads((tmp_path / "app_config.json").read_text(encoding="utf-8"))
+        assert "output_dir" not in data
+```
