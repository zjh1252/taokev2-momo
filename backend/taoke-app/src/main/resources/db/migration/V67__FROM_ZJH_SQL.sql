-- 朱加豪迁移脚本里面改变ddl的语句

ALTER TABLE user_institutions
    ADD COLUMN public_list_eligible TINYINT(1) NOT NULL DEFAULT 1
        COMMENT '是否在 C 端机构频道公开展示：0=否 1=是'
    AFTER status;
