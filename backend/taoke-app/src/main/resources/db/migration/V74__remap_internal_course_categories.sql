-- V74：内训课分类 ID 按老库 tk_cate 名称对齐 sys_categories
-- 背景：迁移阶段将 tk_courseinfo.cid 写入 sub_category_id，与新版分类树 ID 不一致，导致侧栏筛选无效

SET @legacy_cate_ok := (
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'taoke' AND table_name = 'tk_cate'
);

SET @sql := IF(@legacy_cate_ok > 0,
'UPDATE courses c
INNER JOIN taoke.tk_cate tc ON tc.id = c.sub_category_id
INNER JOIN sys_categories sc
    ON sc.type = ''COURSE_CATEGORY''
   AND TRIM(sc.name) = TRIM(tc.name)
SET c.category_id = CASE WHEN sc.level = 2 AND sc.parent_id > 0 THEN sc.parent_id ELSE sc.id END,
    c.sub_category_id = CASE WHEN sc.level = 2 AND sc.parent_id > 0 THEN sc.id ELSE 0 END
WHERE c.type = ''INTERNAL''
  AND c.status = 2
  AND c.sub_category_id > 0',
'SELECT 1 AS flyway_v74_skip_legacy_category_remap');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
