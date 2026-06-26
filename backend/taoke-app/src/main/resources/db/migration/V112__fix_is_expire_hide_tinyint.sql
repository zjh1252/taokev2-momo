-- V112: 修复 courses.is_expire_hide 列类型
-- Integer 字段应使用 TINYINT(2) 而非 TINYINT(1)，后者被 JDBC 驱动映射为 BIT
-- 参考 V24 字段类型约定：布尔字段 TINYINT(1)，小整型字段 TINYINT(2)
ALTER TABLE courses
    MODIFY COLUMN is_expire_hide TINYINT(2) NOT NULL DEFAULT 1 COMMENT '到期是否前台自动隐藏：1=是 0=否';
