-- ============================================================
-- V65: 爬取课程数据中间表（待审核入库）
--   存储从外部网站爬取的课程信息，管理员审核后导入 courses
-- ============================================================

CREATE TABLE crawled_courses (
    id                  INT            NOT NULL AUTO_INCREMENT PRIMARY KEY,
    source              VARCHAR(50)    NOT NULL COMMENT '数据来源站点标识',
    source_url          VARCHAR(500)   NOT NULL COMMENT '来源页面 URL',
    source_course_id    VARCHAR(100)   NULL     COMMENT '来源站点课程 ID（去重用）',

    -- 核心信息（对齐 courses 字段）
    title               VARCHAR(200)   NOT NULL COMMENT '课程标题',
    type                VARCHAR(16)    NOT NULL DEFAULT 'OPEN_OFFLINE' COMMENT '课程类型：OPEN_OFFLINE/OPEN_ONLINE/INTERNAL',
    category_id         INT            NOT NULL DEFAULT 0 COMMENT '一级分类 ID（需管理员映射）',
    sub_category_id     INT            NOT NULL DEFAULT 0 COMMENT '二级分类 ID',
    category_name_raw   VARCHAR(100)   NULL     COMMENT '来源站点的原始分类名（辅助映射）',
    cover_url           VARCHAR(500)   NULL     COMMENT '课程封面 URL',
    intro               LONGTEXT       NULL     COMMENT '课程介绍（HTML）',
    summary             VARCHAR(500)   NULL     COMMENT '课程简介（短文本）',
    syllabus            LONGTEXT       NULL     COMMENT '课程大纲（HTML）',
    audience            TEXT           NULL     COMMENT '适用人群',
    highlights          TEXT           NULL     COMMENT '课程亮点/收益',
    duration_days       INT            NOT NULL DEFAULT 0 COMMENT '课程天数',
    total_hours         DECIMAL(5,1)   NOT NULL DEFAULT 0.0 COMMENT '总时长（小时）',
    price               DECIMAL(10,2)  NOT NULL DEFAULT 0.00 COMMENT '价格',
    original_price      DECIMAL(10,2)  NOT NULL DEFAULT 0.00 COMMENT '原价',
    keywords            VARCHAR(500)   NULL     COMMENT '关键词',
    trainer_name_raw    VARCHAR(100)   NULL     COMMENT '来源站讲师名称（辅助关联）',

    -- 爬取的关联数据
    plans_json          JSON           NULL     COMMENT '排课计划 [{startTime,endTime,city,address}]',
    evaluation_json     JSON           NULL     COMMENT '评价/观看人数等',
    target_audience     TEXT           NULL     COMMENT '适宜学员',
    learning_outcomes   TEXT           NULL     COMMENT '学习收益',
    services_json       JSON           NULL     COMMENT '内训课服务内容',

    -- 去重与审核
    dedup_status        TINYINT        NOT NULL DEFAULT 0 COMMENT '去重状态：0=未检查 1=无重复 2=有疑似重复 3=确认重复',
    dedup_course_id     INT            NULL     COMMENT '疑似/确认重复的 courses.id',
    dedup_reason        VARCHAR(255)   NULL     COMMENT '去重判定原因',
    review_status       TINYINT        NOT NULL DEFAULT 0 COMMENT '审核状态：0=待审核 1=已通过 2=已驳回 3=已入库',
    review_reject_reason VARCHAR(500)  NULL     COMMENT '驳回原因',
    reviewed_at         DATETIME       NULL     COMMENT '审核时间',
    imported_course_id  INT            NULL     COMMENT '审核通过后导入的 courses.id',

    raw_html            LONGTEXT       NULL     COMMENT '原始页面 HTML',
    raw_json            JSON           NULL     COMMENT '爬虫原始输出 JSON',

    created_at          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_source (source),
    INDEX idx_source_url (source_url(191)),
    INDEX idx_review_status (review_status),
    INDEX idx_dedup_status (dedup_status),
    UNIQUE KEY uk_source_course (source, source_course_id(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='爬取课程数据中间表（待审核入库）';
