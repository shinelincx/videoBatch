-- 账号商品类目调整：
-- 1. account 增加 product_category_id
-- 2. 将 account_product_category 的已有关系迁移到 account.product_category_id
-- 3. 删除 account.category_names / account.category_ids
-- 4. 删除 account_product_category 表

DROP PROCEDURE IF EXISTS `migrate_account_product_category_20260523`;

DELIMITER $$
CREATE PROCEDURE `migrate_account_product_category_20260523`()
BEGIN
  DECLARE current_schema_name VARCHAR(128) DEFAULT DATABASE();

  IF EXISTS (
    SELECT 1 FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = current_schema_name
      AND TABLE_NAME = 'account'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = current_schema_name
      AND TABLE_NAME = 'account'
      AND COLUMN_NAME = 'product_category_id'
  ) THEN
    ALTER TABLE `account`
      ADD COLUMN `product_category_id` bigint NULL DEFAULT NULL COMMENT '商品类目ID';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = current_schema_name
      AND TABLE_NAME = 'account'
      AND COLUMN_NAME = 'product_category_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = current_schema_name
      AND TABLE_NAME = 'account_product_category'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = current_schema_name
      AND TABLE_NAME = 'account_product_category'
      AND COLUMN_NAME = 'account_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = current_schema_name
      AND TABLE_NAME = 'account_product_category'
      AND COLUMN_NAME = 'category_id'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = current_schema_name
        AND TABLE_NAME = 'account_product_category'
        AND COLUMN_NAME = 'deleted'
    ) THEN
      UPDATE `account` a
      JOIN (
        SELECT `account_id`, MIN(`category_id`) AS `category_id`
        FROM `account_product_category`
        WHERE IFNULL(`deleted`, 0) = 0
        GROUP BY `account_id`
      ) apc ON apc.`account_id` = a.`id`
      SET a.`product_category_id` = apc.`category_id`
      WHERE a.`product_category_id` IS NULL;
    ELSE
      UPDATE `account` a
      JOIN (
        SELECT `account_id`, MIN(`category_id`) AS `category_id`
        FROM `account_product_category`
        GROUP BY `account_id`
      ) apc ON apc.`account_id` = a.`id`
      SET a.`product_category_id` = apc.`category_id`
      WHERE a.`product_category_id` IS NULL;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = current_schema_name
      AND TABLE_NAME = 'account'
      AND COLUMN_NAME = 'product_category_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = current_schema_name
      AND TABLE_NAME = 'account'
      AND COLUMN_NAME = 'category_ids'
  ) THEN
    UPDATE `account`
    SET `product_category_id` = CAST(SUBSTRING_INDEX(`category_ids`, ',', 1) AS UNSIGNED)
    WHERE `product_category_id` IS NULL
      AND `category_ids` REGEXP '^[0-9]+';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = current_schema_name
      AND TABLE_NAME = 'account'
      AND COLUMN_NAME = 'product_category_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = current_schema_name
      AND TABLE_NAME = 'account'
      AND COLUMN_NAME = 'category_names'
  ) THEN
    UPDATE `account`
    SET `product_category_id` = CAST(`category_names` AS UNSIGNED)
    WHERE `product_category_id` IS NULL
      AND `category_names` REGEXP '^[0-9]+$';

    IF EXISTS (
      SELECT 1 FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = current_schema_name
        AND TABLE_NAME = 'product_category'
    ) THEN
      UPDATE `account` a
      JOIN `product_category` pc
        ON pc.`name` = a.`category_names`
       AND IFNULL(pc.`deleted`, 0) = 0
      SET a.`product_category_id` = pc.`id`
      WHERE a.`product_category_id` IS NULL
        AND a.`category_names` IS NOT NULL
        AND a.`category_names` <> '';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = current_schema_name
      AND TABLE_NAME = 'account'
      AND COLUMN_NAME = 'category_names'
  ) THEN
    ALTER TABLE `account`
      DROP COLUMN `category_names`;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = current_schema_name
      AND TABLE_NAME = 'account'
      AND COLUMN_NAME = 'category_ids'
  ) THEN
    ALTER TABLE `account`
      DROP COLUMN `category_ids`;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = current_schema_name
      AND TABLE_NAME = 'account_product_category'
  ) THEN
    DROP TABLE `account_product_category`;
  END IF;
END$$
DELIMITER ;

CALL `migrate_account_product_category_20260523`();

DROP PROCEDURE IF EXISTS `migrate_account_product_category_20260523`;
