-- ============================================================
-- V107: 爬虫任务记录表
--   记录每次爬取任务的状态和统计信息
-- ============================================================

CREATE TABLE crawl_jobs (
    id                  INT            NOT NULL AUTO_INCREMENT PRIMARY KEY,
    source              VARCHAR(50)    NOT NULL COMMENT '数据源标识',
    data_type           VARCHAR(20)    NOT NULL COMMENT '数据类型：TRAINER/COURSE',
    status              TINYINT        NOT NULL DEFAULT 0 COMMENT '状态：0=待执行 1=运行中 2=已完成 3=失败 4=已取消',
    config_json         JSON           NULL     COMMENT '爬取配置（起始 URL、参数等）',
    crawler_job_id      VARCHAR(100)   NULL     COMMENT 'Python 服务端的任务 ID',
    total_count         INT            NOT NULL DEFAULT 0 COMMENT '总计爬取条数',
    processed_count     INT            NOT NULL DEFAULT 0 COMMENT '已处理条数',
    success_count       INT            NOT NULL DEFAULT 0 COMMENT '成功入库条数',
    duplicate_count     INT            NOT NULL DEFAULT 0 COMMENT '去重跳过条数',
    error_count         INT            NOT NULL DEFAULT 0 COMMENT '错误条数',
    error_message       TEXT           NULL     COMMENT '失败原因',
    progress_message    VARCHAR(500)   NULL     COMMENT '当前进度说明',
    started_at          DATETIME       NULL     COMMENT '开始时间',
    finished_at         DATETIME       NULL     COMMENT '完成时间',
    triggered_by        INT            NOT NULL COMMENT '触发人 user_id',

    created_at          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_status (status),
    INDEX idx_source_type (source, data_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='爬虫任务记录表';
