-- ============================================================
-- V47: 修复 user_institutions.has_venue / has_experts 列类型
--
-- 背景：V46 把这两列声明为 TINYINT(1)，MySQL JDBC 驱动默认会把
-- TINYINT(1) 上报为 BIT 类型，与 Hibernate 实体字段（Integer，
-- columnDefinition=tinyint）期望的 TINYINT/INTEGER 校验不一致，
-- 启动时报：
--   Schema-validation: wrong column type encountered in column [has_experts]
--   in table [user_institutions]; found [bit], but expecting [tinyint(1)]
--
-- 与同表 show_contact / org_type 等列对齐，统一改成 TINYINT (无长度)。
-- ============================================================

ALTER TABLE `user_institutions`
    MODIFY COLUMN `has_venue` TINYINT NOT NULL DEFAULT 0 COMMENT '是否有场地：0=否，1=是',
    MODIFY COLUMN `has_experts` TINYINT NOT NULL DEFAULT 0 COMMENT '是否有专家：0=否，1=是';
