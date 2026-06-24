DROP PROCEDURE IF EXISTS `publish_config_publish_limits_20260615`;

DELIMITER $$
CREATE PROCEDURE `publish_config_publish_limits_20260615`()
BEGIN
  DECLARE current_schema_name VARCHAR(128) DEFAULT DATABASE();

  IF EXISTS (
    SELECT 1 FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = current_schema_name
      AND TABLE_NAME = 'publish_config'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = current_schema_name
        AND TABLE_NAME = 'publish_config'
        AND COLUMN_NAME = 'max_daily_publish'
    ) THEN
      ALTER TABLE `publish_config` DROP COLUMN `max_daily_publish`;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = current_schema_name
        AND TABLE_NAME = 'publish_config'
        AND COLUMN_NAME = 'max_daily_publish_count'
    ) THEN
      ALTER TABLE `publish_config` DROP COLUMN `max_daily_publish_count`;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = current_schema_name
        AND TABLE_NAME = 'publish_config'
        AND COLUMN_NAME = 'daily_max_publish_count'
    ) THEN
      ALTER TABLE `publish_config` DROP COLUMN `daily_max_publish_count`;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = current_schema_name
        AND TABLE_NAME = 'publish_config'
        AND COLUMN_NAME = 'dailyMaxPublishCount'
    ) THEN
      ALTER TABLE `publish_config` DROP COLUMN `dailyMaxPublishCount`;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = current_schema_name
        AND TABLE_NAME = 'publish_config'
        AND COLUMN_NAME = 'publish_interval'
    ) THEN
      ALTER TABLE `publish_config`
        ADD COLUMN `publish_interval` int NULL DEFAULT 0
        COMMENT '发布间隔频率(分钟)';
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = current_schema_name
        AND TABLE_NAME = 'publish_config'
        AND COLUMN_NAME = 'publishInterval'
    ) THEN
      UPDATE `publish_config`
      SET `publish_interval` = `publishInterval`
      WHERE `publishInterval` IS NOT NULL
        AND (`publish_interval` IS NULL OR `publish_interval` = 0);
    END IF;
  END IF;
END$$
DELIMITER ;

CALL `publish_config_publish_limits_20260615`();

DROP PROCEDURE IF EXISTS `publish_config_publish_limits_20260615`;
