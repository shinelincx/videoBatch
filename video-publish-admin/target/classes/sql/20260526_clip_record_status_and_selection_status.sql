-- 剪辑记录删除 status、account_id、product_title、rule_id；选品记录状态调整为开始剪辑流程。

DROP PROCEDURE IF EXISTS `clip_record_status_and_selection_status_20260526`;

DELIMITER $$
CREATE PROCEDURE `clip_record_status_and_selection_status_20260526`()
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'clip_record'
      AND COLUMN_NAME = 'status'
  ) THEN
    ALTER TABLE `clip_record`
      DROP COLUMN `status`;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'clip_record'
      AND COLUMN_NAME = 'account_id'
  ) THEN
    ALTER TABLE `clip_record`
      DROP COLUMN `account_id`;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'clip_record'
      AND COLUMN_NAME = 'product_title'
  ) THEN
    ALTER TABLE `clip_record`
      DROP COLUMN `product_title`;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'clip_record'
      AND COLUMN_NAME = 'rule_id'
  ) THEN
    ALTER TABLE `clip_record`
      DROP COLUMN `rule_id`;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'product_selection_records'
      AND COLUMN_NAME = 'status'
  ) THEN
    UPDATE `product_selection_records`
    SET `status` = '待配置'
    WHERE `status` IS NULL OR TRIM(`status`) = '';

    IF EXISTS (
      SELECT 1
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'clip_record'
    ) AND EXISTS (
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'clip_record'
        AND COLUMN_NAME = 'product_id'
    ) AND EXISTS (
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'product_selection_records'
        AND COLUMN_NAME = 'product_id'
    ) THEN
      UPDATE `product_selection_records` psr
      SET psr.`status` = '待配置'
      WHERE psr.`status` = '待剪辑'
        AND NOT EXISTS (
          SELECT 1
          FROM `clip_record` cr
          WHERE cr.`product_id` = psr.`product_id`
        );
    END IF;

    UPDATE `product_selection_records`
    SET `status` = CASE `status`
      WHEN '选品审核中' THEN '待配置'
      WHEN '选品审核驳回' THEN '已作废'
      WHEN '剪辑审核中' THEN '待发布'
      WHEN '剪辑审核驳回' THEN '剪辑失败'
      WHEN '已发布' THEN '发布成功'
      WHEN '已废弃' THEN '已作废'
      ELSE `status`
    END
    WHERE `status` IN ('选品审核中', '选品审核驳回', '剪辑审核中', '剪辑审核驳回', '已发布', '已废弃');

    ALTER TABLE `product_selection_records`
      MODIFY COLUMN `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL
      COMMENT '状态：已作废、待配置、待剪辑、剪辑中、剪辑失败、待发布、发布中、发布失败、发布成功';
  END IF;
END$$
DELIMITER ;

CALL `clip_record_status_and_selection_status_20260526`();

DROP PROCEDURE IF EXISTS `clip_record_status_and_selection_status_20260526`;
