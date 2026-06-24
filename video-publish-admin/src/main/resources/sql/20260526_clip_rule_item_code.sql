-- 剪辑规则项增加规则项代码字段。

DROP PROCEDURE IF EXISTS `add_clip_rule_item_code_20260526`;

DELIMITER $$
CREATE PROCEDURE `add_clip_rule_item_code_20260526`()
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'clip_rule_item'
      AND COLUMN_NAME = 'code'
  ) THEN
    ALTER TABLE `clip_rule_item`
      ADD COLUMN `code` varchar(64) NOT NULL DEFAULT '' COMMENT '规则项代码' AFTER `id`;

    ALTER TABLE `clip_rule_item`
      ALTER COLUMN `code` DROP DEFAULT;
  END IF;
END$$
DELIMITER ;

CALL `add_clip_rule_item_code_20260526`();

DROP PROCEDURE IF EXISTS `add_clip_rule_item_code_20260526`;
