-- ==============================================================
-- V8: 统一分类定义表 + 专家分类关联表重构 + 初始数据
-- ==============================================================

-- ------------------------------------------------------------
-- 1. 删除旧的关联表（V7 创建，无线上数据）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `trainer_categories`;

-- ------------------------------------------------------------
-- 2. 创建统一分类定义表
-- ------------------------------------------------------------
CREATE TABLE `sys_categories` (
    `id`          INT           NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `type`        VARCHAR(50)   NOT NULL                 COMMENT '分类类型：TRAINER_EXPERTISE=专家培训领域, TRAINER_INDUSTRY=专家擅长行业',
    `parent_id`   INT           NOT NULL DEFAULT 0       COMMENT '父级 ID，0 表示顶级节点',
    `name`        VARCHAR(100)  NOT NULL                 COMMENT '分类名称',
    `level`       TINYINT       NOT NULL DEFAULT 1       COMMENT '层级：1=一级, 2=二级, 3=三级',
    `sort_order`  INT           NOT NULL DEFAULT 0       COMMENT '同级排序值',
    `is_visible`  TINYINT       NOT NULL DEFAULT 1       COMMENT '是否可见：0=隐藏, 1=可见',
    `icon`        VARCHAR(500)  NULL     DEFAULT ''      COMMENT '图标 URL',
    `description` VARCHAR(500)  NULL     DEFAULT ''      COMMENT '描述',
    `extra`       JSON          NULL                     COMMENT '扩展字段（预留）',
    `created_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    INDEX `idx_type_parent`  (`type`, `parent_id`),
    INDEX `idx_type_level`   (`type`, `level`),
    INDEX `idx_sort_order`   (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='统一分类定义表';

-- ------------------------------------------------------------
-- 3. 创建专家-培训领域关联表
-- ------------------------------------------------------------
CREATE TABLE `trainer_expertise_categories` (
    `id`          INT      NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `trainer_id`  INT      NOT NULL                 COMMENT '关联 user_trainers.id',
    `category_id` INT      NOT NULL                 COMMENT '关联 sys_categories.id',
    `sort_order`  INT      NOT NULL DEFAULT 0       COMMENT '排序值',
    `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `uk_trainer_category` (`trainer_id`, `category_id`),
    INDEX `idx_category_id` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家-培训领域关联表';

-- ------------------------------------------------------------
-- 4. 创建专家-擅长行业关联表
-- ------------------------------------------------------------
CREATE TABLE `trainer_industry_categories` (
    `id`          INT      NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `trainer_id`  INT      NOT NULL                 COMMENT '关联 user_trainers.id',
    `category_id` INT      NOT NULL                 COMMENT '关联 sys_categories.id',
    `sort_order`  INT      NOT NULL DEFAULT 0       COMMENT '排序值',
    `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP                  COMMENT '创建时间',
    `updated_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `uk_trainer_category` (`trainer_id`, `category_id`),
    INDEX `idx_category_id` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家-擅长行业关联表';


-- ============================================================
-- 5. 初始化 TRAINER_EXPERTISE 数据（27 个一级 + 子级）
--    数据来源：taoke.com 专家筛选页面
-- ============================================================

-- ----- 经营战略 -----
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES ('TRAINER_EXPERTISE', 0, '经营战略', 1, 1, 1);
SET @p = LAST_INSERT_ID();
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES
('TRAINER_EXPERTISE', @p, '战略规划', 2, 1, 1),
('TRAINER_EXPERTISE', @p, '集团管控', 2, 2, 1),
('TRAINER_EXPERTISE', @p, '定位及模式', 2, 3, 1),
('TRAINER_EXPERTISE', @p, '宏观形势', 2, 4, 1),
('TRAINER_EXPERTISE', @p, '企业文化', 2, 5, 1),
('TRAINER_EXPERTISE', @p, '资本运作', 2, 6, 1),
('TRAINER_EXPERTISE', @p, '互联网思维', 2, 7, 1),
('TRAINER_EXPERTISE', @p, '战略解码', 2, 8, 1),
('TRAINER_EXPERTISE', @p, '战略综合', 2, 9, 1);

-- ----- 市场营销 -----
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES ('TRAINER_EXPERTISE', 0, '市场营销', 1, 2, 1);
SET @p = LAST_INSERT_ID();
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES
('TRAINER_EXPERTISE', @p, '会议营销', 2, 1, 1),
('TRAINER_EXPERTISE', @p, '展会营销', 2, 2, 1),
('TRAINER_EXPERTISE', @p, '网络营销', 2, 3, 1),
('TRAINER_EXPERTISE', @p, 'O2O营销', 2, 4, 1),
('TRAINER_EXPERTISE', @p, '品牌建设', 2, 5, 1),
('TRAINER_EXPERTISE', @p, '市场调研', 2, 6, 1),
('TRAINER_EXPERTISE', @p, '大数据营销', 2, 7, 1),
('TRAINER_EXPERTISE', @p, '营销综合', 2, 8, 1);

-- ----- 研发管理 -----
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES ('TRAINER_EXPERTISE', 0, '研发管理', 1, 3, 1);
SET @p = LAST_INSERT_ID();
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES
('TRAINER_EXPERTISE', @p, '产品设计', 2, 1, 1),
('TRAINER_EXPERTISE', @p, '产品开发', 2, 2, 1),
('TRAINER_EXPERTISE', @p, '产品测试', 2, 3, 1),
('TRAINER_EXPERTISE', @p, 'IPD', 2, 4, 1),
('TRAINER_EXPERTISE', @p, 'CMM', 2, 5, 1);

-- ----- 销售管理 -----
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES ('TRAINER_EXPERTISE', 0, '销售管理', 1, 4, 1);
SET @p = LAST_INSERT_ID();
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES
('TRAINER_EXPERTISE', @p, '电话销售', 2, 1, 1),
('TRAINER_EXPERTISE', @p, '互联网销售', 2, 2, 1),
('TRAINER_EXPERTISE', @p, '渠道销售', 2, 3, 1),
('TRAINER_EXPERTISE', @p, '门店销售', 2, 4, 1),
('TRAINER_EXPERTISE', @p, '大客户销售', 2, 5, 1),
('TRAINER_EXPERTISE', @p, '销售谈判', 2, 6, 1),
('TRAINER_EXPERTISE', @p, '销售心态', 2, 7, 1),
('TRAINER_EXPERTISE', @p, '销售综合', 2, 8, 1);

-- ----- 采购管理 -----
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES ('TRAINER_EXPERTISE', 0, '采购管理', 1, 5, 1);
SET @p = LAST_INSERT_ID();
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES
('TRAINER_EXPERTISE', @p, '采购成本管理', 2, 1, 1),
('TRAINER_EXPERTISE', @p, '供应商管理', 2, 2, 1),
('TRAINER_EXPERTISE', @p, '供应链管理', 2, 3, 1),
('TRAINER_EXPERTISE', @p, '采购管理综合', 2, 4, 1);

-- ----- 生产管理 -----
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES ('TRAINER_EXPERTISE', 0, '生产管理', 1, 6, 1);
SET @p = LAST_INSERT_ID();
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES
('TRAINER_EXPERTISE', @p, '班组长管理', 2, 1, 1),
('TRAINER_EXPERTISE', @p, '5S/6S', 2, 2, 1),
('TRAINER_EXPERTISE', @p, '生产成本管理', 2, 3, 1),
('TRAINER_EXPERTISE', @p, '设备管理', 2, 4, 1),
('TRAINER_EXPERTISE', @p, '精益生产', 2, 5, 1),
('TRAINER_EXPERTISE', @p, '生产管理综合', 2, 6, 1);

-- ----- 物流管理 -----
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES ('TRAINER_EXPERTISE', 0, '物流管理', 1, 7, 1);
SET @p = LAST_INSERT_ID();
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES
('TRAINER_EXPERTISE', @p, '物流师', 2, 1, 1),
('TRAINER_EXPERTISE', @p, '仓储管理', 2, 2, 1),
('TRAINER_EXPERTISE', @p, '运输管理', 2, 3, 1),
('TRAINER_EXPERTISE', @p, '物流管理综合', 2, 4, 1);

-- ----- 客户服务 -----
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES ('TRAINER_EXPERTISE', 0, '客户服务', 1, 8, 1);
SET @p = LAST_INSERT_ID();
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES
('TRAINER_EXPERTISE', @p, '大客户服务', 2, 1, 1),
('TRAINER_EXPERTISE', @p, '客户关系管理', 2, 2, 1),
('TRAINER_EXPERTISE', @p, '座席客服', 2, 3, 1),
('TRAINER_EXPERTISE', @p, '客服综合', 2, 4, 1);

-- ----- 财务税务 -----
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES ('TRAINER_EXPERTISE', 0, '财务税务', 1, 9, 1);
SET @p = LAST_INSERT_ID();
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES
('TRAINER_EXPERTISE', @p, '税务管理', 2, 1, 1),
('TRAINER_EXPERTISE', @p, '成本管理', 2, 2, 1),
('TRAINER_EXPERTISE', @p, '预算管理', 2, 3, 1),
('TRAINER_EXPERTISE', @p, '非财财', 2, 4, 1),
('TRAINER_EXPERTISE', @p, '财务管理综合', 2, 5, 1);

-- ----- 人力资源 -----
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES ('TRAINER_EXPERTISE', 0, '人力资源', 1, 10, 1);
SET @p = LAST_INSERT_ID();
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES
('TRAINER_EXPERTISE', @p, '招聘面试', 2, 1, 1),
('TRAINER_EXPERTISE', @p, '员工关系管理', 2, 2, 1),
('TRAINER_EXPERTISE', @p, '绩效管理', 2, 3, 1),
('TRAINER_EXPERTISE', @p, '薪酬福利', 2, 4, 1),
('TRAINER_EXPERTISE', @p, '非人人', 2, 5, 1),
('TRAINER_EXPERTISE', @p, '人力资源管理综合', 2, 6, 1);

-- ----- 培训发展 -----
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES ('TRAINER_EXPERTISE', 0, '培训发展', 1, 11, 1);
SET @p = LAST_INSERT_ID();
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES
('TRAINER_EXPERTISE', @p, '培训体系建设', 2, 1, 1),
('TRAINER_EXPERTISE', @p, '内训师建设', 2, 2, 1),
('TRAINER_EXPERTISE', @p, '培训供应商管理', 2, 3, 1),
('TRAINER_EXPERTISE', @p, '游学/考察/参展', 2, 4, 1),
('TRAINER_EXPERTISE', @p, '培训管理综合', 2, 5, 1);

-- ----- 质量管理 -----
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES ('TRAINER_EXPERTISE', 0, '质量管理', 1, 12, 1);
SET @p = LAST_INSERT_ID();
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES
('TRAINER_EXPERTISE', @p, '质量标准', 2, 1, 1),
('TRAINER_EXPERTISE', @p, '质量控制与改进', 2, 2, 1),
('TRAINER_EXPERTISE', @p, '质量体系', 2, 3, 1),
('TRAINER_EXPERTISE', @p, '质量管理综合', 2, 4, 1);

-- ----- 项目管理 -----
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES ('TRAINER_EXPERTISE', 0, '项目管理', 1, 13, 1);
SET @p = LAST_INSERT_ID();
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES
('TRAINER_EXPERTISE', @p, 'PMP', 2, 1, 1),
('TRAINER_EXPERTISE', @p, '研发项目管理', 2, 2, 1),
('TRAINER_EXPERTISE', @p, '工程项目管理', 2, 3, 1),
('TRAINER_EXPERTISE', @p, '项目管理基础', 2, 4, 1),
('TRAINER_EXPERTISE', @p, '流程管理', 2, 5, 1),
('TRAINER_EXPERTISE', @p, '项目管理综合', 2, 6, 1);

-- ----- 领导力 -----
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES ('TRAINER_EXPERTISE', 0, '领导力', 1, 14, 1);
SET @p = LAST_INSERT_ID();
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES
('TRAINER_EXPERTISE', @p, '自我管理', 2, 1, 1),
('TRAINER_EXPERTISE', @p, '团队管理', 2, 2, 1),
('TRAINER_EXPERTISE', @p, '目标管理', 2, 3, 1),
('TRAINER_EXPERTISE', @p, '教练技术', 2, 4, 1),
('TRAINER_EXPERTISE', @p, '思维力', 2, 5, 1),
('TRAINER_EXPERTISE', @p, '领导力综合', 2, 6, 1);

-- ----- 职业素养 -----
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES ('TRAINER_EXPERTISE', 0, '职业素养', 1, 15, 1);
SET @p = LAST_INSERT_ID();
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES
('TRAINER_EXPERTISE', @p, '办公技能', 2, 1, 1),
('TRAINER_EXPERTISE', @p, '商务礼仪', 2, 2, 1),
('TRAINER_EXPERTISE', @p, '职场习惯', 2, 3, 1),
('TRAINER_EXPERTISE', @p, '思维工具', 2, 4, 1),
('TRAINER_EXPERTISE', @p, '职场心态', 2, 5, 1),
('TRAINER_EXPERTISE', @p, '职业素养综合', 2, 6, 1);

-- ----- 职业技能 -----
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES ('TRAINER_EXPERTISE', 0, '职业技能', 1, 16, 1);
SET @p = LAST_INSERT_ID();
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES
('TRAINER_EXPERTISE', @p, '职业技能训练', 2, 1, 1),
('TRAINER_EXPERTISE', @p, '职业资格认证', 2, 2, 1);

-- ----- MBA/总裁班 -----
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES ('TRAINER_EXPERTISE', 0, 'MBA/总裁班', 1, 17, 1);
SET @p = LAST_INSERT_ID();
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES
('TRAINER_EXPERTISE', @p, 'MBA', 2, 1, 1),
('TRAINER_EXPERTISE', @p, '总裁班', 2, 2, 1),
('TRAINER_EXPERTISE', @p, '私人董事会', 2, 3, 1);

-- ----- 国学/心理学 -----
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES ('TRAINER_EXPERTISE', 0, '国学/心理学', 1, 18, 1);
SET @p = LAST_INSERT_ID();
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES
('TRAINER_EXPERTISE', @p, '国学', 2, 1, 1),
('TRAINER_EXPERTISE', @p, '心理学', 2, 2, 1),
('TRAINER_EXPERTISE', @p, 'NLP', 2, 3, 1);

-- ----- 语言 -----
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES ('TRAINER_EXPERTISE', 0, '语言', 1, 19, 1);
SET @p = LAST_INSERT_ID();
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES
('TRAINER_EXPERTISE', @p, '互联网', 2, 1, 1),
('TRAINER_EXPERTISE', @p, '数字化', 2, 2, 1),
('TRAINER_EXPERTISE', @p, 'IT技能', 2, 3, 1),
('TRAINER_EXPERTISE', @p, '外语', 2, 4, 1),
('TRAINER_EXPERTISE', @p, '方言', 2, 5, 1);

-- ----- 行政/法规 -----
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES ('TRAINER_EXPERTISE', 0, '行政/法规', 1, 20, 1);
SET @p = LAST_INSERT_ID();
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES
('TRAINER_EXPERTISE', @p, '行政管理', 2, 1, 1),
('TRAINER_EXPERTISE', @p, '劳动法', 2, 2, 1),
('TRAINER_EXPERTISE', @p, '经济法', 2, 3, 1),
('TRAINER_EXPERTISE', @p, '税法等', 2, 4, 1);

-- ----- 党政爱国 -----
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES ('TRAINER_EXPERTISE', 0, '党政爱国', 1, 21, 1);
SET @p = LAST_INSERT_ID();
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES
('TRAINER_EXPERTISE', @p, '党史党建', 2, 1, 1),
('TRAINER_EXPERTISE', @p, '爱国教育', 2, 2, 1);

-- ----- 家庭亲子 -----
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES ('TRAINER_EXPERTISE', 0, '家庭亲子', 1, 22, 1);
SET @p = LAST_INSERT_ID();
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES
('TRAINER_EXPERTISE', @p, '家庭教育', 2, 1, 1),
('TRAINER_EXPERTISE', @p, '亲子教育', 2, 2, 1),
('TRAINER_EXPERTISE', @p, '青少年励志', 2, 3, 1),
('TRAINER_EXPERTISE', @p, '学生生源规划', 2, 4, 1),
('TRAINER_EXPERTISE', @p, '高考志愿填报', 2, 5, 1),
('TRAINER_EXPERTISE', @p, '夫妻关系', 2, 6, 1),
('TRAINER_EXPERTISE', @p, '母婴育儿', 2, 7, 1);

-- ----- 健康养生 -----
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES ('TRAINER_EXPERTISE', 0, '健康养生', 1, 23, 1);
SET @p = LAST_INSERT_ID();
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES
('TRAINER_EXPERTISE', @p, '中医养生', 2, 1, 1),
('TRAINER_EXPERTISE', @p, '健康管理', 2, 2, 1),
('TRAINER_EXPERTISE', @p, '运动健康', 2, 3, 1),
('TRAINER_EXPERTISE', @p, '膳食营养', 2, 4, 1);

-- ----- 政经 -----
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES ('TRAINER_EXPERTISE', 0, '政经', 1, 24, 1);
SET @p = LAST_INSERT_ID();
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES
('TRAINER_EXPERTISE', @p, '宏观经济', 2, 1, 1),
('TRAINER_EXPERTISE', @p, '政治态势', 2, 2, 1);

-- ----- 新媒体 -----
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES ('TRAINER_EXPERTISE', 0, '新媒体', 1, 25, 1);
SET @p = LAST_INSERT_ID();
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES
('TRAINER_EXPERTISE', @p, '视频号', 2, 1, 1),
('TRAINER_EXPERTISE', @p, '抖音', 2, 2, 1),
('TRAINER_EXPERTISE', @p, '快手', 2, 3, 1),
('TRAINER_EXPERTISE', @p, '小红书', 2, 4, 1),
('TRAINER_EXPERTISE', @p, '哔哩哔哩', 2, 5, 1);

-- ----- 新技术 -----
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES ('TRAINER_EXPERTISE', 0, '新技术', 1, 26, 1);
SET @p = LAST_INSERT_ID();
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES
('TRAINER_EXPERTISE', @p, '5G', 2, 1, 1),
('TRAINER_EXPERTISE', @p, 'AI', 2, 2, 1),
('TRAINER_EXPERTISE', @p, '智能驾驶', 2, 3, 1);

-- ----- 其它 -----
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES ('TRAINER_EXPERTISE', 0, '其它', 1, 27, 1);
SET @p = LAST_INSERT_ID();
INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES
('TRAINER_EXPERTISE', @p, '拓展训练', 2, 1, 1),
('TRAINER_EXPERTISE', @p, '其它', 2, 2, 1),
('TRAINER_EXPERTISE', @p, '新能源', 2, 3, 1);


-- ============================================================
-- 6. 初始化 TRAINER_INDUSTRY 数据（18 个一级，无子级）
--    数据来源：taoke.com 专家筛选页面「擅长行业」
-- ============================================================

INSERT INTO `sys_categories` (`type`, `parent_id`, `name`, `level`, `sort_order`, `is_visible`) VALUES
('TRAINER_INDUSTRY', 0, '金融保险', 1, 1, 1),
('TRAINER_INDUSTRY', 0, '软件', 1, 2, 1),
('TRAINER_INDUSTRY', 0, '通信电子家电', 1, 3, 1),
('TRAINER_INDUSTRY', 0, '房产建筑装饰', 1, 4, 1),
('TRAINER_INDUSTRY', 0, '日化医疗制药', 1, 5, 1),
('TRAINER_INDUSTRY', 0, '汽车机械制造', 1, 6, 1),
('TRAINER_INDUSTRY', 0, '文教体传媒', 1, 7, 1),
('TRAINER_INDUSTRY', 0, '食品餐饮', 1, 8, 1),
('TRAINER_INDUSTRY', 0, '批发零售', 1, 9, 1),
('TRAINER_INDUSTRY', 0, '服装纺织', 1, 10, 1),
('TRAINER_INDUSTRY', 0, '能源化工', 1, 11, 1),
('TRAINER_INDUSTRY', 0, '交通仓储', 1, 12, 1),
('TRAINER_INDUSTRY', 0, '休闲旅游住宿', 1, 13, 1),
('TRAINER_INDUSTRY', 0, '家具厨卫', 1, 14, 1),
('TRAINER_INDUSTRY', 0, '政府公共', 1, 15, 1),
('TRAINER_INDUSTRY', 0, '农林牧渔', 1, 16, 1),
('TRAINER_INDUSTRY', 0, '美容形体行业', 1, 17, 1),
('TRAINER_INDUSTRY', 0, '其它', 1, 18, 1);
