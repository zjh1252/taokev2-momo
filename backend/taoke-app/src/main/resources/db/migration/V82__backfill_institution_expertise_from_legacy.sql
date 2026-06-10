-- V82：机构擅长领域 / 擅长行业从老库 tk_member 回填
-- 背景：V46 将 specialties / industries 语义改为 sys_categories ID 逗号串，但迁移阶段未写入；
--       侧栏「培训机构类别」依赖 expertiseCategoryId 匹配 specialties，空数据导致分类导航为空。
-- 依赖：老库 taoke 与新库 v3test 同 MySQL 实例（与 V68 / V74 相同）

-- 1) 擅长领域：tk_member.cid（逗号分隔 tk_cate id）→ TRAINER_EXPERTISE 一级 sys_categories id
UPDATE user_institutions ui
INNER JOIN (
    SELECT
        m.id AS member_id,
        GROUP_CONCAT(DISTINCT sc.id ORDER BY sc.id SEPARATOR ',') AS specialty_ids
    FROM taoke.tk_member m
    INNER JOIN taoke.tk_cate tc
        ON FIND_IN_SET(tc.id, REPLACE(COALESCE(m.cid, ''), ' ', '')) > 0
    INNER JOIN taoke.tk_cate tl1
        ON tl1.id = CASE WHEN COALESCE(tc.sub, 0) > 0 THEN tc.sub ELSE tc.id END
    INNER JOIN sys_categories sc
        ON sc.type = 'TRAINER_EXPERTISE'
       AND sc.level = 1
       AND TRIM(sc.name) = TRIM(tl1.name)
    WHERE m.cid IS NOT NULL
      AND TRIM(m.cid) <> ''
    GROUP BY m.id
) src ON src.member_id = ui.id
SET ui.specialties = src.specialty_ids,
    ui.updated_at = NOW()
WHERE ui.status = 1
  AND ui.public_list_eligible = 1
  AND (
      ui.specialties IS NULL
      OR TRIM(ui.specialties) = ''
      OR ui.specialties NOT REGEXP '^[0-9]+(,[0-9]+)*$'
  );

-- 2a) 擅长行业：trade 存数字 ID 时走 tk_trade
UPDATE user_institutions ui
INNER JOIN taoke.tk_member m ON m.id = ui.id
INNER JOIN taoke.tk_trade tt ON tt.id = CAST(m.trade AS UNSIGNED)
INNER JOIN sys_categories sc
    ON sc.type = 'TRAINER_INDUSTRY'
   AND sc.level = 1
   AND TRIM(sc.name) = TRIM(tt.name)
SET ui.industries = CAST(sc.id AS CHAR),
    ui.updated_at = NOW()
WHERE ui.status = 1
  AND ui.public_list_eligible = 1
  AND m.trade REGEXP '^[0-9]+$'
  AND CAST(m.trade AS UNSIGNED) > 0
  AND (
      ui.industries IS NULL
      OR TRIM(ui.industries) = ''
      OR ui.industries NOT REGEXP '^[0-9]+(,[0-9]+)*$'
  );

-- 2b) 擅长行业：trade 存行业名称时直接匹配 sys_categories（老库 trade 为 varchar 文本）
UPDATE user_institutions ui
INNER JOIN taoke.tk_member m ON m.id = ui.id
INNER JOIN sys_categories sc
    ON sc.type = 'TRAINER_INDUSTRY'
   AND sc.level = 1
   AND TRIM(sc.name) = TRIM(m.trade)
SET ui.industries = CAST(sc.id AS CHAR),
    ui.updated_at = NOW()
WHERE ui.status = 1
  AND ui.public_list_eligible = 1
  AND m.trade IS NOT NULL
  AND TRIM(m.trade) <> ''
  AND m.trade NOT REGEXP '^[0-9]+$'
  AND m.trade NOT LIKE '%,%'
  AND (
      ui.industries IS NULL
      OR TRIM(ui.industries) = ''
      OR ui.industries NOT REGEXP '^[0-9]+(,[0-9]+)*$'
  );
