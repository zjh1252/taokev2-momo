-- V75：排除「仅有讲师课/专家档案、无机构课」的 organ 行（不因 org_name 含「有限公司」放行）
-- 案例：id=31513 安秋明/CareerPower，老站无 /company/31513，23 门 mold=2 讲师课

UPDATE user_institutions ui
SET ui.public_list_eligible = 0
WHERE ui.status = 1
  AND ui.public_list_eligible = 1
  AND COALESCE(ui.org_type, 0) = 0
  AND NOT EXISTS (
      SELECT 1 FROM courses c
      WHERE c.publisher_id = ui.user_id
        AND c.publisher_type = 'INSTITUTION'
        AND c.status = 2
  )
  AND (
      EXISTS (
          SELECT 1 FROM courses c
          WHERE c.publisher_id = ui.user_id
            AND c.publisher_type = 'TRAINER'
            AND c.status = 2
      )
      OR EXISTS (
          SELECT 1 FROM user_trainers ut
          WHERE ut.user_id = ui.user_id
      )
  );

-- 未重启后端时：旧 API 仅筛 status=1，同步下线
UPDATE user_institutions ui
SET ui.status = 2
WHERE ui.status = 1
  AND ui.public_list_eligible = 0
  AND COALESCE(ui.org_type, 0) = 0
  AND NOT EXISTS (
      SELECT 1 FROM courses c
      WHERE c.publisher_id = ui.user_id
        AND c.publisher_type = 'INSTITUTION'
        AND c.status = 2
  )
  AND (
      EXISTS (
          SELECT 1 FROM courses c
          WHERE c.publisher_id = ui.user_id
            AND c.publisher_type = 'TRAINER'
            AND c.status = 2
      )
      OR EXISTS (
          SELECT 1 FROM user_trainers ut
          WHERE ut.user_id = ui.user_id
      )
  );
