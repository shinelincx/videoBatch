-- product_selection_records 字段调整：
-- 1. category 改为 product_category_id
-- 2. account / selection_account_nickname / account_id 统一为 account_nickname
-- 3. 删除 strategy_name

DROP PROCEDURE IF EXISTS `migrate_product_selection_records_20260523`;

DELIMITER $$
CREATE PROCEDURE `migrate_product_selection_records_20260523`()
BEGIN
  DECLARE current_schema_name VARCHAR(128) DEFAULT DATABASE();

  IF EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = current_schema_name
      AND TABLE_NAME = 'product_selection_records'
      AND COLUMN_NAME = 'category'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = current_schema_name
      AND TABLE_NAME = 'product_selection_records'
      AND COLUMN_NAME = 'product_category_id'
  ) THEN
    ALTER TABLE `product_selection_records`
      ADD COLUMN `product_category_id` bigint NULL DEFAULT NULL COMMENT '商品类目ID';

    UPDATE `product_selection_records`
    SET `product_category_id` = CAST(`category` AS UNSIGNED)
    WHERE `category` REGEXP '^[0-9]+$';

    IF EXISTS (
      SELECT 1 FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = current_schema_name
        AND TABLE_NAME = 'product_category'
    ) THEN
      UPDATE `product_selection_records` psr
      JOIN `product_category` pc
        ON pc.`name` = psr.`category`
       AND IFNULL(pc.`deleted`, 0) = 0
      SET psr.`product_category_id` = pc.`id`
      WHERE psr.`product_category_id` IS NULL
        AND psr.`category` IS NOT NULL
        AND psr.`category` <> '';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = current_schema_name
      AND TABLE_NAME = 'product_selection_records'
      AND COLUMN_NAME = 'category'
  ) THEN
    ALTER TABLE `product_selection_records`
      DROP COLUMN `category`;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = current_schema_name
      AND TABLE_NAME = 'product_selection_records'
      AND COLUMN_NAME = 'account_nickname'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = current_schema_name
        AND TABLE_NAME = 'product_selection_records'
        AND COLUMN_NAME = 'account'
    ) THEN
      ALTER TABLE `product_selection_records`
        CHANGE COLUMN `account` `account_nickname` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '账号昵称';
    ELSEIF EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = current_schema_name
        AND TABLE_NAME = 'product_selection_records'
        AND COLUMN_NAME = 'selection_account_nickname'
    ) THEN
      ALTER TABLE `product_selection_records`
        CHANGE COLUMN `selection_account_nickname` `account_nickname` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '账号昵称';
    ELSEIF EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = current_schema_name
        AND TABLE_NAME = 'product_selection_records'
        AND COLUMN_NAME = 'account_id'
    ) THEN
      ALTER TABLE `product_selection_records`
        ADD COLUMN `account_nickname` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '账号昵称';

      IF EXISTS (
        SELECT 1 FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = current_schema_name
          AND TABLE_NAME = 'account'
      ) THEN
        UPDATE `product_selection_records` psr
        LEFT JOIN `account` a ON a.`id` = psr.`account_id`
        SET psr.`account_nickname` = COALESCE(a.`nickname`, CAST(psr.`account_id` AS CHAR))
        WHERE psr.`account_nickname` IS NULL;
      ELSE
        UPDATE `product_selection_records`
        SET `account_nickname` = CAST(`account_id` AS CHAR)
        WHERE `account_nickname` IS NULL;
      END IF;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = current_schema_name
      AND TABLE_NAME = 'product_selection_records'
      AND COLUMN_NAME = 'account_id'
  ) THEN
    ALTER TABLE `product_selection_records`
      DROP COLUMN `account_id`;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = current_schema_name
      AND TABLE_NAME = 'product_selection_records'
      AND COLUMN_NAME = 'account'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = current_schema_name
      AND TABLE_NAME = 'product_selection_records'
      AND COLUMN_NAME = 'account_nickname'
  ) THEN
    ALTER TABLE `product_selection_records`
      DROP COLUMN `account`;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = current_schema_name
      AND TABLE_NAME = 'product_selection_records'
      AND COLUMN_NAME = 'selection_account_nickname'
  ) THEN
    ALTER TABLE `product_selection_records`
      DROP COLUMN `selection_account_nickname`;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = current_schema_name
      AND TABLE_NAME = 'product_selection_records'
      AND COLUMN_NAME = 'strategy_name'
  ) THEN
    ALTER TABLE `product_selection_records`
      DROP COLUMN `strategy_name`;
  END IF;
END$$
DELIMITER ;

CALL `migrate_product_selection_records_20260523`();

DROP PROCEDURE IF EXISTS `migrate_product_selection_records_20260523`;
