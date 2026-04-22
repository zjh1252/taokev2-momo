-- ============================================================
-- V42: 回填 / 修正 历史绑定记录的 initiator_user_id 字段
--   背景：V41 之前的旧绑定流程未记录 initiator_user_id，导致
--   `requireEmployeeBindingConfirmer` / `requireEnterpriseAgentMemberConfirmer`
--   走入「默认由员工/经纪人本人处理」分支，机构 / 经纪公司侧点击通过/拒绝
--   会被错误地拦下，提示「无权处理该绑定」。
--
--   策略：
--     1) user_institution_employee_bindings：
--        历史 PENDING / ACTIVE 记录中 initiator_user_id IS NULL 的，
--        默认认为是「机构主动邀请」（旧流程的唯一路径），
--        backfill 为对应机构的 user_id（user_institutions.user_id）。
--     2) user_enterprise_agent_members：
--        同理，backfill 为对应经纪公司的 user_id（user_enterprise_agents.user_id）。
--
--   旧 PENDING 记录回填后：
--     - initiator = institution_user_id ≠ employee_user_id
--       → 走「机构邀请、员工确认」分支（与旧流程语义一致）。
--     - 机构侧不会再看到「通过/拒绝」按钮（因为 iAmInitiator = true）。
--     - 员工侧在「我的机构 → 待我确认」可正常处理。
-- ============================================================

-- ------------------------------------------------------------
-- 1) 机构员工绑定 — 回填 initiator_user_id
-- ------------------------------------------------------------
UPDATE `user_institution_employee_bindings` b
JOIN `user_institutions` ui ON ui.id = b.org_id
SET b.initiator_user_id = ui.user_id
WHERE b.initiator_user_id IS NULL
  AND ui.user_id IS NOT NULL;

-- ------------------------------------------------------------
-- 2) 经纪公司成员 — 回填 initiator_user_id
-- ------------------------------------------------------------
UPDATE `user_enterprise_agent_members` m
JOIN `user_enterprise_agents` ea ON ea.id = m.enterprise_agent_id
SET m.initiator_user_id = ea.user_id
WHERE m.initiator_user_id IS NULL
  AND ea.user_id IS NOT NULL;
