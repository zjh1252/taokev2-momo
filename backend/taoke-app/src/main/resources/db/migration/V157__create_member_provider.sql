-- 接入商用户映射（对齐老站 tk_member_provider / MemberProvider.php）
CREATE TABLE IF NOT EXISTS member_provider (
    id               INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tkw_id           INT          NOT NULL                COMMENT '本地 sys_users.id',
    tkw_type         VARCHAR(32)  NOT NULL                COMMENT '接入商 appid，如 wittrain',
    root_company_id  INT          NOT NULL                COMMENT '接入商根公司 ID（培训宝 POST uid）',
    regtime          INT          NOT NULL DEFAULT 0      COMMENT '注册时间 Unix 秒',
    updatetime       INT          NOT NULL DEFAULT 0      COMMENT '更新时间 Unix 秒',
    UNIQUE KEY uk_member_provider_tkw (tkw_id),
    UNIQUE KEY uk_member_provider_partner (tkw_type, root_company_id),
    KEY idx_member_provider_type (tkw_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='接入商淘课用户映射';
