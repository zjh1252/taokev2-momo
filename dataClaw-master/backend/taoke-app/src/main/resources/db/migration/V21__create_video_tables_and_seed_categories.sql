-- ==============================================================
-- V21: 录播课（在线课程）相关表 + 录播课分类种子数据
-- ==============================================================

-- 录播课主表
CREATE TABLE videos (
    id                INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    publisher_id      INT             NOT NULL                    COMMENT '发布者用户ID',
    publisher_type    VARCHAR(20)     NOT NULL                    COMMENT '发布者类型：TRAINER/INSTITUTION',
    title             VARCHAR(200)    NOT NULL                    COMMENT '录播课标题',
    cover_url         VARCHAR(500)    DEFAULT ''                  COMMENT '封面图URL',
    intro             LONGTEXT                                    COMMENT '课程介绍（富文本HTML）',
    video_type        VARCHAR(20)     NOT NULL DEFAULT 'SERIES'   COMMENT '视频类型：SERIES(多节/系列)/SINGLE(单个视频)/EXTERNAL(外部链接)',
    video_url         VARCHAR(500)    DEFAULT ''                  COMMENT '视频地址（SINGLE类型时使用）',
    external_url      VARCHAR(500)    DEFAULT ''                  COMMENT '外部链接（EXTERNAL类型时使用）',
    category_id       INT             DEFAULT 0                   COMMENT '一级分类ID（关联sys_categories, type=VIDEO_COURSE）',
    sub_category_id   INT             DEFAULT 0                   COMMENT '二级分类ID',
    teacher_name      VARCHAR(100)    DEFAULT ''                  COMMENT '授课老师（文本）',
    trainer_id        INT             DEFAULT 0                   COMMENT '关联讲师ID（可选）',
    price             DECIMAL(10,2)   DEFAULT 0.00                COMMENT '课程价格（元/人/年）',
    original_price    DECIMAL(10,2)   DEFAULT 0.00                COMMENT '原价（划线价）',
    is_free           TINYINT         NOT NULL DEFAULT 0          COMMENT '是否免费：0=否 1=是',
    keywords          VARCHAR(500)    DEFAULT ''                  COMMENT '关键词，逗号分隔',
    duration          INT             NOT NULL DEFAULT 0          COMMENT '总时长（秒）',
    total_episodes    INT             NOT NULL DEFAULT 0          COMMENT '总集数（冗余计数）',
    view_count        INT             NOT NULL DEFAULT 0          COMMENT '浏览次数',
    enrollment_count  INT             NOT NULL DEFAULT 0          COMMENT '报名人数',
    student_count     INT             NOT NULL DEFAULT 0          COMMENT '学习人数',
    score             DECIMAL(3,2)    NOT NULL DEFAULT 0.00       COMMENT '综合评分（0.00-5.00）',
    status            TINYINT         NOT NULL DEFAULT 0          COMMENT '状态：0=草稿 1=待审核 2=已上架 3=驳回 4=已下架',
    reject_reason     VARCHAR(500)    DEFAULT ''                  COMMENT '驳回原因',
    sort_order        INT             NOT NULL DEFAULT 0          COMMENT '排序权重（越大越靠前）',
    is_featured       TINYINT         NOT NULL DEFAULT 0          COMMENT '是否推荐：0=否 1=是',
    published_at      DATETIME                                    COMMENT '上线时间',
    created_at        DATETIME        NOT NULL                    COMMENT '创建时间',
    updated_at        DATETIME        NOT NULL                    COMMENT '更新时间',
    INDEX idx_publisher (publisher_id, publisher_type),
    INDEX idx_category (category_id, sub_category_id),
    INDEX idx_status (status),
    INDEX idx_is_featured (is_featured, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='录播课主表';

-- 录播课系列表（系列是录播课内的分组，如"基础篇"、"进阶篇"）
CREATE TABLE video_series (
    id              INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    video_id        INT             NOT NULL                    COMMENT '所属录播课ID',
    title           VARCHAR(200)    NOT NULL                    COMMENT '系列标题',
    description     TEXT                                        COMMENT '系列描述',
    cover_url       VARCHAR(500)    DEFAULT ''                  COMMENT '系列封面URL',
    sort_order      INT             NOT NULL DEFAULT 0          COMMENT '排序',
    created_at      DATETIME        NOT NULL                    COMMENT '创建时间',
    updated_at      DATETIME        NOT NULL                    COMMENT '更新时间',
    INDEX idx_video_id (video_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='录播课系列表';

-- 录播课章节表（可属于某个系列，也可独立于系列）
CREATE TABLE video_chapters (
    id              INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    video_id        INT             NOT NULL                    COMMENT '所属录播课ID',
    series_id       INT             NOT NULL DEFAULT 0          COMMENT '所属系列ID，0=不属于任何系列',
    title           VARCHAR(200)    NOT NULL                    COMMENT '章节标题',
    description     TEXT                                        COMMENT '章节描述',
    video_url       VARCHAR(500)    DEFAULT ''                  COMMENT '视频地址',
    cover_url       VARCHAR(500)    DEFAULT ''                  COMMENT '章节封面URL',
    duration        INT             NOT NULL DEFAULT 0          COMMENT '时长（秒）',
    file_size       BIGINT          NOT NULL DEFAULT 0          COMMENT '文件大小（字节）',
    sort_order      INT             NOT NULL DEFAULT 0          COMMENT '排序',
    is_preview      TINYINT         NOT NULL DEFAULT 0          COMMENT '是否可免费预览：0=否 1=是',
    created_at      DATETIME        NOT NULL                    COMMENT '创建时间',
    updated_at      DATETIME        NOT NULL                    COMMENT '更新时间',
    INDEX idx_video_id (video_id),
    INDEX idx_series_id (series_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='录播课章节表';

-- 录播课报名表（记录报名/购买事件）
CREATE TABLE video_enrollments (
    id              INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    video_id        INT             NOT NULL                    COMMENT '录播课ID',
    user_id         INT             NOT NULL                    COMMENT '报名用户ID',
    order_id        INT             NOT NULL DEFAULT 0          COMMENT '关联订单ID（后续支付模块）',
    price_paid      DECIMAL(10,2)   NOT NULL DEFAULT 0.00       COMMENT '实付金额',
    enrolled_at     DATETIME                                    COMMENT '报名时间',
    expired_at      DATETIME                                    COMMENT '过期时间（NULL=永久有效）',
    status          TINYINT         NOT NULL DEFAULT 1          COMMENT '状态：1=有效 0=已取消/退款',
    created_at      DATETIME        NOT NULL                    COMMENT '创建时间',
    updated_at      DATETIME        NOT NULL                    COMMENT '更新时间',
    UNIQUE INDEX idx_video_user (video_id, user_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='录播课报名表';

-- 录播课学员表（跟踪学习状态）
CREATE TABLE video_students (
    id                  INT             NOT NULL AUTO_INCREMENT PRIMARY KEY,
    video_id            INT             NOT NULL                    COMMENT '录播课ID',
    user_id             INT             NOT NULL                    COMMENT '学员用户ID',
    enrollment_id       INT             NOT NULL                    COMMENT '关联报名记录ID',
    last_chapter_id     INT             NOT NULL DEFAULT 0          COMMENT '上次观看的章节ID',
    progress            INT             NOT NULL DEFAULT 0          COMMENT '整体进度（0~100）',
    completed_chapters  INT             NOT NULL DEFAULT 0          COMMENT '已完成章节数',
    total_watch_time    INT             NOT NULL DEFAULT 0          COMMENT '累计观看时长（秒）',
    started_at          DATETIME                                    COMMENT '首次学习时间',
    last_watched_at     DATETIME                                    COMMENT '最近观看时间',
    is_completed        TINYINT         NOT NULL DEFAULT 0          COMMENT '是否完成全部课程：0=否 1=是',
    completed_at        DATETIME                                    COMMENT '完成时间',
    created_at          DATETIME        NOT NULL                    COMMENT '创建时间',
    updated_at          DATETIME        NOT NULL                    COMMENT '更新时间',
    UNIQUE INDEX idx_video_user (video_id, user_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='录播课学员表';

-- ==============================================================
-- 种子数据：录播课分类（VIDEO_COURSE）
-- ==============================================================
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES
('VIDEO_COURSE', 0, '经营战略',     1,  1, 1),
('VIDEO_COURSE', 0, '市场营销',     1,  2, 1),
('VIDEO_COURSE', 0, '研发管理',     1,  3, 1),
('VIDEO_COURSE', 0, '销售管理',     1,  4, 1),
('VIDEO_COURSE', 0, '采购管理',     1,  5, 1),
('VIDEO_COURSE', 0, '生产管理',     1,  6, 1),
('VIDEO_COURSE', 0, '物流管理',     1,  7, 1),
('VIDEO_COURSE', 0, '客户服务',     1,  8, 1),
('VIDEO_COURSE', 0, '财务税务',     1,  9, 1),
('VIDEO_COURSE', 0, '人力资源',     1, 10, 1),
('VIDEO_COURSE', 0, '培训发展',     1, 11, 1),
('VIDEO_COURSE', 0, '质量管理',     1, 12, 1),
('VIDEO_COURSE', 0, '项目管理',     1, 13, 1),
('VIDEO_COURSE', 0, '领导力',       1, 14, 1),
('VIDEO_COURSE', 0, '职业素养',     1, 15, 1),
('VIDEO_COURSE', 0, '职业技能',     1, 16, 1),
('VIDEO_COURSE', 0, 'MBA/总裁班',   1, 17, 1),
('VIDEO_COURSE', 0, '国学/心理学',  1, 18, 1),
('VIDEO_COURSE', 0, '语言',         1, 19, 1),
('VIDEO_COURSE', 0, '行政/法规',    1, 20, 1),
('VIDEO_COURSE', 0, '新媒体',       1, 21, 1),
('VIDEO_COURSE', 0, '新技术',       1, 22, 1),
('VIDEO_COURSE', 0, '其它',         1, 23, 1);
