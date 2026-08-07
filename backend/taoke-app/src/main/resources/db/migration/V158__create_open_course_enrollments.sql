-- ============================================================
-- 公开课报名线索表（与 demands / trainer_lead_messages 隔离）
-- ============================================================

CREATE TABLE open_course_enrollments (
    id               INT           NOT NULL AUTO_INCREMENT COMMENT '主键',
    user_id          INT           NULL                    COMMENT '提交人用户 ID（登录可选）',
    course_id        INT           NOT NULL                COMMENT '课程 ID',
    plan_id          INT           NOT NULL                COMMENT '开课计划 ID',
    real_name        VARCHAR(50)   NOT NULL                COMMENT '真实姓名',
    company_name     VARCHAR(200)  NOT NULL                COMMENT '公司名称',
    email            VARCHAR(100)  NOT NULL                COMMENT '电子邮件',
    company_phone    VARCHAR(30)   NULL                    COMMENT '公司电话',
    mobile           VARCHAR(20)   NULL                    COMMENT '手机号码',
    course_title     VARCHAR(500)  NOT NULL DEFAULT ''     COMMENT '提交时冗余课程名称',
    plan_start_time  DATETIME      NULL                    COMMENT '冗余期次开始时间',
    plan_end_time    DATETIME      NULL                    COMMENT '冗余期次结束时间',
    status           TINYINT(2)    NOT NULL DEFAULT 0      COMMENT '处理状态：0=待处理 1=已联系 2=已无效',
    admin_remark     TEXT          NULL                    COMMENT '运营备注',
    created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '报名提交时间',
    updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    INDEX idx_oce_created_at (created_at),
    INDEX idx_oce_course_id (course_id),
    INDEX idx_oce_plan_id (plan_id),
    INDEX idx_oce_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公开课报名线索';
