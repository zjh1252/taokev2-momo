-- ------------------------------------------------------------
-- V48: 用户中心「身份信息」二级菜单 + 专家四维度资质认证
-- ------------------------------------------------------------
-- 1. sys_users  : 个人学员"学习标签"
-- 2. user_trainers: 实名认证(身份证) + 专业认证多附件 + 各自审核状态/时间
-- 3. trainer_educations / trainer_work_experiences:
--      - 持证人姓名 / 证明文件
--      - 按记录的审核状态(1待审核 2已通过 3已驳回) + 驳回原因 + 审核时间
-- ------------------------------------------------------------

-- ============================================================
-- 1. sys_users 增加学习标签字段
-- ============================================================
ALTER TABLE `sys_users`
    ADD COLUMN `study_tags` VARCHAR(500) NULL DEFAULT '' COMMENT '学习标签（个人学员，逗号分隔关键词）' AFTER `avatar_url`;


-- ============================================================
-- 2. user_trainers: 实名认证 + 专业认证字段
-- ------------------------------------------------------------
-- 状态枚举（real_name_status / professional_status）：
--   NULL = 未提交
--   1    = 待审核
--   2    = 已通过
--   3    = 已驳回
-- ============================================================
ALTER TABLE `user_trainers`
    ADD COLUMN `id_card_no`                 VARCHAR(32)  NULL DEFAULT '' COMMENT '身份证号' AFTER `address`,
    ADD COLUMN `id_card_front`              VARCHAR(500) NULL DEFAULT '' COMMENT '身份证人像面 URL' AFTER `id_card_no`,
    ADD COLUMN `id_card_back`               VARCHAR(500) NULL DEFAULT '' COMMENT '身份证国徽面 URL' AFTER `id_card_front`,
    ADD COLUMN `real_name_status`           TINYINT      NULL DEFAULT NULL COMMENT '实名认证状态：NULL未提交 1待审核 2已通过 3已驳回' AFTER `id_card_back`,
    ADD COLUMN `real_name_reject_reason`    VARCHAR(255) NULL DEFAULT ''   COMMENT '实名认证驳回原因' AFTER `real_name_status`,
    ADD COLUMN `real_name_submitted_at`     DATETIME     NULL DEFAULT NULL COMMENT '实名认证最近一次提交时间' AFTER `real_name_reject_reason`,
    ADD COLUMN `real_name_audited_at`       DATETIME     NULL DEFAULT NULL COMMENT '实名认证最近一次审核时间' AFTER `real_name_submitted_at`,

    ADD COLUMN `certification_files`        JSON         NULL              COMMENT '专业认证附件 URL 列表（JSON 数组）' AFTER `real_name_audited_at`,
    ADD COLUMN `professional_status`        TINYINT      NULL DEFAULT NULL COMMENT '专业认证状态：NULL未提交 1待审核 2已通过 3已驳回' AFTER `certification_files`,
    ADD COLUMN `professional_reject_reason` VARCHAR(255) NULL DEFAULT ''   COMMENT '专业认证驳回原因' AFTER `professional_status`,
    ADD COLUMN `professional_submitted_at`  DATETIME     NULL DEFAULT NULL COMMENT '专业认证最近一次提交时间' AFTER `professional_reject_reason`,
    ADD COLUMN `professional_audited_at`    DATETIME     NULL DEFAULT NULL COMMENT '专业认证最近一次审核时间' AFTER `professional_submitted_at`,

    ADD INDEX `idx_real_name_status`    (`real_name_status`),
    ADD INDEX `idx_professional_status` (`professional_status`);


-- ============================================================
-- 3. trainer_educations: 学历认证（按记录审核）
-- ------------------------------------------------------------
-- 状态枚举：1待审核 2已通过 3已驳回（创建即 1）
-- ============================================================
ALTER TABLE `trainer_educations`
    ADD COLUMN `holder_name`   VARCHAR(64)  NULL DEFAULT '' COMMENT '持证人姓名（学历文凭上的姓名）' AFTER `trainer_id`,
    ADD COLUMN `proof_file`    VARCHAR(500) NULL DEFAULT '' COMMENT '证明文件 URL（学历证书照片）' AFTER `is_graduated`,
    ADD COLUMN `status`        TINYINT      NOT NULL DEFAULT 1   COMMENT '审核状态：1待审核 2已通过 3已驳回' AFTER `proof_file`,
    ADD COLUMN `reject_reason` VARCHAR(255) NULL DEFAULT ''      COMMENT '驳回原因' AFTER `status`,
    ADD COLUMN `audited_at`    DATETIME     NULL DEFAULT NULL    COMMENT '最近一次审核时间' AFTER `reject_reason`,
    ADD INDEX `idx_status` (`status`);


-- ============================================================
-- 4. trainer_work_experiences: 工作认证（按记录审核）
-- ============================================================
ALTER TABLE `trainer_work_experiences`
    ADD COLUMN `proof_file`    VARCHAR(500) NULL DEFAULT '' COMMENT '证明文件 URL（劳动合同/名片/工牌等）' AFTER `job_description`,
    ADD COLUMN `status`        TINYINT      NOT NULL DEFAULT 1   COMMENT '审核状态：1待审核 2已通过 3已驳回' AFTER `proof_file`,
    ADD COLUMN `reject_reason` VARCHAR(255) NULL DEFAULT ''      COMMENT '驳回原因' AFTER `status`,
    ADD COLUMN `audited_at`    DATETIME     NULL DEFAULT NULL    COMMENT '最近一次审核时间' AFTER `reject_reason`,
    ADD INDEX `idx_status` (`status`);
