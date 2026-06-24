DROP PROCEDURE IF EXISTS `publish_account_login_status_20260615`;

DELIMITER $$
CREATE PROCEDURE `publish_account_login_status_20260615`()
BEGIN
  DECLARE current_schema_name VARCHAR(128) DEFAULT DATABASE();

  IF EXISTS (
    SELECT 1 FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = current_schema_name
      AND TABLE_NAME = 'publish_account'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = current_schema_name
        AND TABLE_NAME = 'publish_account'
        AND COLUMN_NAME = 'login_status'
    ) THEN
      ALTER TABLE `publish_account`
        ADD COLUMN `login_status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '未登录'
        COMMENT '登录状态：未登录、已登录、异常';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = current_schema_name
        AND TABLE_NAME = 'publish_account'
        AND COLUMN_NAME = 'login_error_reason'
    ) THEN
      ALTER TABLE `publish_account`
        ADD COLUMN `login_error_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL
        COMMENT '登录异常原因';
    END IF;
  END IF;
END$$
DELIMITER ;

CALL `publish_account_login_status_20260615`();

DROP PROCEDURE IF EXISTS `publish_account_login_status_20260615`;

