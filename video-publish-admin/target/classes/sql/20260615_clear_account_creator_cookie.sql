DROP PROCEDURE IF EXISTS `clear_account_creator_cookie_20260615`;

DELIMITER $$
CREATE PROCEDURE `clear_account_creator_cookie_20260615`()
BEGIN
  DECLARE current_schema_name VARCHAR(128) DEFAULT DATABASE();

  IF EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = current_schema_name
      AND TABLE_NAME = 'account'
      AND COLUMN_NAME = 'creator_cookie'
  ) THEN
    UPDATE `account`
    SET `creator_cookie` = NULL
    WHERE `creator_cookie` IS NOT NULL;
  END IF;
END$$
DELIMITER ;

CALL `clear_account_creator_cookie_20260615`();

DROP PROCEDURE IF EXISTS `clear_account_creator_cookie_20260615`;
