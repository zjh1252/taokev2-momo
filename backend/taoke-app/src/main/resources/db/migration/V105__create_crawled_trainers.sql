-- ============================================================
-- V105: 爬取专家数据中间表（待审核入库）
--   存储从外部网站爬取的专家信息，管理员审核后导入 user_trainers
-- ============================================================

CREATE TABLE crawled_trainers (
    id                  INT            NOT NULL AUTO_INCREMENT PRIMARY KEY,
    source              VARCHAR(50)    NOT NULL COMMENT '数据来源站点标识，如 jiangshibao/huashi123',
    source_url          VARCHAR(500)   NOT NULL COMMENT '来源页面 URL',
    source_trainer_id   VARCHAR(100)   NULL     COMMENT '来源站点的讲师 ID/URL slug（去重用）',

    -- 核心信息（对齐 user_trainers 字段）
    name                VARCHAR(100)   NULL     COMMENT '讲师姓名',
    teaching_name       VARCHAR(64)    NULL     COMMENT '授课姓名',
    avatar              VARCHAR(500)   NULL     COMMENT '头像 URL（来源站原始地址）',
    title               VARCHAR(64)    NULL     COMMENT '头衔',
    gender              TINYINT        NOT NULL DEFAULT 0 COMMENT '性别：0=未知 1=男 2=女',
    one_line_intro      VARCHAR(255)   NULL     COMMENT '一句话介绍',
    bio                 TEXT           NULL     COMMENT '个人简介',
    intro               LONGTEXT       NULL     COMMENT '详细介绍（HTML/富文本）',
    background          TEXT           NULL     COMMENT '从业经历',
    good_at             TEXT           NULL     COMMENT '专长描述',
    specialties         VARCHAR(512)   NULL     COMMENT '擅长领域 JSON 数组',
    expertise_tags      VARCHAR(500)   NULL     COMMENT '擅长标签，逗号分隔',
    teaching_style      VARCHAR(500)   NULL     COMMENT '授课风格',
    experience_years    INT            NULL     COMMENT '从业年限',
    teaching_years      INT            NULL     COMMENT '培训年限',
    province_id         INT            NOT NULL DEFAULT 0 COMMENT '驻地省份 ID',
    city_id             INT            NOT NULL DEFAULT 0 COMMENT '驻地城市 ID',
    partial_clients     TEXT           NULL     COMMENT '部分客户',

    -- 爬取的关联数据（JSON 格式存储，审核入库时拆分到子表）
    education_json      JSON           NULL     COMMENT '教育经历 [{school,major,degree,start,end}]',
    experience_json     JSON           NULL     COMMENT '工作经历 [{company,position,start,end,description}]',
    honors_json         JSON           NULL     COMMENT '荣誉资质 [{name,authority,date,description}]',
    books_json          JSON           NULL     COMMENT '著作 [{title,publisher,publishDate,description}]',
    courses_json        JSON           NULL     COMMENT '主讲课程 [{title,type,category,summary}]',
    cases_json          JSON           NULL     COMMENT '案例 [{title,client,description}]',
    evaluation_json     JSON           NULL     COMMENT '评价/评分摘要',

    -- 去重与审核
    dedup_status        TINYINT        NOT NULL DEFAULT 0 COMMENT '去重状态：0=未检查 1=无重复 2=有疑似重复 3=确认重复',
    dedup_trainer_id    INT            NULL     COMMENT '疑似/确认重复的 user_trainers.id',
    dedup_reason        VARCHAR(255)   NULL     COMMENT '去重判定原因',
    review_status       TINYINT        NOT NULL DEFAULT 0 COMMENT '审核状态：0=待审核 1=已通过 2=已驳回 3=已入库',
    review_reject_reason VARCHAR(500)  NULL     COMMENT '驳回原因',
    reviewed_at         DATETIME       NULL     COMMENT '审核时间',
    imported_trainer_id INT            NULL     COMMENT '审核通过后导入的 user_trainers.id',

    -- 原始数据备份
    raw_html            LONGTEXT       NULL     COMMENT '原始页面 HTML（调试用）',
    raw_json            JSON           NULL     COMMENT '爬虫原始输出 JSON',

    created_at          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_source (source),
    INDEX idx_source_url (source_url(191)),
    INDEX idx_review_status (review_status),
    INDEX idx_dedup_status (dedup_status),
    UNIQUE KEY uk_source_trainer (source, source_trainer_id(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='爬取专家数据中间表（待审核入库）';
