ALTER TABLE `video_publish`.`product_selection_records`
    ADD COLUMN `video_title` varchar(255) NULL COMMENT '视频标题' AFTER `shop_name`,
    ADD COLUMN `video_copy` text NULL COMMENT '视频文案' AFTER `video_title`,
    ADD COLUMN `video_topic` text NULL COMMENT '视频话题' AFTER `video_copy`;