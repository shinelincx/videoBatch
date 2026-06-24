CREATE TABLE IF NOT EXISTS `robot` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `machine_name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '机器名称',
  `mac_address` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'MAC地址',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT '待机' COMMENT '当前状态：离线、待机、运行中、暂停中',
  `current_command` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '当前待执行命令：start、resume、pause、stop、login、publish',
  `last_command` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '最近执行命令',
  `last_heartbeat_time` datetime NULL DEFAULT NULL COMMENT '最后心跳时间',
  `command_time` datetime NULL DEFAULT NULL COMMENT '命令下发时间',
  `tenant_id` bigint NULL DEFAULT NULL COMMENT '租户标识',
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint NULL DEFAULT 0 COMMENT '删除标识：0正常 1删除',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_robot_tenant_machine` (`tenant_id`, `machine_name`, `deleted`) USING BTREE,
  KEY `idx_robot_last_heartbeat_time` (`last_heartbeat_time`) USING BTREE
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci
  COMMENT = '机器人管理表'
  ROW_FORMAT = Dynamic;
