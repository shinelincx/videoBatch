-- 记录状态与废弃字段调整：
-- 1. clip_record 删除 clip_score，状态改为中文业务状态
-- 2. product_selection_records 删除审核人字段，状态改为新流程状态

DROP PROCEDURE IF EXISTS `migrate_record_status_and_removed_columns_20260525`;

DELIMITER $$
CREATE PROCEDURE `migrate_record_status_and_removed_columns_20260525`()
BEGIN
  DECLARE current_schema_name VARCHAR(128) DEFAULT DATABASE();

  IF EXISTS (
    SELECT 1 FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = current_schema_name
      AND TABLE_NAME = 'clip_record'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = current_schema_name
        AND TABLE_NAME = 'clip_record'
        AND COLUMN_NAME = 'clip_score'
    ) THEN
      ALTER TABLE `clip_record`
        DROP COLUMN `clip_score`;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = current_schema_name
        AND TABLE_NAME = 'clip_record'
        AND COLUMN_NAME = 'status'
    ) THEN
      ALTER TABLE `clip_record`
        MODIFY COLUMN `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL
        COMMENT '状态：待剪辑、剪辑中、已完成、剪辑失败、已作废';

      UPDATE `clip_record`
      SET `status` = CASE `status`
        WHEN 'pending' THEN '待剪辑'
        WHEN '等待中' THEN '待剪辑'
        WHEN 'processing' THEN '剪辑中'
        WHEN '处理中' THEN '剪辑中'
        WHEN 'completed' THEN '已完成'
        WHEN 'failed' THEN '剪辑失败'
        WHEN '失败' THEN '剪辑失败'
        WHEN 'cancelled' THEN '已作废'
        WHEN '已取消' THEN '已作废'
        ELSE `status`
      END
      WHERE `status` IN ('pending', '等待中', 'processing', '处理中', 'completed', 'failed', '失败', 'cancelled', '已取消');
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = current_schema_name
      AND TABLE_NAME = 'product_selection_records'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = current_schema_name
        AND TABLE_NAME = 'product_selection_records'
        AND COLUMN_NAME = 'status'
    ) THEN
      ALTER TABLE `product_selection_records`
        MODIFY COLUMN `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL
        COMMENT '状态：已作废、待剪辑、剪辑中、剪辑失败、待发布、发布中、发布成功';

      UPDATE `product_selection_records`
      SET `status` = CASE `status`
        WHEN '选品审核中' THEN '待剪辑'
        WHEN '选品审核驳回' THEN '已作废'
        WHEN '剪辑审核中' THEN '待发布'
        WHEN '剪辑审核驳回' THEN '剪辑失败'
        WHEN '已发布' THEN '发布成功'
        WHEN '已废弃' THEN '已作废'
        ELSE `status`
      END
      WHERE `status` IN ('选品审核中', '选品审核驳回', '剪辑审核中', '剪辑审核驳回', '已发布', '已废弃');
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = current_schema_name
        AND TABLE_NAME = 'product_selection_records'
        AND COLUMN_NAME = 'selection_approver_user_id'
    ) THEN
      ALTER TABLE `product_selection_records`
        DROP COLUMN `selection_approver_user_id`;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = current_schema_name
        AND TABLE_NAME = 'product_selection_records'
        AND COLUMN_NAME = 'publish_approver_user_id'
    ) THEN
      ALTER TABLE `product_selection_records`
        DROP COLUMN `publish_approver_user_id`;
    END IF;
  END IF;
END$$
DELIMITER ;

CALL `migrate_record_status_and_removed_columns_20260525`();

DROP PROCEDURE IF EXISTS `migrate_record_status_and_removed_columns_20260525`;
