-- ==============================================================
-- V90: sys_user_roles 增加 reapplying 列（幂等）
-- 已生效角色修改资料重新提交时，status 保持 1（原身份继续可用），
-- 用 reapplying=1 标记「资料重审中」，审核通过/驳回后清零。
-- ==============================================================

DROP PROCEDURE IF EXISTS v90_add_reapplying;

DELIMITER $$
CREATE PROCEDURE v90_add_reapplying()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'sys_user_roles' AND column_name = 'reapplying'
    ) THEN
        ALTER TABLE sys_user_roles
            ADD COLUMN reapplying TINYINT(1) NOT NULL DEFAULT 0 COMMENT '已生效角色资料重审中：0=否 1=是' AFTER status;
    END IF;

    -- 修复历史数据：已生效用户重新提交后被改为 status=2 而失去原身份的，恢复为 status=1 + reapplying=1
    UPDATE sys_user_roles
    SET status = 1, reapplying = 1
    WHERE status = 2 AND approved_at IS NOT NULL;
END$$
DELIMITER ;

CALL v90_add_reapplying();
DROP PROCEDURE IF EXISTS v90_add_reapplying;
