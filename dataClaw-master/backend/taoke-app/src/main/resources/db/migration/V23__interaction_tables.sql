-- ============================================================
-- V23: 用户与资源互动表（收藏、点赞、培训评价、专家留言）
-- ============================================================

-- 1. 通用收藏
CREATE TABLE user_favorites (
    id              INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id         INT             NOT NULL                    COMMENT '用户 ID',
    target_type     VARCHAR(32)     NOT NULL                    COMMENT '资源类型：COURSE/TRAINER/INSTITUTION/CASE',
    target_id       INT             NOT NULL                    COMMENT '资源主键',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP  COMMENT '创建时间',
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY idx_user_fav_unique (user_id, target_type, target_id),
    KEY idx_fav_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户收藏表';

-- 2. 通用点赞
CREATE TABLE user_likes (
    id              INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id         INT             NOT NULL                    COMMENT '用户 ID',
    target_type     VARCHAR(32)     NOT NULL                    COMMENT '资源类型：COURSE/TRAINER/INSTITUTION/CASE',
    target_id       INT             NOT NULL                    COMMENT '资源主键',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP  COMMENT '创建时间',
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY idx_user_like_unique (user_id, target_type, target_id),
    KEY idx_like_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户点赞表';

-- 3. 培训评价
CREATE TABLE training_reviews (
    id                  INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    review_scope        VARCHAR(32)     NOT NULL                    COMMENT '评价范围：COURSE/TRAINER',
    course_id           INT             DEFAULT NULL                COMMENT '被评课程 ID',
    trainer_user_id     INT             DEFAULT NULL                COMMENT '被评专家的 user_id',
    order_id            INT             DEFAULT NULL                COMMENT '关联订单 ID（可空）',
    expert_name         VARCHAR(100)    DEFAULT ''                  COMMENT '专家姓名（冗余快照）',
    training_date       DATE            DEFAULT NULL                COMMENT '培训/出场日期',
    course_days         DECIMAL(4,1)    DEFAULT NULL                COMMENT '课程天数/出场天数',
    course_title        VARCHAR(200)    DEFAULT ''                  COMMENT '课程标题/培训主题',
    client_company      VARCHAR(200)    DEFAULT ''                  COMMENT '甲方企业名称',
    training_location   VARCHAR(200)    DEFAULT ''                  COMMENT '培训地点',
    rating_content      TINYINT         NOT NULL DEFAULT 0          COMMENT '授课内容评分 1-5',
    rating_teaching     TINYINT         NOT NULL DEFAULT 0          COMMENT '授课水平评分 1-5',
    rating_service      TINYINT         NOT NULL DEFAULT 0          COMMENT '服务态度评分 1-5',
    avg_score           DECIMAL(3,2)    NOT NULL DEFAULT 0.00       COMMENT '三维平均分',
    comment_text        TEXT            NOT NULL                    COMMENT '文字评价（>=20 字）',
    photo_urls          JSON            DEFAULT NULL                COMMENT '图片 URL 数组，限 1~9 张',
    submitter_name      VARCHAR(50)     DEFAULT ''                  COMMENT '评价者姓名',
    submitter_contact   VARCHAR(50)     DEFAULT ''                  COMMENT '专家电话/微信（选填）',
    user_id             INT             NOT NULL                    COMMENT '提交人用户 ID',
    status              TINYINT         NOT NULL DEFAULT 0          COMMENT '0=待审核 1=通过 -1=驳回 2=隐藏',
    reject_reason       VARCHAR(500)    DEFAULT NULL                COMMENT '驳回理由',
    is_anonymous        TINYINT         NOT NULL DEFAULT 0          COMMENT '是否匿名 0=否 1=是',
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP  COMMENT '创建时间',
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    KEY idx_review_course (course_id),
    KEY idx_review_trainer (trainer_user_id),
    KEY idx_review_user (user_id),
    KEY idx_review_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='培训评价表';

-- 4. 专家留言
CREATE TABLE trainer_lead_messages (
    id                  INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    trainer_user_id     INT             NOT NULL                    COMMENT '目标专家 user_id',
    training_topic      VARCHAR(100)    NOT NULL                    COMMENT '培训主题 2~30 字',
    training_goal       TEXT            DEFAULT NULL                COMMENT '培训目标详述',
    contact_name        VARCHAR(50)     NOT NULL                    COMMENT '联系人姓名',
    contact_mobile      VARCHAR(20)     NOT NULL                    COMMENT '联系手机',
    company_name        VARCHAR(200)    NOT NULL                    COMMENT '公司名称',
    company_phone       VARCHAR(20)     DEFAULT NULL                COMMENT '公司电话',
    province_id         INT             DEFAULT NULL                COMMENT '省 ID',
    city_id             INT             DEFAULT NULL                COMMENT '市 ID',
    training_days       VARCHAR(20)     DEFAULT NULL                COMMENT '培训天数',
    email               VARCHAR(100)    DEFAULT NULL                COMMENT 'Email',
    remark              TEXT            DEFAULT NULL                COMMENT '备注',
    user_id             INT             DEFAULT NULL                COMMENT '提交人用户 ID（未登录可为空）',
    status              TINYINT         NOT NULL DEFAULT 0          COMMENT '0=新建 1=已分配 2=已处理',
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP  COMMENT '创建时间',
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    KEY idx_msg_trainer (trainer_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家留言表';
