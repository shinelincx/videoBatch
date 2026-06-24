-- clip_rule_item 去除 rule_id：
-- 规则与规则项的关系迁移到 clip_rule_rule_item，clip_rule_item 仅保存规则项定义。

DROP PROCEDURE IF EXISTS `migrate_clip_rule_rule_item_20260526`;

DELIMITER $$
CREATE PROCEDURE `migrate_clip_rule_rule_item_20260526`()
BEGIN
  DECLARE current_schema_name VARCHAR(128) DEFAULT DATABASE();

  IF EXISTS (
    SELECT 1 FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = current_schema_name
      AND TABLE_NAME = 'clip_rule_item'
  ) THEN
    CREATE TABLE IF NOT EXISTS `clip_rule_rule_item` (
      `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
      `rule_id` bigint NOT NULL COMMENT '所属规则ID（关联 clip_rule 表）',
      `rule_item_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '规则项名称',
      `content` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '当前规则项内容（关联的时候覆盖规则项的content）',
      `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态：1=启用，0=禁用',
      `seq` int NOT NULL DEFAULT 0 COMMENT '排序（数值越小越靠前）',
      `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      `update_time` datetime NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      `deleted` tinyint NULL DEFAULT 0 COMMENT '删除标识： 0正常 1删除',
      `tenant_id` bigint NULL DEFAULT NULL COMMENT '租户标识',
      PRIMARY KEY (`id`) USING BTREE,
      INDEX `idx_rule_id`(`rule_id` ASC) USING BTREE
    ) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '剪辑规则与规则项关联表' ROW_FORMAT = Dynamic;

    IF EXISTS (
      SELECT 1 FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = current_schema_name
        AND TABLE_NAME = 'clip_rule_item_rel'
    ) THEN
      INSERT INTO `clip_rule_rule_item` (`rule_id`, `rule_item_id`, `content`, `status`, `seq`, `deleted`)
      SELECT r.`rule_id`, LEFT(i.`name`, 128), LEFT(i.`content`, 100), IFNULL(i.`status`, 1), IFNULL(r.`seq`, IFNULL(i.`seq`, 0)), IFNULL(r.`deleted`, 0)
      FROM `clip_rule_item_rel` r
      INNER JOIN `clip_rule_item` i ON i.`id` = r.`item_id`
      WHERE i.`name` IS NOT NULL
        AND TRIM(i.`name`) <> ''
        AND NOT EXISTS (
          SELECT 1
          FROM `clip_rule_rule_item` nr
          WHERE nr.`rule_id` = r.`rule_id`
            AND nr.`rule_item_id` = LEFT(i.`name`, 128)
        );
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = current_schema_name
        AND TABLE_NAME = 'clip_rule_item'
        AND COLUMN_NAME = 'rule_id'
    ) THEN
      INSERT INTO `clip_rule_rule_item` (`rule_id`, `rule_item_id`, `content`, `status`, `seq`, `deleted`)
      SELECT i.`rule_id`, LEFT(i.`name`, 128), LEFT(i.`content`, 100), IFNULL(i.`status`, 1), IFNULL(i.`seq`, 0), IFNULL(i.`deleted`, 0)
      FROM `clip_rule_item` i
      WHERE i.`rule_id` IS NOT NULL
        AND i.`name` IS NOT NULL
        AND TRIM(i.`name`) <> ''
        AND NOT EXISTS (
          SELECT 1
          FROM `clip_rule_rule_item` r
          WHERE r.`rule_id` = i.`rule_id`
            AND r.`rule_item_id` = LEFT(i.`name`, 128)
        );

      ALTER TABLE `clip_rule_item`
        DROP COLUMN `rule_id`;
    END IF;
  END IF;
END$$
DELIMITER ;

CALL `migrate_clip_rule_rule_item_20260526`();

DROP PROCEDURE IF EXISTS `migrate_clip_rule_rule_item_20260526`;
