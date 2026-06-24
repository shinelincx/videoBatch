CREATE TABLE IF NOT EXISTS `clip_config` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `code` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '配置代码',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '配置名称',
  `version` int NOT NULL DEFAULT 1 COMMENT '配置版本',
  `clip_mode` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '剪辑模式',
  `img_video_position` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '图片视频位置',
  `frame_extraction` tinyint NOT NULL DEFAULT 0 COMMENT '抽帧',
  `cropping` tinyint NOT NULL DEFAULT 0 COMMENT '裁剪',
  `blur` tinyint NOT NULL DEFAULT 0 COMMENT '模糊',
  `shake` tinyint NOT NULL DEFAULT 0 COMMENT '抖动',
  `watermark` tinyint NOT NULL DEFAULT 0 COMMENT '水印',
  `brightness` tinyint NOT NULL DEFAULT 0 COMMENT '亮度',
  `contrast` tinyint NOT NULL DEFAULT 0 COMMENT '对比度',
  `saturation` tinyint NOT NULL DEFAULT 0 COMMENT '饱和度',
  `color_balance` tinyint NOT NULL DEFAULT 0 COMMENT '色彩平衡',
  `gamma` tinyint NOT NULL DEFAULT 0 COMMENT '伽马',
  `vintage_bw` tinyint NOT NULL DEFAULT 0 COMMENT '复古黑白',
  `subtitles` tinyint NOT NULL DEFAULT 0 COMMENT '字幕',
  `danmaku` tinyint NOT NULL DEFAULT 0 COMMENT '弹幕',
  `sticker` tinyint NOT NULL DEFAULT 0 COMMENT '贴纸',
  `prepend_enabled` tinyint NOT NULL DEFAULT 0 COMMENT '片头',
  `append_enabled` tinyint NOT NULL DEFAULT 0 COMMENT '片尾',
  `background_music_enabled` tinyint NOT NULL DEFAULT 0 COMMENT '背景音乐',
  `speed_adjustment_enabled` tinyint NOT NULL DEFAULT 0 COMMENT '速度调整',
  `pitch_enabled` tinyint NOT NULL DEFAULT 0 COMMENT '音调调整',
  `loop_count` int NOT NULL DEFAULT 1 COMMENT '循环次数',
  `default_duration_per_image` decimal(10,2) NOT NULL DEFAULT 3.00 COMMENT '单张图片默认时长',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态：1启用、0禁用',
  `remark` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '备注',
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint NULL DEFAULT 0 COMMENT '删除标识：0正常 1删除',
  `tenant_id` bigint NULL DEFAULT NULL COMMENT '租户标识',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_code` (`code` ASC) USING BTREE,
  INDEX `idx_tenant_id` (`tenant_id` ASC) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='剪辑配置' ROW_FORMAT=Dynamic;

INSERT INTO `clip_config`
(`code`, `name`, `version`, `clip_mode`, `img_video_position`, `frame_extraction`, `cropping`, `blur`, `shake`, `watermark`,
 `brightness`, `contrast`, `saturation`, `color_balance`, `gamma`, `vintage_bw`, `subtitles`, `danmaku`, `sticker`,
 `prepend_enabled`, `append_enabled`, `background_music_enabled`, `speed_adjustment_enabled`, `pitch_enabled`,
 `loop_count`, `default_duration_per_image`, `status`)
SELECT 'cfg-img-v2', '图片转视频配置', 2, 'image-to-video', NULL, 1, 1, 1, 1, 1,
       1, 1, 1, 0, 0, 0, 0, 0, 1,
       0, 0, 1, 0, 1, 1, 3.00, 1
WHERE NOT EXISTS (
  SELECT 1 FROM `clip_config` WHERE `code` = 'cfg-img-v2' AND IFNULL(`deleted`, 0) = 0
);

INSERT INTO `clip_config`
(`code`, `name`, `version`, `clip_mode`, `img_video_position`, `frame_extraction`, `cropping`, `blur`, `shake`, `watermark`,
 `brightness`, `contrast`, `saturation`, `color_balance`, `gamma`, `vintage_bw`, `subtitles`, `danmaku`, `sticker`,
 `prepend_enabled`, `append_enabled`, `background_music_enabled`, `speed_adjustment_enabled`, `pitch_enabled`,
 `loop_count`, `default_duration_per_image`, `status`)
SELECT 'cfg-ref-v3', '参考视频配置', 3, 'reference-video', 'after', 0, 0, 0, 0, 0,
       0, 0, 0, 0, 0, 0, 1, 1, 1,
       1, 0, 1, 1, 1, 2, 2.00, 1
WHERE NOT EXISTS (
  SELECT 1 FROM `clip_config` WHERE `code` = 'cfg-ref-v3' AND IFNULL(`deleted`, 0) = 0
);

UPDATE `clip_config`
SET `name` = '图片转视频配置'
WHERE `code` = 'cfg-img-v2'
  AND (`name` IS NULL OR TRIM(`name`) = '')
  AND IFNULL(`deleted`, 0) = 0;

UPDATE `clip_config`
SET `name` = '参考视频配置'
WHERE `code` = 'cfg-ref-v3'
  AND (`name` IS NULL OR TRIM(`name`) = '')
  AND IFNULL(`deleted`, 0) = 0;

UPDATE `clip_config`
SET `name` = `code`
WHERE (`name` IS NULL OR TRIM(`name`) = '')
  AND `code` IS NOT NULL
  AND TRIM(`code`) <> ''
  AND IFNULL(`deleted`, 0) = 0;
