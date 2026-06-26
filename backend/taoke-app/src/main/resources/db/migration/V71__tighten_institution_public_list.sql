-- V71：收紧机构公开列表（排除仅有 TRAINER 课、无机构课的专家发课账号）
-- 并将应隐藏的专家 organ 行 status=2，使未重启后端时旧 API（仅筛 status=1）也立即生效

UPDATE user_institutions SET public_list_eligible = 0 WHERE status = 1;

UPDATE user_institutions ui
SET ui.public_list_eligible = 1
WHERE ui.status = 1
  AND ui.org_name NOT LIKE '未命名机构#%'
  AND (
    COALESCE(ui.org_type, 0) > 0
    OR EXISTS (
        SELECT 1 FROM courses c
        WHERE c.publisher_id = ui.user_id
          AND c.publisher_type = 'INSTITUTION'
          AND c.status = 2
    )
    OR ui.org_name REGEXP '公司|集团|中心|学院|咨询|有限|工作室|培训|教育|University|Inc|Ltd'
  )
  AND NOT (
    EXISTS (
        SELECT 1 FROM user_trainers ut
        WHERE ut.user_id = ui.user_id AND ut.status = 2
    )
    AND NOT EXISTS (
        SELECT 1 FROM courses c
        WHERE c.publisher_id = ui.user_id
          AND c.publisher_type = 'INSTITUTION'
          AND c.status = 2
    )
    AND ui.org_name NOT REGEXP '公司|集团|中心|学院|咨询|有限|工作室|培训|教育|University|Inc|Ltd'
  )
  AND NOT (
    COALESCE(ui.org_type, 0) = 0
    AND ui.org_name NOT REGEXP '公司|集团|中心|学院|咨询|有限|工作室|培训|教育|University|Inc|Ltd'
    AND EXISTS (
        SELECT 1 FROM courses c
        WHERE c.publisher_id = ui.user_id
          AND c.publisher_type = 'TRAINER'
          AND c.status = 2
    )
    AND NOT EXISTS (
        SELECT 1 FROM courses c
        WHERE c.publisher_id = ui.user_id
          AND c.publisher_type = 'INSTITUTION'
          AND c.status = 2
    )
  );

-- 专家-only organ：公开列表不可见（兼容尚未重启、未加载 publicListEligible 的后端）
UPDATE user_institutions ui
SET ui.status = 2
WHERE ui.status = 1
  AND ui.public_list_eligible = 0
  AND (
    EXISTS (
        SELECT 1 FROM user_trainers ut
        WHERE ut.user_id = ui.user_id AND ut.status = 2
    )
    OR (
        EXISTS (
            SELECT 1 FROM courses c
            WHERE c.publisher_id = ui.user_id
              AND c.publisher_type = 'TRAINER'
              AND c.status = 2
        )
        AND NOT EXISTS (
            SELECT 1 FROM courses c
            WHERE c.publisher_id = ui.user_id
              AND c.publisher_type = 'INSTITUTION'
              AND c.status = 2
        )
    )
  );
