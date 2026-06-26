-- ============================================================
-- V108: 爬虫数据源配置表（可扩展新增）
-- ============================================================

CREATE TABLE crawl_sources (
    id          INT            NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(50)    NOT NULL COMMENT '数据源标识（小写英文，对应 Python 爬虫 code）',
    name        VARCHAR(100)   NOT NULL COMMENT '展示名称',
    url         VARCHAR(500)   NOT NULL COMMENT '站点首页 URL',
    data_type   VARCHAR(20)    NOT NULL COMMENT '数据类型：TRAINER/COURSE',
    enabled     TINYINT(1)     NOT NULL DEFAULT 1 COMMENT '是否启用',
    built_in    TINYINT(1)     NOT NULL DEFAULT 0 COMMENT '是否内置种子（内置项不可删除）',
    sort_order  INT            NOT NULL DEFAULT 0 COMMENT '排序（越小越靠前）',
    remark      VARCHAR(500)   NULL     COMMENT '备注（如 Python 爬虫模块说明）',

    created_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_code_type (code, data_type),
    INDEX idx_enabled_sort (enabled, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='爬虫数据源配置';

INSERT INTO crawl_sources (code, name, url, data_type, enabled, built_in, sort_order) VALUES
('jiangshibao', '讲师宝', 'https://www.jiangshi99.com', 'TRAINER', 1, 1, 10),
('jiangshibao', '讲师宝', 'https://www.jiangshi99.com', 'COURSE', 1, 1, 11),
('lmschina', '企学宝', 'https://www.lmschina.net', 'TRAINER', 1, 1, 20),
('lmschina', '企学宝', 'https://www.lmschina.net', 'COURSE', 1, 1, 21),
('huashijingji', '华师经纪', 'https://www.huashijingji.com', 'TRAINER', 1, 1, 30),
('huashijingji', '华师经纪', 'https://www.huashijingji.com', 'COURSE', 1, 1, 31),
('nlypx', '哪里有培训网', 'https://www.nlypx.com', 'TRAINER', 1, 1, 40),
('nlypx', '哪里有培训网', 'https://www.nlypx.com', 'COURSE', 1, 1, 41),
('zpedu', '中培伟业', 'https://www.zpedu.com', 'TRAINER', 1, 1, 50),
('zpedu', '中培伟业', 'https://www.zpedu.com', 'COURSE', 1, 1, 51),
('jiangshitai', '讲师台', 'https://www.jiangshitai.com', 'TRAINER', 1, 1, 60),
('jiangshitai', '讲师台', 'https://www.jiangshitai.com', 'COURSE', 1, 1, 61);
