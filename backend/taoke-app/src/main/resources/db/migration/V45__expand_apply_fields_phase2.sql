-- ============================================================
-- V45: 扩展经纪人 / 助理 / 经纪公司三类角色申请字段
--
-- user_agents / user_assistants 增加：
--   real_name           真实姓名
--   email               常用邮箱
--   service_cities      多服务城市 JSON：[{provinceId, cityId, provinceName, cityName}]
--   agreement_signed_at 合作协议签署时间
--   agreement_version   协议版本号（默认 v1）
--
-- user_enterprise_agents 增加：
--   bio                 公司简介
--   agreement_signed_at 合作协议签署时间
--   agreement_version   协议版本号（默认 v1）
-- ============================================================

ALTER TABLE `user_agents`
    ADD COLUMN `real_name` VARCHAR(64) NULL DEFAULT NULL COMMENT '真实姓名' AFTER `user_id`,
    ADD COLUMN `email` VARCHAR(128) NULL DEFAULT NULL COMMENT '常用邮箱' AFTER `real_name`,
    ADD COLUMN `service_cities` JSON NULL COMMENT '服务城市数组 JSON：[{provinceId,cityId,provinceName,cityName}]' AFTER `service_city_ids`,
    ADD COLUMN `agreement_signed_at` DATETIME NULL DEFAULT NULL COMMENT '注册经纪人合作协议签署时间' AFTER `service_cities`,
    ADD COLUMN `agreement_version` VARCHAR(32) NULL DEFAULT NULL COMMENT '协议版本号，默认 v1' AFTER `agreement_signed_at`;

ALTER TABLE `user_assistants`
    ADD COLUMN `real_name` VARCHAR(64) NULL DEFAULT NULL COMMENT '真实姓名' AFTER `user_id`,
    ADD COLUMN `email` VARCHAR(128) NULL DEFAULT NULL COMMENT '常用邮箱' AFTER `real_name`,
    ADD COLUMN `service_cities` JSON NULL COMMENT '服务城市数组 JSON：[{provinceId,cityId,provinceName,cityName}]' AFTER `auth_scope`,
    ADD COLUMN `agreement_signed_at` DATETIME NULL DEFAULT NULL COMMENT '注册助理合作协议签署时间' AFTER `service_cities`,
    ADD COLUMN `agreement_version` VARCHAR(32) NULL DEFAULT NULL COMMENT '协议版本号，默认 v1' AFTER `agreement_signed_at`;

ALTER TABLE `user_enterprise_agents`
    ADD COLUMN `bio` TEXT NULL COMMENT '公司简介' AFTER `company_size`,
    ADD COLUMN `agreement_signed_at` DATETIME NULL DEFAULT NULL COMMENT '注册经纪公司合作协议签署时间' AFTER `qualification_doc_url`,
    ADD COLUMN `agreement_version` VARCHAR(32) NULL DEFAULT NULL COMMENT '协议版本号，默认 v1' AFTER `agreement_signed_at`;
