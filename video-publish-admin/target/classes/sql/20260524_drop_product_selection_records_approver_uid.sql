-- 删除选品记录表旧审核人字段。

DROP PROCEDURE IF EXISTS `drop_product_selection_records_approver_uid_20260524`;

DELIMITER $$
CREATE PROCEDURE `drop_product_selection_records_approver_uid_20260524`()
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'product_selection_records'
      AND COLUMN_NAME = 'selection_approver_uid'
  ) THEN
    ALTER TABLE `product_selection_records`
      DROP COLUMN `selection_approver_uid`;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'product_selection_records'
      AND COLUMN_NAME = 'publish_approver_uid'
  ) THEN
    ALTER TABLE `product_selection_records`
      DROP COLUMN `publish_approver_uid`;
  END IF;
END$$
DELIMITER ;

CALL `drop_product_selection_records_approver_uid_20260524`();

DROP PROCEDURE IF EXISTS `drop_product_selection_records_approver_uid_20260524`;
