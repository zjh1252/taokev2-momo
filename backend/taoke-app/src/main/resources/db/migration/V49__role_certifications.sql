-- ------------------------------------------------------------
-- V49: 三角色身份信息认证扩展
-- ------------------------------------------------------------
-- 1. 新表 agent_work_experiences      : 经纪人工作认证（多条记录）
-- 2. user_enterprise_agents 扩列     : 经纪公司资质认证（公司Logo + 营业执照单条审核）
-- 3. user_institutions      扩列     : 培训机构「公司资料」单页提交单条审核
--
-- 状态机统一：1=待审核 2=已通过 3=已驳回（NULL=未提交）
-- ------------------------------------------------------------


-- ============================================================
-- 1. agent_work_experiences (新表) — 经纪人工作认证
--    与 trainer_work_experiences 结构保持一致；按记录审核
-- ============================================================
CREATE TABLE IF NOT EXISTS `agent_work_experiences`
(
    `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
    `agent_id`        INT          NOT NULL COMMENT '经纪人扩展表 user_agents.id',
    `company_name`    VARCHAR(200) NOT NULL                  COMMENT '单位名称',
    `position`        VARCHAR(100) NULL DEFAULT ''           COMMENT '担任职务',
    `start_date`      DATE         NOT NULL                  COMMENT '起始日期',
    `end_date`        DATE         NULL DEFAULT NULL         COMMENT '结束日期，NULL=至今',
    `job_description` TEXT         NULL                      COMMENT '工作描述',
    `proof_file`      VARCHAR(500) NULL DEFAULT ''           COMMENT '证明文件 URL（劳动合同/名片/工牌等）',
    `status`          TINYINT      NOT NULL DEFAULT 1        COMMENT '审核状态：1待审核 2已通过 3已驳回',
    `reject_reason`   VARCHAR(255) NULL DEFAULT ''           COMMENT '驳回原因',
    `submitted_at`    DATETIME     NULL DEFAULT NULL         COMMENT '最近一次提交时间',
    `audited_at`      DATETIME     NULL DEFAULT NULL         COMMENT '最近一次审核时间',
    `sort_order`      INT          NOT NULL DEFAULT 0        COMMENT '排序值',
    `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                COMMENT '创建时间',
    `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_agent_id` (`agent_id`),
    KEY `idx_status` (`status`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT ='经纪人工作认证记录';


-- ============================================================
-- 2. user_enterprise_agents — 经纪公司资质认证
--    公司Logo + 营业执照（已存在 qualification_doc_url 复用）
--    单条整体审核流：NULL=未提交 1=待审 2=通过 3=驳回
-- ============================================================
ALTER TABLE `user_enterprise_agents`
    ADD COLUMN `cert_logo_url`         VARCHAR(512) NULL DEFAULT '' COMMENT '公司 Logo URL'                                  AFTER `qualification_doc_url`,
    ADD COLUMN `cert_status`           TINYINT      NULL DEFAULT NULL COMMENT '资质认证状态：NULL未提交 1待审核 2已通过 3已驳回' AFTER `cert_logo_url`,
    ADD COLUMN `cert_reject_reason`    VARCHAR(255) NULL DEFAULT ''   COMMENT '资质认证驳回原因'                              AFTER `cert_status`,
    ADD COLUMN `cert_submitted_at`     DATETIME     NULL DEFAULT NULL COMMENT '资质认证最近一次提交时间'                       AFTER `cert_reject_reason`,
    ADD COLUMN `cert_audited_at`       DATETIME     NULL DEFAULT NULL COMMENT '资质认证最近一次审核时间'                       AFTER `cert_submitted_at`,
    ADD INDEX `idx_cert_status` (`cert_status`);


-- ============================================================
-- 3. user_institutions — 培训机构「公司资料」
--    复用申请阶段已有：logo_url / license_no / 5 段地址
--    新增字段：业务字段 11 项 + 营业执照附件 + 整体审核字段 4 项
-- ============================================================
ALTER TABLE `user_institutions`
    -- 业务字段
    ADD COLUMN `company_nature`           VARCHAR(32)  NULL DEFAULT '' COMMENT '公司性质：国企/民营/外资/合资/事业单位/其他' AFTER `org_type`,
    ADD COLUMN `website`                  VARCHAR(255) NULL DEFAULT '' COMMENT '公司网址'                                AFTER `company_nature`,
    ADD COLUMN `company_size`             VARCHAR(32)  NULL DEFAULT '' COMMENT '机构规模'                                AFTER `website`,
    ADD COLUMN `annual_revenue`           VARCHAR(64)  NULL DEFAULT '' COMMENT '年营业额'                                AFTER `company_size`,
    ADD COLUMN `registered_capital`       VARCHAR(64)  NULL DEFAULT '' COMMENT '注册资本'                                AFTER `annual_revenue`,
    ADD COLUMN `max_commission_rate`      DECIMAL(5,2) NULL DEFAULT NULL COMMENT '公开课可接受最高佣金比例 0-100'         AFTER `registered_capital`,
    ADD COLUMN `payment_methods`          JSON         NULL              COMMENT '可接受付款方式 JSON 字符串数组'         AFTER `max_commission_rate`,
    ADD COLUMN `has_copyright_course`     TINYINT      NULL DEFAULT 0    COMMENT '是否有版权课：0=否 1=是'                AFTER `payment_methods`,
    ADD COLUMN `bank_card_no`             VARCHAR(64)  NULL DEFAULT ''   COMMENT '银行卡号'                              AFTER `has_copyright_course`,
    ADD COLUMN `bank_name`                VARCHAR(128) NULL DEFAULT ''   COMMENT '开户行'                                AFTER `bank_card_no`,
    ADD COLUMN `bank_branch`              VARCHAR(128) NULL DEFAULT ''   COMMENT '开户行支行'                            AFTER `bank_name`,
    -- 营业执照附件 URL（license_no 是号码字符串，license_doc_url 是图片）
    ADD COLUMN `license_doc_url`          VARCHAR(512) NULL DEFAULT ''   COMMENT '营业执照附件 URL'                      AFTER `bank_branch`,
    -- 公司资料整体审核
    ADD COLUMN `company_info_status`        TINYINT      NULL DEFAULT NULL COMMENT '公司资料状态：NULL未提交 1待审核 2已通过 3已驳回' AFTER `license_doc_url`,
    ADD COLUMN `company_info_reject_reason` VARCHAR(255) NULL DEFAULT ''   COMMENT '公司资料驳回原因'                            AFTER `company_info_status`,
    ADD COLUMN `company_info_submitted_at`  DATETIME     NULL DEFAULT NULL COMMENT '公司资料最近一次提交时间'                     AFTER `company_info_reject_reason`,
    ADD COLUMN `company_info_audited_at`    DATETIME     NULL DEFAULT NULL COMMENT '公司资料最近一次审核时间'                     AFTER `company_info_submitted_at`,
    ADD INDEX `idx_company_info_status` (`company_info_status`);
