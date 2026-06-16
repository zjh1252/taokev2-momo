-- ============================================================
-- V46: 扩展培训机构 / 机构员工两类角色申请字段
--
-- user_institutions 增加：
--   legal_representative  法人代表
--   established_at        成立时间
--   has_venue             是否有场地：0=否，1=是
--   has_experts           是否有专家：0=否，1=是
--   agreement_signed_at   合作协议签署时间
--   agreement_version     协议版本号（默认 v1）
-- 同时把 industries / specialties 列的语义改为「分类 ID 逗号串」
-- （列结构保持 VARCHAR(512) 不变，仅更新注释）。
--
-- user_institution_employees 增加：
--   real_name             真实姓名
--   contact_phone         联系电话
--   email                 常用邮箱
--   service_cities        多服务城市 JSON：[{provinceId,cityId,provinceName,cityName}]
--   agreement_signed_at   合作协议签署时间
--   agreement_version     协议版本号（默认 v1）
-- 旧列 position / department 保留为 legacy，不在本期表单中暴露。
-- ============================================================

ALTER TABLE `user_institutions`
    ADD COLUMN `legal_representative` VARCHAR(64) NULL DEFAULT NULL COMMENT '法人代表' AFTER `license_no`,
    ADD COLUMN `established_at` DATE NULL DEFAULT NULL COMMENT '机构成立日期' AFTER `legal_representative`,
    ADD COLUMN `has_venue` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否有场地：0=否，1=是' AFTER `industries`,
    ADD COLUMN `has_experts` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否有专家：0=否，1=是' AFTER `has_venue`,
    ADD COLUMN `agreement_signed_at` DATETIME NULL DEFAULT NULL COMMENT '注册培训机构合作协议签署时间' AFTER `success_cases`,
    ADD COLUMN `agreement_version` VARCHAR(32) NULL DEFAULT NULL COMMENT '协议版本号，默认 v1' AFTER `agreement_signed_at`;

ALTER TABLE `user_institutions`
    MODIFY COLUMN `industries` VARCHAR(512) NULL DEFAULT NULL COMMENT '擅长行业，分类 ID 逗号串（一级多选，复用 TRAINER_INDUSTRY 分类树）',
    MODIFY COLUMN `specialties` VARCHAR(512) NULL DEFAULT NULL COMMENT '擅长领域，分类 ID 逗号串（一级多选，复用 TRAINER_EXPERTISE 分类树）';

ALTER TABLE `user_institution_employees`
    ADD COLUMN `real_name` VARCHAR(64) NULL DEFAULT NULL COMMENT '真实姓名' AFTER `user_id`,
    ADD COLUMN `contact_phone` VARCHAR(20) NULL DEFAULT NULL COMMENT '联系电话' AFTER `real_name`,
    ADD COLUMN `email` VARCHAR(128) NULL DEFAULT NULL COMMENT '常用邮箱' AFTER `contact_phone`,
    ADD COLUMN `service_cities` JSON NULL COMMENT '服务城市数组 JSON：[{provinceId,cityId,provinceName,cityName}]' AFTER `email`,
    ADD COLUMN `agreement_signed_at` DATETIME NULL DEFAULT NULL COMMENT '注册培训机构员工合作协议签署时间' AFTER `service_cities`,
    ADD COLUMN `agreement_version` VARCHAR(32) NULL DEFAULT NULL COMMENT '协议版本号，默认 v1' AFTER `agreement_signed_at`;
