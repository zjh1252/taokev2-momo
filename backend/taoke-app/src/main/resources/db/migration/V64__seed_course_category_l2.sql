-- ==============================================================
-- V64: 课程分类二级子类（与 TRAINER_EXPERTISE 子类对齐）
-- ==============================================================

INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`)
SELECT
    'COURSE_CATEGORY',
    cc.id,
    te_child.name,
    2,
    te_child.sort_order,
    te_child.is_visible
FROM `sys_categories` te_child
         INNER JOIN `sys_categories` te_parent
                    ON te_child.parent_id = te_parent.id
                        AND te_parent.type = 'TRAINER_EXPERTISE'
                        AND te_parent.parent_id = 0
         INNER JOIN `sys_categories` cc
                    ON cc.name = te_parent.name
                        AND cc.type = 'COURSE_CATEGORY'
                        AND cc.parent_id = 0
WHERE te_child.type = 'TRAINER_EXPERTISE'
  AND te_child.level = 2
  AND NOT EXISTS (SELECT 1
                  FROM `sys_categories` existing
                  WHERE existing.type = 'COURSE_CATEGORY'
                    AND existing.parent_id = cc.id
                    AND existing.name = te_child.name);
