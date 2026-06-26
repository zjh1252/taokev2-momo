-- 机构公开列表：排除「仅专家发课、无机构主体」的会员行
-- 老站 /company/ 列表含约 1.5 万发课 organid，其中大量为 mold=2 专家课且无公司名，展示为人名+头像

ALTER TABLE user_institutions
    ADD COLUMN public_list_eligible TINYINT(1) NOT NULL DEFAULT 1
        COMMENT '是否在 C 端机构频道公开展示：0=否 1=是'
    AFTER status;

-- 默认全部不可展示，再按规则打开
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
    OR ui.org_name REGEXP '公司|集团|中心|学院|咨询|有限|工作室|University|Inc|Ltd'
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
    AND ui.org_name NOT REGEXP '公司|集团|中心|学院|咨询|有限|工作室|University|Inc|Ltd'
  );

-- 待审/下线行不参与公开列表
UPDATE user_institutions SET public_list_eligible = 0 WHERE status <> 1;

CREATE INDEX idx_user_institutions_public_list
    ON user_institutions (status, public_list_eligible, sort_order, view_count);
