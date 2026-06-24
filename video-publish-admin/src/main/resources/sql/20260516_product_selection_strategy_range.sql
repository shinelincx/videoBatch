ALTER TABLE `product_selection_strategy`
  ADD COLUMN `commission_min` decimal(10,2) NULL DEFAULT NULL COMMENT '佣金金额下限' AFTER `category`,
  ADD COLUMN `commission_max` decimal(10,2) NULL DEFAULT NULL COMMENT '佣金金额上限' AFTER `commission_min`,
  ADD COLUMN `commission_rate_min` decimal(10,2) NULL DEFAULT NULL COMMENT '佣金率下限' AFTER `commission_max`,
  ADD COLUMN `commission_rate_max` decimal(10,2) NULL DEFAULT NULL COMMENT '佣金率上限' AFTER `commission_rate_min`,
  ADD COLUMN `price_min` decimal(10,2) NULL DEFAULT NULL COMMENT '商品价格下限' AFTER `commission_rate_max`,
  ADD COLUMN `price_max` decimal(10,2) NULL DEFAULT NULL COMMENT '商品价格上限' AFTER `price_min`,
  ADD COLUMN `order_ratio_min` decimal(10,2) NULL DEFAULT NULL COMMENT '出单比下限' AFTER `price_max`,
  ADD COLUMN `order_ratio_max` decimal(10,2) NULL DEFAULT NULL COMMENT '出单比上限' AFTER `order_ratio_min`,
  ADD COLUMN `product_rating_min` decimal(3,1) NULL DEFAULT NULL COMMENT '商品评分下限' AFTER `order_ratio_max`,
  ADD COLUMN `product_rating_max` decimal(3,1) NULL DEFAULT NULL COMMENT '商品评分上限' AFTER `product_rating_min`;

UPDATE `product_selection_strategy`
SET
  `commission_min` = COALESCE(`commission_min`, `commission`),
  `commission_max` = COALESCE(`commission_max`, `commission`),
  `commission_rate_min` = COALESCE(`commission_rate_min`, `commission_rate`),
  `commission_rate_max` = COALESCE(`commission_rate_max`, `commission_rate`),
  `price_min` = COALESCE(`price_min`, `price`),
  `price_max` = COALESCE(`price_max`, `price`),
  `order_ratio_min` = COALESCE(`order_ratio_min`, `order_ratio`),
  `order_ratio_max` = COALESCE(`order_ratio_max`, `order_ratio`),
  `product_rating_min` = COALESCE(`product_rating_min`, `product_rating`),
  `product_rating_max` = COALESCE(`product_rating_max`, `product_rating`);

ALTER TABLE `product_selection_strategy`
  DROP COLUMN `commission`,
  DROP COLUMN `commission_rate`,
  DROP COLUMN `price`,
  DROP COLUMN `order_ratio`,
  DROP COLUMN `product_rating`;
