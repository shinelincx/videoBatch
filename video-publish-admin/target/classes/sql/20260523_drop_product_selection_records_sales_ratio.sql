-- 删除选品记录表出单比字段。

DROP PROCEDURE IF EXISTS `drop_product_selection_records_sales_ratio_20260523`;

DELIMITER $$
CREATE PROCEDURE `drop_product_selection_records_sales_ratio_20260523`()
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'product_selection_records'
      AND COLUMN_NAME = 'sales_ratio'
  ) THEN
    ALTER TABLE `product_selection_records`
      DROP COLUMN `sales_ratio`;
  END IF;
END$$
DELIMITER ;

CALL `drop_product_selection_records_sales_ratio_20260523`();

DROP PROCEDURE IF EXISTS `drop_product_selection_records_sales_ratio_20260523`;
