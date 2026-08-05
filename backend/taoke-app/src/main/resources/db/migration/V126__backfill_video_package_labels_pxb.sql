-- 回填 video_package_labels 的培训宝展示字段。
-- 仅在相关列/表存在时执行，保证可重复运行。

SET @sql := IF(
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'topic_id'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'topic_name'
    ),
    'UPDATE video_package_labels
     SET topic_id = id,
         topic_name = name
     WHERE topic_id = 0 OR topic_name = ''''',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'price'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'company_price'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_name = 'video_package_groups'
    ),
    'UPDATE video_package_labels l
     INNER JOIN (
         SELECT package_id,
                MIN(price) AS min_price,
                MIN(company_price) AS min_company_price
         FROM video_package_groups
         GROUP BY package_id
     ) g ON g.package_id = l.id
     SET l.price = IF(l.price = 0, CAST(g.min_price AS SIGNED), l.price),
         l.company_price = IF(l.company_price = 0, g.min_company_price, l.company_price)
     WHERE l.price = 0 OR l.company_price = 0',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'item_parent'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'topic_id'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'price'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'video_package_labels' AND column_name = 'company_price'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_name = 'video_package_groups'
    ),
    'UPDATE video_package_labels l
     INNER JOIN video_package_groups g ON g.id = l.id
     SET l.name = IF(l.name = '''' OR l.name IS NULL, g.name, l.name),
         l.item_parent = IF(l.item_parent = 0 AND g.parent_id > 0, g.package_id, l.item_parent),
         l.topic_id = IF(l.topic_id = 0, g.topic_id, l.topic_id),
         l.price = IF(l.price = 0, CAST(g.price AS SIGNED), l.price),
         l.company_price = IF(l.company_price = 0, g.company_price, l.company_price)
     WHERE g.parent_id > 0 OR g.topic_id > 0',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
