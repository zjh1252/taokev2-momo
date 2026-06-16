-- 录播课分类兜底：category_id=0 归入「其它」
INSERT IGNORE INTO sys_categories (parent_id, name, level, sort_order, is_visible, type, icon, description)
VALUES (0, '其它', 1, 99, 1, 'VIDEO_COURSE', '', '未归类的录播课');

UPDATE videos v
SET v.category_id = (
    SELECT id FROM sys_categories
    WHERE type = 'VIDEO_COURSE' AND name = '其它' LIMIT 1
)
WHERE v.category_id = 0;
