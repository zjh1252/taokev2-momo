-- --------------------------------------------------------
-- 主机:                           10.0.14.20
-- 服务器版本:                        8.0.25 - MySQL Community Server - GPL
-- 服务器操作系统:                      Linux
-- HeidiSQL 版本:                  12.19.0.7314
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- 导出  表 v3test.agent_work_experiences 结构
CREATE TABLE IF NOT EXISTS `agent_work_experiences` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `agent_id` int NOT NULL COMMENT '经纪人扩展表 user_agents.id',
  `company_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '单位名称',
  `position` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '' COMMENT '担任职务',
  `start_date` date NOT NULL COMMENT '起始日期',
  `end_date` date DEFAULT NULL COMMENT '结束日期，NULL=至今',
  `job_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT '工作描述',
  `proof_file` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '' COMMENT '证明文件 URL（劳动合同/名片/工牌等）',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '审核状态：1待审核 2已通过 3已驳回',
  `reject_reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '' COMMENT '驳回原因',
  `submitted_at` datetime DEFAULT NULL COMMENT '最近一次提交时间',
  `audited_at` datetime DEFAULT NULL COMMENT '最近一次审核时间',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序值',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_agent_id` (`agent_id`) USING BTREE,
  KEY `idx_status` (`status`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='经纪人工作认证记录';

-- 数据导出被取消选择。

-- 导出  表 v3test.carts 结构
CREATE TABLE IF NOT EXISTS `carts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `product_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '商品类型：OPEN_COURSE/VIDEO_COURSE',
  `product_id` int NOT NULL COMMENT '商品ID（课程ID或录播课ID）',
  `product_title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '商品标题（冗余快照）',
  `product_cover` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '商品封面（冗余快照）',
  `price` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '加入时单价快照',
  `quantity` int NOT NULL DEFAULT '1' COMMENT '数量',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_user_product` (`user_id`,`product_type`,`product_id`) USING BTREE,
  KEY `idx_user_id` (`user_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2053 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='购物车';

-- 数据导出被取消选择。

-- 导出  表 v3test.common_regions 结构
CREATE TABLE IF NOT EXISTS `common_regions` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `code` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `name` varchar(765) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `en_name` varchar(80) DEFAULT NULL COMMENT '行政区拼音（用于 URL 路由，仅省/市两级回填）',
  `parent_code` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `level` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_code` (`code`) USING BTREE,
  UNIQUE KEY `idx_en_name` (`en_name`),
  KEY `idx_parent_code` (`parent_code`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=44905 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 数据导出被取消选择。

-- 导出  表 v3test.course_enrollments 结构
CREATE TABLE IF NOT EXISTS `course_enrollments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL COMMENT '公开课ID',
  `user_id` int NOT NULL COMMENT '报名用户ID',
  `order_id` int NOT NULL DEFAULT '0' COMMENT '关联订单ID',
  `price_paid` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '实付金额',
  `enrolled_at` datetime DEFAULT NULL COMMENT '报名时间',
  `expired_at` datetime DEFAULT NULL COMMENT '过期时间',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：1=有效 0=已取消/退款',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_course_user` (`course_id`,`user_id`) USING BTREE,
  KEY `idx_user_id` (`user_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=83 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公开课报名记录';

-- 数据导出被取消选择。

-- 导出  表 v3test.course_images 结构
CREATE TABLE IF NOT EXISTS `course_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL COMMENT '关联 courses.id',
  `image_url` varchar(500) NOT NULL COMMENT '图片 URL',
  `thumbnail_url` varchar(500) DEFAULT NULL COMMENT '缩略图 URL',
  `image_type` varchar(20) DEFAULT 'DETAIL' COMMENT 'BANNER/DETAIL/CASE',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_course_id` (`course_id`)
) ENGINE=InnoDB AUTO_INCREMENT=57330 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='课程图片';

-- 数据导出被取消选择。

-- 导出  表 v3test.course_plans 结构
CREATE TABLE IF NOT EXISTS `course_plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL COMMENT '关联 courses.id',
  `start_time` datetime NOT NULL COMMENT '开课开始时间',
  `end_time` datetime NOT NULL COMMENT '开课结束时间',
  `province_id` int NOT NULL DEFAULT '0' COMMENT '省份 ID（线下公开课必填）',
  `city_id` int NOT NULL DEFAULT '0' COMMENT '城市 ID（线下公开课必填）',
  `district_id` int NOT NULL DEFAULT '0' COMMENT '区/县 ID（选填）',
  `address` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '具体地址（线下公开课必填）',
  `online_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '开课网址（线上公开课必填）',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_course_id` (`course_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=492643 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公开课开课计划表';

-- 数据导出被取消选择。

-- 导出  表 v3test.courses 结构
CREATE TABLE IF NOT EXISTS `courses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '课程标题',
  `type` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INTERNAL' COMMENT '课程类型：INTERNAL/OPEN_OFFLINE/OPEN_ONLINE',
  `publisher_id` int NOT NULL COMMENT '发布者 ID（用户 ID）',
  `publisher_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '发布者类型：TRAINER/INSTITUTION',
  `category_id` int DEFAULT '0' COMMENT '一级分类 ID（关联 sys_categories）',
  `sub_category_id` int DEFAULT '0' COMMENT '二级分类 ID',
  `cover_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '课程封面 URL',
  `intro` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '课程介绍（富文本 HTML）',
  `summary` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '课程简介（短文本）',
  `syllabus` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '课程大纲（富文本 HTML）',
  `material_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '课程资料文件 URL（doc/docx/pdf）',
  `material_text` longtext COLLATE utf8mb4_unicode_ci COMMENT '课程资料抽取后的全文（用于 AI 解析与重跑）',
  `audience` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '适用人群',
  `highlights` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '课程亮点/收益',
  `duration_days` int DEFAULT '0' COMMENT '课程天数',
  `total_hours` decimal(5,1) NOT NULL DEFAULT '0.0' COMMENT '课程总时长（小时）',
  `price` decimal(10,2) DEFAULT '0.00' COMMENT '课程价格',
  `original_price` decimal(10,2) DEFAULT '0.00' COMMENT '原价（划线价）',
  `keywords` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '关键词，逗号分隔',
  `trainer_id` int DEFAULT '0' COMMENT '关联讲师 ID（专家发布时自动绑定）',
  `is_featured` tinyint NOT NULL DEFAULT '0' COMMENT '是否主打课程：0=否 1=是',
  `is_free` tinyint NOT NULL DEFAULT '0' COMMENT '是否免费：0=否 1=是',
  `has_plan` tinyint NOT NULL DEFAULT '0' COMMENT '是否有公开课计划：0=否 1=是',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态：0=草稿 1=待审核 2=已上架 3=驳回 4=已下架',
  `reject_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '驳回原因',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序权重（越大越靠前）',
  `view_count` int NOT NULL DEFAULT '0' COMMENT '浏览量',
  `enrollment_count` int NOT NULL DEFAULT '0' COMMENT '报名人数',
  `last_enrolled_at` datetime DEFAULT NULL COMMENT '最近一次报名时间，用于近期热度排序',
  `score` decimal(3,2) NOT NULL DEFAULT '0.00' COMMENT '综合评分（0.00-5.00）',
  `published_at` datetime DEFAULT NULL COMMENT '上线时间',
  `course_open_end_date` date DEFAULT NULL COMMENT '线下公开课结束日期（最晚场次 end_time 的日期部分）',
  `is_expire_hide` tinyint NOT NULL DEFAULT '1' COMMENT '到期是否前台自动隐藏：1=是 0=否',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_type_status` (`type`,`status`) USING BTREE,
  KEY `idx_publisher` (`publisher_id`,`publisher_type`) USING BTREE,
  KEY `idx_category` (`category_id`,`sub_category_id`) USING BTREE,
  KEY `idx_trainer_id` (`trainer_id`) USING BTREE,
  KEY `idx_is_featured` (`is_featured`,`status`) USING BTREE,
  KEY `idx_courses_last_enrolled_at` (`last_enrolled_at`) USING BTREE,
  KEY `idx_title_dedup` (`title`(100)),
  KEY `idx_course_open_expire` (`type`,`is_expire_hide`,`course_open_end_date`)
) ENGINE=InnoDB AUTO_INCREMENT=441062 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程主表';

-- 数据导出被取消选择。

-- 导出  表 v3test.crawl_jobs 结构
CREATE TABLE IF NOT EXISTS `crawl_jobs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `source` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '数据源标识',
  `data_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '数据类型：TRAINER/COURSE',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态：0=待执行 1=运行中 2=已完成 3=失败 4=已取消',
  `config_json` json DEFAULT NULL COMMENT '爬取配置（起始 URL、参数等）',
  `crawler_job_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Python 服务端的任务 ID',
  `total_count` int NOT NULL DEFAULT '0' COMMENT '总计爬取条数',
  `processed_count` int NOT NULL DEFAULT '0' COMMENT '已处理条数',
  `success_count` int NOT NULL DEFAULT '0' COMMENT '成功入库条数',
  `duplicate_count` int NOT NULL DEFAULT '0' COMMENT '去重跳过条数',
  `error_count` int NOT NULL DEFAULT '0' COMMENT '错误条数',
  `error_message` text COLLATE utf8mb4_unicode_ci COMMENT '失败原因',
  `progress_message` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '当前进度说明',
  `started_at` datetime DEFAULT NULL COMMENT '开始时间',
  `finished_at` datetime DEFAULT NULL COMMENT '完成时间',
  `triggered_by` int NOT NULL COMMENT '触发人 user_id',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_source_type` (`source`,`data_type`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='爬虫任务记录表';

-- 数据导出被取消选择。

-- 导出  表 v3test.crawl_sources 结构
CREATE TABLE IF NOT EXISTS `crawl_sources` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '数据源标识（小写英文，对应 Python 爬虫 code）',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '展示名称',
  `url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '站点首页 URL',
  `data_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '数据类型：TRAINER/COURSE',
  `enabled` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否启用',
  `built_in` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否内置种子（内置项不可删除）',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序（越小越靠前）',
  `remark` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注（如 Python 爬虫模块说明）',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code_type` (`code`,`data_type`),
  KEY `idx_enabled_sort` (`enabled`,`sort_order`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='爬虫数据源配置';

-- 数据导出被取消选择。

-- 导出  表 v3test.crawled_courses 结构
CREATE TABLE IF NOT EXISTS `crawled_courses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `source` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '数据来源站点标识',
  `source_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '来源页面 URL',
  `source_course_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '来源站点课程 ID（去重用）',
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '课程标题',
  `type` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OPEN_OFFLINE' COMMENT '课程类型：OPEN_OFFLINE/OPEN_ONLINE/INTERNAL',
  `category_id` int NOT NULL DEFAULT '0' COMMENT '一级分类 ID（需管理员映射）',
  `sub_category_id` int NOT NULL DEFAULT '0' COMMENT '二级分类 ID',
  `category_name_raw` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '来源站点的原始分类名（辅助映射）',
  `cover_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '课程封面 URL',
  `intro` longtext COLLATE utf8mb4_unicode_ci COMMENT '课程介绍（HTML）',
  `summary` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '课程简介（短文本）',
  `syllabus` longtext COLLATE utf8mb4_unicode_ci COMMENT '课程大纲（HTML）',
  `audience` text COLLATE utf8mb4_unicode_ci COMMENT '适用人群',
  `highlights` text COLLATE utf8mb4_unicode_ci COMMENT '课程亮点/收益',
  `duration_days` int NOT NULL DEFAULT '0' COMMENT '课程天数',
  `total_hours` decimal(5,1) NOT NULL DEFAULT '0.0' COMMENT '总时长（小时）',
  `price` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '价格',
  `original_price` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '原价',
  `keywords` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '关键词',
  `trainer_name_raw` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '来源站讲师名称（辅助关联）',
  `plans_json` json DEFAULT NULL COMMENT '排课计划 [{startTime,endTime,city,address}]',
  `evaluation_json` json DEFAULT NULL COMMENT '评价/观看人数等',
  `target_audience` text COLLATE utf8mb4_unicode_ci COMMENT '适宜学员',
  `learning_outcomes` text COLLATE utf8mb4_unicode_ci COMMENT '学习收益',
  `services_json` json DEFAULT NULL COMMENT '内训课服务内容',
  `dedup_status` tinyint NOT NULL DEFAULT '0' COMMENT '去重状态：0=未检查 1=无重复 2=有疑似重复 3=确认重复',
  `dedup_course_id` int DEFAULT NULL COMMENT '疑似/确认重复的 courses.id',
  `dedup_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '去重判定原因',
  `review_status` tinyint NOT NULL DEFAULT '0' COMMENT '审核状态：0=待审核 1=已通过 2=已驳回 3=已入库',
  `review_reject_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '驳回原因',
  `reviewed_at` datetime DEFAULT NULL COMMENT '审核时间',
  `imported_course_id` int DEFAULT NULL COMMENT '审核通过后导入的 courses.id',
  `raw_html` longtext COLLATE utf8mb4_unicode_ci COMMENT '原始页面 HTML',
  `raw_json` json DEFAULT NULL COMMENT '爬虫原始输出 JSON',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_source_course` (`source`,`source_course_id`),
  KEY `idx_source` (`source`),
  KEY `idx_source_url` (`source_url`(191)),
  KEY `idx_review_status` (`review_status`),
  KEY `idx_dedup_status` (`dedup_status`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='爬取课程数据中间表（待审核入库）';

-- 数据导出被取消选择。

-- 导出  表 v3test.crawled_trainers 结构
CREATE TABLE IF NOT EXISTS `crawled_trainers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `source` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '数据来源站点标识，如 jiangshibao/huashi123',
  `source_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '来源页面 URL',
  `source_trainer_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '来源站点的讲师 ID/URL slug（去重用）',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '讲师姓名',
  `teaching_name` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '授课姓名',
  `avatar` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '头像 URL（来源站原始地址）',
  `title` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '头衔',
  `gender` tinyint NOT NULL DEFAULT '0' COMMENT '性别：0=未知 1=男 2=女',
  `one_line_intro` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '一句话介绍',
  `bio` text COLLATE utf8mb4_unicode_ci COMMENT '个人简介',
  `intro` longtext COLLATE utf8mb4_unicode_ci COMMENT '详细介绍（HTML/富文本）',
  `background` text COLLATE utf8mb4_unicode_ci COMMENT '从业经历',
  `good_at` text COLLATE utf8mb4_unicode_ci COMMENT '专长描述',
  `specialties` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '擅长领域 JSON 数组',
  `expertise_tags` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '擅长标签，逗号分隔',
  `teaching_style` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '授课风格',
  `experience_years` int DEFAULT NULL COMMENT '从业年限',
  `teaching_years` int DEFAULT NULL COMMENT '培训年限',
  `province_id` int NOT NULL DEFAULT '0' COMMENT '驻地省份 ID',
  `city_id` int NOT NULL DEFAULT '0' COMMENT '驻地城市 ID',
  `partial_clients` text COLLATE utf8mb4_unicode_ci COMMENT '部分客户',
  `education_json` json DEFAULT NULL COMMENT '教育经历 [{school,major,degree,start,end}]',
  `experience_json` json DEFAULT NULL COMMENT '工作经历 [{company,position,start,end,description}]',
  `honors_json` json DEFAULT NULL COMMENT '荣誉资质 [{name,authority,date,description}]',
  `books_json` json DEFAULT NULL COMMENT '著作 [{title,publisher,publishDate,description}]',
  `courses_json` json DEFAULT NULL COMMENT '主讲课程 [{title,type,category,summary}]',
  `cases_json` json DEFAULT NULL COMMENT '案例 [{title,client,description}]',
  `evaluation_json` json DEFAULT NULL COMMENT '评价/评分摘要',
  `dedup_status` tinyint NOT NULL DEFAULT '0' COMMENT '去重状态：0=未检查 1=无重复 2=有疑似重复 3=确认重复',
  `dedup_trainer_id` int DEFAULT NULL COMMENT '疑似/确认重复的 user_trainers.id',
  `dedup_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '去重判定原因',
  `review_status` tinyint NOT NULL DEFAULT '0' COMMENT '审核状态：0=待审核 1=已通过 2=已驳回 3=已入库',
  `review_reject_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '驳回原因',
  `reviewed_at` datetime DEFAULT NULL COMMENT '审核时间',
  `imported_trainer_id` int DEFAULT NULL COMMENT '审核通过后导入的 user_trainers.id',
  `raw_html` longtext COLLATE utf8mb4_unicode_ci COMMENT '原始页面 HTML（调试用）',
  `raw_json` json DEFAULT NULL COMMENT '爬虫原始输出 JSON',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_source_trainer` (`source`,`source_trainer_id`),
  KEY `idx_source` (`source`),
  KEY `idx_source_url` (`source_url`(191)),
  KEY `idx_review_status` (`review_status`),
  KEY `idx_dedup_status` (`dedup_status`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='爬取专家数据中间表（待审核入库）';

-- 数据导出被取消选择。

-- 导出  表 v3test.demand_follow_ups 结构
CREATE TABLE IF NOT EXISTS `demand_follow_ups` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `demand_id` int NOT NULL COMMENT '关联 demands.id',
  `operator_id` int DEFAULT NULL COMMENT '操作人 ID，游客提交时为空',
  `action` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '操作类型：STATUS_CHANGE=状态变更, CS_NOTE=客服备注, CONTACT_RECORD=沟通记录, ASSIGN_CS=分派客服, MATCH_TRIGGER=触发匹配, SYNC_RETRY=同步重试',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '操作内容/备注详情',
  `old_status` tinyint DEFAULT NULL COMMENT '变更前状态（STATUS_CHANGE 时记录）',
  `new_status` tinyint DEFAULT NULL COMMENT '变更后状态（STATUS_CHANGE 时记录）',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_demand_follow_ups_demand_id` (`demand_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='需求跟进记录表';

-- 数据导出被取消选择。

-- 导出  表 v3test.demands 结构
CREATE TABLE IF NOT EXISTS `demands` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `demand_no` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '需求单号',
  `user_id` int DEFAULT NULL COMMENT '提交人用户 ID，游客提交时为空',
  `enterprise_id` int DEFAULT NULL COMMENT '企业信息 ID，关联 user_enterprise_buyers.id',
  `demand_type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '需求类型：DEFAULT=首页发布, TRAINING=企业培训, CASE_CUSTOM=案例定制, INTERNAL_RESERVATION=内训课预约',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '需求标题',
  `training_topic` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '培训主题',
  `trainee_count` int DEFAULT NULL COMMENT '培训人数',
  `budget_min` decimal(12,2) DEFAULT NULL COMMENT '预算最低金额',
  `budget_max` decimal(12,2) DEFAULT NULL COMMENT '预算最高金额',
  `expected_start_date` date DEFAULT NULL COMMENT '期望开始日期',
  `format` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '培训形式：ONLINE=线上, OFFLINE=线下, HYBRID=混合',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '需求详细描述',
  `source_case_id` int DEFAULT NULL COMMENT '来源案例 ID（案例定制时关联 cases.id）',
  `source_course_id` int DEFAULT NULL COMMENT '来源课程 ID（内训课预约时关联）',
  `contact_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '联系人',
  `contact_phone` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '联系电话',
  `province_id` int DEFAULT NULL COMMENT '省份 ID，关联 common_regions.id',
  `city_id` int DEFAULT NULL COMMENT '城市 ID，关联 common_regions.id',
  `district_id` int DEFAULT NULL COMMENT '区/县 ID，关联 common_regions.id',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：1=已提交, 2=处理中, 3=已匹配, 4=已完成, 5=已取消',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_demands_demand_no` (`demand_no`),
  KEY `idx_demands_user_id` (`user_id`) USING BTREE,
  KEY `idx_demands_enterprise_id` (`enterprise_id`) USING BTREE,
  KEY `idx_demands_status` (`status`) USING BTREE,
  KEY `idx_demands_demand_type` (`demand_type`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2289 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='培训需求主表';

-- 数据导出被取消选择。

-- 导出  表 v3test.flyway_schema_history 结构
CREATE TABLE IF NOT EXISTS `flyway_schema_history` (
  `installed_rank` int NOT NULL,
  `version` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `description` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `script` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `checksum` int DEFAULT NULL,
  `installed_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `installed_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `execution_time` int NOT NULL,
  `success` tinyint(1) NOT NULL,
  PRIMARY KEY (`installed_rank`) USING BTREE,
  KEY `flyway_schema_history_s_idx` (`success`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 数据导出被取消选择。

-- 导出  表 v3test.institution_venues 结构
CREATE TABLE IF NOT EXISTS `institution_venues` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `institution_id` int NOT NULL COMMENT '所属机构 ID（user_institutions.id）',
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '场地名称',
  `province_id` int DEFAULT NULL COMMENT '省份 ID',
  `city_id` int DEFAULT NULL COMMENT '城市 ID',
  `district_id` int DEFAULT NULL COMMENT '区县 ID',
  `address` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '详细地址',
  `capacity` int DEFAULT NULL COMMENT '容纳人数',
  `cover_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '封面图 URL',
  `description` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '简介',
  `status` int NOT NULL DEFAULT '1' COMMENT '状态：1=启用，0=停用',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序值，越大越靠前',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `images` json DEFAULT NULL COMMENT '场地图片 URL 列表（JSON 数组）',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_inst_venues_institution_id` (`institution_id`) USING BTREE,
  KEY `idx_inst_venues_status` (`status`) USING BTREE,
  KEY `idx_inst_venues_sort_order` (`sort_order`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='机构场地表';

-- 数据导出被取消选择。

-- 导出  表 v3test.invoice_requests 结构
CREATE TABLE IF NOT EXISTS `invoice_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL COMMENT '订单 ID',
  `order_no` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '订单编号',
  `user_id` int NOT NULL COMMENT '申请用户 ID',
  `invoice_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '发票类型：SPECIAL=全电发票-增值税专用发票 NORMAL=全电发票-普通发票',
  `title_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '抬头类型：PERSONAL=个人 COMPANY=企业',
  `amount` decimal(10,2) NOT NULL COMMENT '开票金额（订单实付金额，不可修改）',
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '发票抬头',
  `tax_no` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '纳税人识别号（企业抬头）',
  `bank_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '开户银行（企业抬头）',
  `bank_account` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '银行账号（企业抬头）',
  `company_address` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '企业地址（企业抬头）',
  `company_phone` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '企业电话（企业抬头）',
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '接收发票的邮箱',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态：0=待开票 1=已开票 2=已驳回',
  `reject_reason` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '驳回原因',
  `issued_at` datetime DEFAULT NULL COMMENT '开具完成时间',
  `invoice_file_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '发票文件 URL',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_invoice_requests_user` (`user_id`,`created_at`),
  KEY `idx_invoice_requests_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='发票申请';

-- 数据导出被取消选择。

-- 导出  表 v3test.notification_templates 结构
CREATE TABLE IF NOT EXISTS `notification_templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '模板编码，如 APPLY_PASSED',
  `channel` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'in_app' COMMENT '通知渠道',
  `lang` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'zh-CN' COMMENT '语言',
  `title_template` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '标题模板，支持 {{变量}} 占位',
  `content_template` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '内容模板，支持 {{变量}} 占位',
  `enabled` tinyint NOT NULL DEFAULT '1' COMMENT '是否启用：0=禁用，1=启用',
  `remark` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注/说明',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_code` (`code`) USING BTREE,
  KEY `idx_notification_templates_code_lang` (`code`,`lang`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知模板表';

-- 数据导出被取消选择。

-- 导出  表 v3test.ops_materials 结构
CREATE TABLE IF NOT EXISTS `ops_materials` (
  `id` int NOT NULL AUTO_INCREMENT,
  `material_type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'COVER' COMMENT '素材类型：COVER课程封面/AVATAR头像',
  `name` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '素材名称',
  `url` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '图片 URL',
  `category` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cover' COMMENT '分类：cover/general 等',
  `scene` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'GENERAL' COMMENT '适用场景',
  `enabled` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否启用',
  `is_default` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否平台默认素材',
  `usage_count` int NOT NULL DEFAULT '0' COMMENT '用户选用次数',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ops_material_category` (`category`),
  KEY `idx_ops_material_enabled` (`enabled`),
  KEY `idx_ops_material_type` (`material_type`),
  KEY `idx_ops_material_is_default` (`is_default`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='运营素材库';

-- 数据导出被取消选择。

-- 导出  表 v3test.order_items 结构
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL COMMENT '关联订单ID',
  `product_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '商品类型：OPEN_COURSE/VIDEO_COURSE',
  `product_id` int NOT NULL COMMENT '商品ID',
  `product_title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '商品标题（下单快照）',
  `product_cover` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '商品封面（下单快照）',
  `price` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '下单时单价',
  `quantity` int NOT NULL DEFAULT '1' COMMENT '数量',
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '小计金额',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_order_id` (`order_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=272738 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单明细';

-- 数据导出被取消选择。

-- 导出  表 v3test.orders 结构
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_no` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '订单编号',
  `user_id` int NOT NULL COMMENT '下单用户ID',
  `total_amount` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '订单原价合计',
  `pay_amount` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '实付金额',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '订单状态：0=待支付 1=已支付 2=已取消 3=已退款 4=已过期',
  `remark` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '用户备注',
  `paid_at` datetime DEFAULT NULL COMMENT '支付时间',
  `expired_at` datetime DEFAULT NULL COMMENT '过期时间（超时自动取消）',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_order_no` (`order_no`) USING BTREE,
  KEY `idx_user_status` (`user_id`,`status`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=200002028 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单主表';

-- 数据导出被取消选择。

-- 导出  表 v3test.payments 结构
CREATE TABLE IF NOT EXISTS `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payment_no` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '支付流水号',
  `order_id` int NOT NULL COMMENT '关联订单ID',
  `order_no` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '关联订单编号（冗余）',
  `user_id` int NOT NULL COMMENT '支付用户ID',
  `amount` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '支付金额',
  `method` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MOCK' COMMENT '支付方式：MOCK/ALIPAY/WECHAT',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '支付状态：0=待支付 1=支付成功 2=支付失败 3=已退款',
  `trade_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '第三方交易号',
  `paid_at` datetime DEFAULT NULL COMMENT '支付完成时间',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_payment_no` (`payment_no`) USING BTREE,
  KEY `idx_order_id` (`order_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=6380 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付记录';

-- 数据导出被取消选择。

-- 导出  表 v3test.recommendation_slot_configs 结构
CREATE TABLE IF NOT EXISTS `recommendation_slot_configs` (
  `slot_code` varchar(50) NOT NULL COMMENT '推荐位编码',
  `lock_main` tinyint(1) NOT NULL DEFAULT '1' COMMENT '首页左侧大卡是否固定展示',
  `lock_middle` tinyint(1) NOT NULL DEFAULT '1' COMMENT '首页中间大卡是否固定展示',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`slot_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='推荐位布局配置';

-- 数据导出被取消选择。

-- 导出  表 v3test.recommended_resources 结构
CREATE TABLE IF NOT EXISTS `recommended_resources` (
  `id` int NOT NULL AUTO_INCREMENT,
  `slot_code` varchar(50) NOT NULL COMMENT '推荐位编码',
  `resource_type` varchar(20) NOT NULL COMMENT 'TRAINER/COURSE/CASE/INSTITUTION',
  `resource_id` int NOT NULL COMMENT '资源主键',
  `category_id` int DEFAULT NULL COMMENT '擅长领域分类 ID（仅 TRAINER_CATEGORY_EXPERT 位）',
  `role_type` varchar(20) NOT NULL DEFAULT 'PRIMARY' COMMENT 'PRIMARY=正式推荐 BACKUP=备选',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序值，越大越靠前',
  `cover_url` varchar(512) DEFAULT NULL COMMENT '推荐封面（运营可覆盖）',
  `title` varchar(200) DEFAULT NULL COMMENT '定位/头衔（首席专家等）',
  `description` text COMMENT '推荐描述（运营可覆盖）',
  `chief_intro` text COMMENT '首席简介（运营可覆盖）',
  `expertise_override` varchar(200) DEFAULT NULL COMMENT '擅长领域展示覆盖',
  `key_tags` varchar(200) DEFAULT NULL COMMENT '关键标签展示覆盖',
  `admin_note` varchar(500) DEFAULT NULL COMMENT '运营备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_slot_resource` (`slot_code`,`resource_type`,`resource_id`,`category_id`,`role_type`),
  KEY `idx_slot_category_sort` (`slot_code`,`category_id`,`sort_order`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='推荐资源位配置';

-- 数据导出被取消选择。

-- 导出  表 v3test.sys_categories 结构
CREATE TABLE IF NOT EXISTS `sys_categories` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分类类型：TRAINER_EXPERTISE=专家培训领域, TRAINER_INDUSTRY=专家擅长行业',
  `parent_id` int NOT NULL DEFAULT '0' COMMENT '父级 ID，0 表示顶级节点',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分类名称',
  `level` tinyint NOT NULL DEFAULT '1' COMMENT '层级：1=一级, 2=二级, 3=三级',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '同级排序值',
  `is_visible` tinyint NOT NULL DEFAULT '1' COMMENT '是否可见：0=隐藏, 1=可见',
  `icon` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '图标 URL',
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '描述',
  `extra` json DEFAULT NULL COMMENT '扩展字段（预留）',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_type_parent` (`type`,`parent_id`) USING BTREE,
  KEY `idx_type_level` (`type`,`level`) USING BTREE,
  KEY `idx_sort_order` (`sort_order`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1372 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='统一分类定义表';

-- 数据导出被取消选择。

-- 导出  表 v3test.sys_notifications 结构
CREATE TABLE IF NOT EXISTS `sys_notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '接收用户 ID',
  `type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '通知类型：SYSTEM / APPLY_RESULT / ORDER / COMMENT',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '通知标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '通知正文',
  `related_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '关联业务 ID（如专家申请 userId、订单 ID 等）',
  `related_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '点击跳转路径',
  `is_read` tinyint NOT NULL DEFAULT '0' COMMENT '是否已读：0=未读，1=已读',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_user_read` (`user_id`,`is_read`) USING BTREE,
  KEY `idx_user_created` (`user_id`,`created_at`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=131 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='站内信通知';

-- 数据导出被取消选择。

-- 导出  表 v3test.sys_permissions 结构
CREATE TABLE IF NOT EXISTS `sys_permissions` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `permission_code` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '权限编码，唯一，如 course:review',
  `permission_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '权限名称',
  `module` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '所属功能模块',
  `action_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '操作类型：VIEW/CREATE/EDIT/DELETE/REVIEW/EXPORT/IMPORT',
  `parent_id` int NOT NULL DEFAULT '0' COMMENT '父权限 ID，0 表示顶级节点',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序权重',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '权限描述',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_permission_code` (`permission_code`) USING BTREE,
  KEY `idx_module` (`module`) USING BTREE,
  KEY `idx_parent_id` (`parent_id`) USING BTREE,
  KEY `idx_action_type` (`action_type`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限节点表';

-- 数据导出被取消选择。

-- 导出  表 v3test.sys_role_permissions 结构
CREATE TABLE IF NOT EXISTS `sys_role_permissions` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `role_id` int NOT NULL COMMENT '角色 ID',
  `permission_id` int NOT NULL COMMENT '权限 ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_role_permission` (`role_id`,`permission_id`) USING BTREE,
  KEY `idx_permission_id` (`permission_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色-权限关联表';

-- 数据导出被取消选择。

-- 导出  表 v3test.sys_roles 结构
CREATE TABLE IF NOT EXISTS `sys_roles` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `role_code` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色编码，唯一',
  `role_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色名称',
  `role_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PLATFORM' COMMENT '角色分类：BUSINESS=业务角色, PLATFORM=运营管理角色',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '角色描述',
  `is_system` tinyint NOT NULL DEFAULT '0' COMMENT '是否系统内置：1=是（不可删除），0=否',
  `is_active` tinyint NOT NULL DEFAULT '1' COMMENT '是否启用：1=启用，0=停用',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_role_code` (`role_code`) USING BTREE,
  KEY `idx_is_active` (`is_active`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RBAC 角色定义表';

-- 数据导出被取消选择。

-- 导出  表 v3test.sys_sensitive_words 结构
CREATE TABLE IF NOT EXISTS `sys_sensitive_words` (
  `id` int NOT NULL AUTO_INCREMENT,
  `word` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '敏感词内容',
  `category` tinyint NOT NULL DEFAULT '5' COMMENT '分类：1=政治敏感, 2=色情低俗, 3=暴力, 4=广告, 5=其他',
  `replacement` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '***' COMMENT '替换文本',
  `enabled` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否启用：0=禁用, 1=启用',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_word` (`word`) USING BTREE,
  KEY `idx_category` (`category`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=28410 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='敏感词表';

-- 数据导出被取消选择。

-- 导出  表 v3test.sys_user_oauth_bindings 结构
CREATE TABLE IF NOT EXISTS `sys_user_oauth_bindings` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` int NOT NULL COMMENT '用户 ID',
  `provider` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '第三方平台：WECHAT / ALIPAY',
  `open_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '第三方 OpenID',
  `union_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '第三方 UnionID（微信体系）',
  `oauth_nickname` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '第三方平台昵称',
  `oauth_avatar_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '第三方平台头像',
  `bound_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '绑定时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_provider_openid` (`provider`,`open_id`) USING BTREE,
  UNIQUE KEY `idx_user_provider` (`user_id`,`provider`) USING BTREE,
  KEY `idx_union_id` (`union_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='第三方登录绑定表';

-- 数据导出被取消选择。

-- 导出  表 v3test.sys_user_operation_logs 结构
CREATE TABLE IF NOT EXISTS `sys_user_operation_logs` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` int NOT NULL COMMENT '操作对象用户 ID',
  `operator_id` int DEFAULT NULL COMMENT '操作人用户 ID',
  `action` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '操作类型：LOGIN / LOGOUT / CHANGE_PASSWORD 等',
  `action_detail` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '操作详情描述',
  `ip` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '操作时 IP',
  `user_agent` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '浏览器 User-Agent',
  `result` tinyint NOT NULL DEFAULT '1' COMMENT '操作结果：1=成功，0=失败',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_user_id` (`user_id`) USING BTREE,
  KEY `idx_operator_id` (`operator_id`) USING BTREE,
  KEY `idx_action` (`action`) USING BTREE,
  KEY `idx_created_at` (`created_at`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户操作日志表';

-- 数据导出被取消选择。

-- 导出  表 v3test.sys_user_role_assignments 结构
CREATE TABLE IF NOT EXISTS `sys_user_role_assignments` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` int NOT NULL COMMENT '用户 ID',
  `role_id` int NOT NULL COMMENT '角色 ID',
  `assigned_by` int NOT NULL COMMENT '分配人用户 ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '分配时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_user_role` (`user_id`,`role_id`) USING BTREE,
  KEY `idx_role_id` (`role_id`) USING BTREE,
  KEY `idx_assigned_by` (`assigned_by`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户-RBAC角色分配表';

-- 数据导出被取消选择。

-- 导出  表 v3test.sys_user_roles 结构
CREATE TABLE IF NOT EXISTS `sys_user_roles` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` int NOT NULL COMMENT '用户 ID',
  `role` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色编码',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '角色状态：1=生效，2=待审核，3=审核驳回，4=已禁用',
  `reapplying` tinyint(1) NOT NULL DEFAULT '0' COMMENT '已生效角色资料重审中：0=否 1=是',
  `approved_at` datetime DEFAULT NULL COMMENT '审核通过时间',
  `approved_by` int DEFAULT NULL COMMENT '审核人用户 ID',
  `reject_reason` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '驳回原因',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_user_role` (`user_id`,`role`) USING BTREE,
  KEY `idx_role` (`role`) USING BTREE,
  KEY `idx_status` (`status`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=10057 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户业务角色表';

-- 数据导出被取消选择。

-- 导出  表 v3test.sys_user_sessions 结构
CREATE TABLE IF NOT EXISTS `sys_user_sessions` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` int NOT NULL COMMENT '用户 ID',
  `session_token` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '会话令牌（JWT jti）',
  `device_name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '设备名称',
  `device_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '设备类型：PC / MOBILE / TABLET',
  `login_ip` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '登录 IP',
  `login_city` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '登录 IP 所属城市',
  `is_active` tinyint NOT NULL DEFAULT '1' COMMENT '是否活跃：1=活跃，0=已下线',
  `login_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
  `logout_at` datetime DEFAULT NULL COMMENT '下线时间',
  `expires_at` datetime NOT NULL COMMENT '会话过期时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_session_token` (`session_token`) USING BTREE,
  KEY `idx_user_active` (`user_id`,`is_active`) USING BTREE,
  KEY `idx_expires_at` (`expires_at`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户登录会话表';

-- 数据导出被取消选择。

-- 导出  表 v3test.sys_user_tags 结构
CREATE TABLE IF NOT EXISTS `sys_user_tags` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` int NOT NULL COMMENT '用户 ID',
  `tag_key` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '标签分类：USER_TYPE / TRAINING_NEED / LEARNING_INTEREST / CUSTOM',
  `tag_value` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '标签值',
  `source` tinyint NOT NULL DEFAULT '1' COMMENT '标签来源：1=系统自动，2=用户自选，3=管理员设置',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_user_tag` (`user_id`,`tag_key`,`tag_value`) USING BTREE,
  KEY `idx_tag_key_value` (`tag_key`,`tag_value`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户标签表';

-- 数据导出被取消选择。

-- 导出  表 v3test.sys_users 结构
CREATE TABLE IF NOT EXISTS `sys_users` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `uc_uid` int DEFAULT NULL COMMENT 'UCenter 用户 ID（关联账号中心，老库 cdbid）',
  `username` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '登录账号（字母/数字/下划线，4-32 位）',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '手机号（与 username 二选一，作为登录凭据）',
  `email` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '邮箱，唯一',
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'BCrypt 加密密码；第三方登录用户可能无密码',
  `nickname` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '昵称',
  `real_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '真实姓名',
  `avatar_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '头像 URL',
  `study_tags` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '学习标签（个人学员，逗号分隔关键词）',
  `gender` tinyint NOT NULL DEFAULT '0' COMMENT '性别：0=未知，1=男，2=女',
  `post_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '邮编',
  `province_id` int NOT NULL DEFAULT '0' COMMENT '省份 ID',
  `city_id` int NOT NULL DEFAULT '0' COMMENT '城市 ID',
  `district_id` int NOT NULL DEFAULT '0' COMMENT '区县 ID',
  `town_id` int NOT NULL DEFAULT '0' COMMENT '乡镇 ID',
  `address` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '详细地址',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '账号状态：1=正常，2=冻结，3=注销',
  `freeze_reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '冻结原因',
  `last_login_at` datetime DEFAULT NULL COMMENT '最近登录时间',
  `last_login_ip` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '最近登录 IP',
  `reg_origin` tinyint NOT NULL DEFAULT '1' COMMENT '注册来源：1=PC官网，2=H5，3=微信小程序，4=后台创建',
  `source` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'old' COMMENT '用户来源：old=老库迁移, new=新注册',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `user_source` tinyint NOT NULL DEFAULT '1' COMMENT '账号来源：1=新站注册，2=老站迁移',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_phone` (`phone`) USING BTREE,
  UNIQUE KEY `idx_email` (`email`) USING BTREE,
  UNIQUE KEY `uk_users_username` (`username`) USING BTREE,
  UNIQUE KEY `uk_users_uc_uid` (`uc_uid`),
  KEY `idx_status` (`status`) USING BTREE,
  KEY `idx_created_at` (`created_at`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1142231 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户基础表';

-- 数据导出被取消选择。

-- 导出  表 v3test.sys_verification_codes 结构
CREATE TABLE IF NOT EXISTS `sys_verification_codes` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `target` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '发送目标（手机号或邮箱）',
  `code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '验证码',
  `type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用途：REGISTER / LOGIN / RESET_PASSWORD / CHANGE_PHONE / CHANGE_EMAIL',
  `send_type` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '发送渠道：SMS / EMAIL',
  `is_used` tinyint NOT NULL DEFAULT '0' COMMENT '是否已使用：0=未使用，1=已使用',
  `expires_at` datetime NOT NULL COMMENT '过期时间',
  `ip` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '请求 IP',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_target_type` (`target`,`type`) USING BTREE,
  KEY `idx_expires_at` (`expires_at`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=346 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='短信邮件验证码表';

-- 数据导出被取消选择。

-- 导出  表 v3test.trainer_educations 结构
CREATE TABLE IF NOT EXISTS `trainer_educations` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `trainer_id` int NOT NULL COMMENT '关联 user_trainers.id',
  `holder_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '持证人姓名（学历文凭上的姓名）',
  `school_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '学校名称',
  `major` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '所学专业',
  `degree` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '学历/学位',
  `start_date` date NOT NULL COMMENT '入学日期',
  `end_date` date DEFAULT NULL COMMENT '毕业日期（NULL=在读）',
  `is_graduated` tinyint NOT NULL DEFAULT '1' COMMENT '是否毕业：0=否，1=是',
  `proof_file` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '证明文件 URL（学历证书照片）',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '审核状态：1待审核 2已通过 3已驳回',
  `reject_reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '驳回原因',
  `audited_at` datetime DEFAULT NULL COMMENT '最近一次审核时间',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序值',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_trainer_id` (`trainer_id`) USING BTREE,
  KEY `idx_status` (`status`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家教育经历表';

-- 数据导出被取消选择。

-- 导出  表 v3test.trainer_expertise_categories 结构
CREATE TABLE IF NOT EXISTS `trainer_expertise_categories` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `trainer_id` int NOT NULL COMMENT '关联 user_trainers.id',
  `category_id` int NOT NULL COMMENT '关联 sys_categories.id',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序值',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_trainer_category` (`trainer_id`,`category_id`) USING BTREE,
  KEY `idx_category_id` (`category_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=65152 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家-培训领域关联表';

-- 数据导出被取消选择。

-- 导出  表 v3test.trainer_honors 结构
CREATE TABLE IF NOT EXISTS `trainer_honors` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `trainer_id` int NOT NULL COMMENT '关联 user_trainers.id',
  `honor_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '荣誉名称',
  `honor_image` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '荣誉证书/图片 URL',
  `issuing_authority` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '颁发机构',
  `issued_at` date DEFAULT NULL COMMENT '获得日期',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '荣誉描述',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序值',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_trainer_id` (`trainer_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家荣誉资质表';

-- 数据导出被取消选择。

-- 导出  表 v3test.trainer_industry_categories 结构
CREATE TABLE IF NOT EXISTS `trainer_industry_categories` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `trainer_id` int NOT NULL COMMENT '关联 user_trainers.id',
  `category_id` int NOT NULL COMMENT '关联 sys_categories.id',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序值',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_trainer_category` (`trainer_id`,`category_id`) USING BTREE,
  KEY `idx_category_id` (`category_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=27927 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家-擅长行业关联表';

-- 数据导出被取消选择。

-- 导出  表 v3test.trainer_lead_messages 结构
CREATE TABLE IF NOT EXISTS `trainer_lead_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `trainer_user_id` int NOT NULL COMMENT '目标专家 user_id',
  `training_topic` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '培训主题 2~30 字',
  `training_goal` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '培训目标详述',
  `contact_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '联系人姓名',
  `contact_mobile` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '联系手机',
  `company_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '公司名称',
  `company_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '公司电话',
  `province_id` int DEFAULT NULL COMMENT '省 ID',
  `city_id` int DEFAULT NULL COMMENT '市 ID',
  `district_id` int DEFAULT NULL COMMENT '区/县 ID，关联 common_regions.id',
  `training_days` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '培训天数',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Email',
  `remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '备注',
  `user_id` int DEFAULT NULL COMMENT '提交人用户 ID（未登录可为空）',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '0=新建 1=已分配 2=已处理',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_msg_trainer` (`trainer_user_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家留言表';

-- 数据导出被取消选择。

-- 导出  表 v3test.trainer_work_experiences 结构
CREATE TABLE IF NOT EXISTS `trainer_work_experiences` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `trainer_id` int NOT NULL COMMENT '关联 user_trainers.id',
  `company_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '单位名称',
  `position` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '职务',
  `start_date` date NOT NULL COMMENT '开始日期',
  `end_date` date DEFAULT NULL COMMENT '结束日期（NULL=至今）',
  `job_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '工作描述',
  `proof_file` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '证明文件 URL（劳动合同/名片/工牌等）',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '审核状态：1待审核 2已通过 3已驳回',
  `reject_reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '驳回原因',
  `audited_at` datetime DEFAULT NULL COMMENT '最近一次审核时间',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序值',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_trainer_id` (`trainer_id`) USING BTREE,
  KEY `idx_status` (`status`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=187 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家工作经历表';

-- 数据导出被取消选择。

-- 导出  表 v3test.training_reviews 结构
CREATE TABLE IF NOT EXISTS `training_reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `review_scope` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '评价范围：COURSE/TRAINER',
  `course_id` int DEFAULT NULL COMMENT '被评课程 ID',
  `trainer_user_id` int DEFAULT NULL COMMENT '被评专家的 user_id',
  `institution_id` int DEFAULT NULL COMMENT '被评机构 ID（review_scope=INSTITUTION 时必填，关联 user_institutions.id）',
  `case_id` int DEFAULT NULL COMMENT '被评案例 ID（review_scope=CASE 时必填）',
  `order_id` int DEFAULT NULL COMMENT '关联订单 ID（可空）',
  `expert_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '专家姓名（冗余快照）',
  `training_date` date DEFAULT NULL COMMENT '培训/出场日期',
  `course_days` decimal(4,1) DEFAULT NULL COMMENT '课程天数/出场天数',
  `course_title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '课程标题/培训主题',
  `client_company` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '甲方企业名称',
  `training_location` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '培训地点',
  `rating_content` tinyint NOT NULL DEFAULT '0' COMMENT '授课内容评分 1-5',
  `rating_teaching` tinyint NOT NULL DEFAULT '0' COMMENT '授课水平评分 1-5',
  `rating_service` tinyint NOT NULL DEFAULT '0' COMMENT '服务态度评分 1-5',
  `avg_score` decimal(3,2) NOT NULL DEFAULT '0.00' COMMENT '三维平均分',
  `comment_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '文字评价（>=20 字）',
  `photo_urls` json DEFAULT NULL COMMENT '图片 URL 数组，限 1~9 张',
  `submitter_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '评价者姓名',
  `submitter_contact` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '专家电话/微信（选填）',
  `user_id` int NOT NULL COMMENT '提交人用户 ID',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '0=待审核 1=通过 -1=驳回 2=隐藏',
  `reject_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '驳回理由',
  `reviewed_by` int DEFAULT NULL COMMENT '审核人用户 ID',
  `reviewed_at` datetime DEFAULT NULL COMMENT '审核时间',
  `anonymous` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否匿名',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_review_course` (`course_id`) USING BTREE,
  KEY `idx_review_trainer` (`trainer_user_id`) USING BTREE,
  KEY `idx_review_user` (`user_id`) USING BTREE,
  KEY `idx_review_status` (`status`) USING BTREE,
  KEY `idx_training_reviews_inst_status_created` (`review_scope`,`institution_id`,`status`,`created_at`) USING BTREE,
  KEY `idx_review_case` (`case_id`),
  KEY `idx_review_reviewed_by` (`reviewed_by`)
) ENGINE=InnoDB AUTO_INCREMENT=43239 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='培训评价表';

-- 数据导出被取消选择。

-- 导出  表 v3test.user_agent_trainer_bindings 结构
CREATE TABLE IF NOT EXISTS `user_agent_trainer_bindings` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `agent_user_id` int NOT NULL COMMENT '经纪人用户 ID',
  `trainer_user_id` int NOT NULL COMMENT '专家用户 ID',
  `status` tinyint NOT NULL DEFAULT '2' COMMENT '绑定状态：1=生效，2=待确认，3=已解绑',
  `confirmed_at` datetime DEFAULT NULL COMMENT '确认时间',
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `reject_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '拒绝理由',
  `initiator_user_id` int DEFAULT NULL COMMENT '发起方用户 ID',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_agent_trainer` (`agent_user_id`,`trainer_user_id`) USING BTREE,
  KEY `idx_trainer_user_id` (`trainer_user_id`) USING BTREE,
  KEY `idx_status` (`status`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='经纪人-专家绑定表';

-- 数据导出被取消选择。

-- 导出  表 v3test.user_agents 结构
CREATE TABLE IF NOT EXISTS `user_agents` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` int NOT NULL COMMENT '用户 ID',
  `real_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '真实姓名',
  `email` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '常用邮箱',
  `bio` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '服务介绍',
  `specialties` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '擅长领域，JSON 数组',
  `service_city_ids` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '服务城市 ID 列表，JSON 数组',
  `service_cities` json DEFAULT NULL COMMENT '服务城市数组 JSON：[{provinceId,cityId,provinceName,cityName}]',
  `agreement_signed_at` datetime DEFAULT NULL COMMENT '注册经纪人合作协议签署时间',
  `agreement_version` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '协议版本号，默认 v1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_user_id` (`user_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家经纪人扩展信息表';

-- 数据导出被取消选择。

-- 导出  表 v3test.user_assistants 结构
CREATE TABLE IF NOT EXISTS `user_assistants` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` int NOT NULL COMMENT '用户 ID',
  `real_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '真实姓名',
  `email` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '常用邮箱',
  `bio` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '服务描述',
  `auth_scope` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '授权范围说明',
  `service_cities` json DEFAULT NULL COMMENT '服务城市数组 JSON：[{provinceId,cityId,provinceName,cityName}]',
  `agreement_signed_at` datetime DEFAULT NULL COMMENT '注册助理合作协议签署时间',
  `agreement_version` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '协议版本号，默认 v1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_user_id` (`user_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家助理扩展信息表';

-- 数据导出被取消选择。

-- 导出  表 v3test.user_buyers 结构
CREATE TABLE IF NOT EXISTS `user_buyers` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` int NOT NULL COMMENT '用户 ID',
  `occupation` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '职业',
  `learning_tags` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '学习兴趣标签，JSON 数组',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_user_id` (`user_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='个人学员扩展信息表';

-- 数据导出被取消选择。

-- 导出  表 v3test.user_enterprise_agent_members 结构
CREATE TABLE IF NOT EXISTS `user_enterprise_agent_members` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `enterprise_agent_id` int NOT NULL COMMENT '经纪公司 ID（user_enterprise_agents.id）',
  `agent_user_id` int NOT NULL COMMENT '经纪人用户 ID',
  `is_leader` tinyint NOT NULL DEFAULT '0' COMMENT '是否负责人：0=否，1=是',
  `joined_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '绑定状态：1=ACTIVE 2=PENDING 3=UNBOUND 4=REJECTED',
  `note` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注',
  `reject_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '拒绝理由',
  `initiator_user_id` int DEFAULT NULL COMMENT '发起方用户 ID',
  `confirmed_at` datetime DEFAULT NULL COMMENT '确认时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_enterprise_agent` (`enterprise_agent_id`,`agent_user_id`) USING BTREE,
  KEY `idx_agent_user_id` (`agent_user_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='经纪公司-经纪人成员表';

-- 数据导出被取消选择。

-- 导出  表 v3test.user_enterprise_agent_trainer_bindings 结构
CREATE TABLE IF NOT EXISTS `user_enterprise_agent_trainer_bindings` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `enterprise_agent_id` int NOT NULL COMMENT '经纪公司 ID（user_enterprise_agents.id）',
  `trainer_user_id` int NOT NULL COMMENT '专家用户 ID',
  `status` tinyint NOT NULL DEFAULT '2' COMMENT '绑定状态：1=生效，2=待确认，3=已解绑，4=已拒绝',
  `confirmed_at` datetime DEFAULT NULL COMMENT '确认时间',
  `reject_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '拒绝理由',
  `note` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '发起备注',
  `initiator_user_id` int DEFAULT NULL COMMENT '发起方用户 ID（用于审计）',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_enterprise_agent_trainer` (`enterprise_agent_id`,`trainer_user_id`) USING BTREE,
  KEY `idx_eat_trainer_user_id` (`trainer_user_id`) USING BTREE,
  KEY `idx_eat_status` (`status`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='经纪公司-专家绑定表';

-- 数据导出被取消选择。

-- 导出  表 v3test.user_enterprise_agents 结构
CREATE TABLE IF NOT EXISTS `user_enterprise_agents` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` int NOT NULL COMMENT '用户 ID（第一个认证的经纪人即为公司负责人）',
  `company_name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '公司名称',
  `license_no` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '营业执照号',
  `legal_person` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '法人姓名',
  `industry` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '所属行业',
  `company_size` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '公司规模',
  `bio` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '公司简介',
  `contact_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '联系人姓名',
  `contact_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '联系电话',
  `post_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '公司所在邮编',
  `province_id` int NOT NULL DEFAULT '0' COMMENT '公司所在省份',
  `city_id` int NOT NULL DEFAULT '0' COMMENT '公司所在城市',
  `district_id` int NOT NULL DEFAULT '0' COMMENT '公司所在区县',
  `town_id` int NOT NULL DEFAULT '0' COMMENT '公司所在乡镇',
  `address` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '公司详细地址',
  `qualification_doc_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '资质证明文件 URL',
  `cert_logo_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '公司 Logo URL',
  `cert_status` tinyint DEFAULT NULL COMMENT '资质认证状态：NULL未提交 1待审核 2已通过 3已驳回',
  `cert_reject_reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '资质认证驳回原因',
  `cert_submitted_at` datetime DEFAULT NULL COMMENT '资质认证最近一次提交时间',
  `cert_audited_at` datetime DEFAULT NULL COMMENT '资质认证最近一次审核时间',
  `agreement_signed_at` datetime DEFAULT NULL COMMENT '注册经纪公司合作协议签署时间',
  `agreement_version` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '协议版本号，默认 v1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_user_id` (`user_id`) USING BTREE,
  KEY `idx_company_name` (`company_name`) USING BTREE,
  KEY `idx_license_no` (`license_no`) USING BTREE,
  KEY `idx_cert_status` (`cert_status`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家经纪公司扩展信息表';

-- 数据导出被取消选择。

-- 导出  表 v3test.user_enterprise_buyers 结构
CREATE TABLE IF NOT EXISTS `user_enterprise_buyers` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` int NOT NULL COMMENT '用户 ID',
  `company_name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '企业名称',
  `industry` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '所属行业',
  `company_size` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '企业规模',
  `contact_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '联系人姓名',
  `contact_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '联系电话',
  `post_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '企业所在邮编',
  `province_id` int NOT NULL DEFAULT '0' COMMENT '企业所在省份',
  `city_id` int NOT NULL DEFAULT '0' COMMENT '企业所在城市',
  `district_id` int NOT NULL DEFAULT '0' COMMENT '企业所在区县',
  `town_id` int NOT NULL DEFAULT '0' COMMENT '企业所在乡镇',
  `address` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '企业详细地址',
  `training_tags` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '培训需求标签，JSON 数组',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_user_id` (`user_id`) USING BTREE,
  KEY `idx_company_name` (`company_name`) USING BTREE,
  KEY `idx_industry` (`industry`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='企业信息表';

-- 数据导出被取消选择。

-- 导出  表 v3test.user_favorites 结构
CREATE TABLE IF NOT EXISTS `user_favorites` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户 ID',
  `target_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '资源类型：COURSE/TRAINER/INSTITUTION/CASE',
  `target_id` int NOT NULL COMMENT '资源主键',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_user_fav_unique` (`user_id`,`target_type`,`target_id`) USING BTREE,
  KEY `idx_fav_target` (`target_type`,`target_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=144 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户收藏表';

-- 数据导出被取消选择。

-- 导出  表 v3test.user_institution_employee_bindings 结构
CREATE TABLE IF NOT EXISTS `user_institution_employee_bindings` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `org_id` int NOT NULL COMMENT '机构 ID（user_organizations.id）',
  `employee_user_id` int NOT NULL COMMENT '员工用户 ID',
  `status` tinyint NOT NULL DEFAULT '2' COMMENT '绑定状态：1=生效，2=待确认，3=已解绑',
  `confirmed_at` datetime DEFAULT NULL COMMENT '确认时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `reject_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '拒绝理由',
  `initiator_user_id` int DEFAULT NULL COMMENT '发起方用户 ID',
  `note` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '发起备注',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_org_employee` (`org_id`,`employee_user_id`) USING BTREE,
  KEY `idx_employee_user_id` (`employee_user_id`) USING BTREE,
  KEY `idx_status` (`status`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='机构-员工绑定表';

-- 数据导出被取消选择。

-- 导出  表 v3test.user_institution_employees 结构
CREATE TABLE IF NOT EXISTS `user_institution_employees` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` int NOT NULL COMMENT '用户 ID',
  `real_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '真实姓名',
  `contact_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '联系电话',
  `email` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '常用邮箱',
  `service_cities` json DEFAULT NULL COMMENT '服务城市数组 JSON：[{provinceId,cityId,provinceName,cityName}]',
  `agreement_signed_at` datetime DEFAULT NULL COMMENT '注册培训机构员工合作协议签署时间',
  `agreement_version` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '协议版本号，默认 v1',
  `org_id` int NOT NULL COMMENT '所属机构 ID（user_organizations.id）',
  `position` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '职位',
  `department` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '部门',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_user_id` (`user_id`) USING BTREE,
  KEY `idx_org_id` (`org_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='机构员工扩展信息表';

-- 数据导出被取消选择。

-- 导出  表 v3test.user_institution_trainer_bindings 结构
CREATE TABLE IF NOT EXISTS `user_institution_trainer_bindings` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `org_id` int NOT NULL COMMENT '机构 ID（user_organizations.id）',
  `trainer_user_id` int NOT NULL COMMENT '专家用户 ID',
  `status` tinyint NOT NULL DEFAULT '2' COMMENT '绑定状态：1=生效，2=待确认，3=已解绑',
  `confirmed_at` datetime DEFAULT NULL COMMENT '确认时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `reject_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '拒绝理由',
  `initiator_user_id` int DEFAULT NULL COMMENT '发起方用户 ID',
  `note` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '发起备注',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_org_trainer` (`org_id`,`trainer_user_id`) USING BTREE,
  KEY `idx_trainer_user_id` (`trainer_user_id`) USING BTREE,
  KEY `idx_status` (`status`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='机构-专家绑定表';

-- 数据导出被取消选择。

-- 导出  表 v3test.user_institutions 结构
CREATE TABLE IF NOT EXISTS `user_institutions` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` int NOT NULL COMMENT '用户 ID',
  `legacy_role_id` int NOT NULL DEFAULT '0' COMMENT '老站 tk_member.roleid（/company/{roleid}.htm）',
  `org_name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '机构名称',
  `org_type` tinyint NOT NULL DEFAULT '0' COMMENT '机构类型：0=非高校，1=高校',
  `company_nature` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '公司性质：国企/民营/外资/合资/事业单位/其他',
  `website` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '公司网址',
  `company_size` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '机构规模',
  `annual_revenue` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '年营业额',
  `registered_capital` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '注册资本',
  `max_commission_rate` decimal(5,2) DEFAULT NULL COMMENT '公开课可接受最高佣金比例 0-100',
  `payment_methods` json DEFAULT NULL COMMENT '可接受付款方式 JSON 字符串数组',
  `has_copyright_course` tinyint DEFAULT '0' COMMENT '是否有版权课：0=否 1=是',
  `bank_card_no` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '银行卡号',
  `bank_name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '开户行',
  `bank_branch` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '开户行支行',
  `license_doc_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '营业执照附件 URL',
  `company_info_status` tinyint DEFAULT NULL COMMENT '公司资料状态：NULL未提交 1待审核 2已通过 3已驳回',
  `company_info_reject_reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '公司资料驳回原因',
  `company_info_submitted_at` datetime DEFAULT NULL COMMENT '公司资料最近一次提交时间',
  `company_info_audited_at` datetime DEFAULT NULL COMMENT '公司资料最近一次审核时间',
  `license_no` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '营业执照号',
  `legal_representative` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '法人代表',
  `established_at` date DEFAULT NULL COMMENT '机构成立日期',
  `bio` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '机构简介（支持富文本）',
  `homepage_config` json DEFAULT NULL COMMENT '主页配置（字体、颜色、布局等）',
  `contact_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '联系人姓名',
  `contact_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '联系电话',
  `show_contact` tinyint NOT NULL DEFAULT '0' COMMENT '是否公开联系方式：0=不公开，1=公开（高校可公开，非高校不可）',
  `post_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '机构所在邮编',
  `province_id` int NOT NULL DEFAULT '0' COMMENT '机构所在省份',
  `city_id` int NOT NULL DEFAULT '0' COMMENT '机构所在城市',
  `district_id` int NOT NULL DEFAULT '0' COMMENT '机构所在区县',
  `town_id` int NOT NULL DEFAULT '0' COMMENT '机构所在乡镇',
  `address` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '机构详细地址',
  `specialties` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '擅长领域，分类 ID 逗号串（一级多选，复用 TRAINER_EXPERTISE 分类树）',
  `industries` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '擅长行业，分类 ID 逗号串（一级多选，复用 TRAINER_INDUSTRY 分类树）',
  `has_venue` tinyint NOT NULL DEFAULT '0' COMMENT '是否有场地：0=否，1=是',
  `has_experts` tinyint NOT NULL DEFAULT '0' COMMENT '是否有专家：0=否，1=是',
  `score` decimal(3,2) NOT NULL DEFAULT '0.00' COMMENT '综合评分（0.00-5.00）',
  `view_count` int NOT NULL DEFAULT '0' COMMENT '浏览量/人气',
  `comment_count` int NOT NULL DEFAULT '0' COMMENT '评价数量',
  `open_course_count` int NOT NULL DEFAULT '0' COMMENT '公开课数量',
  `inner_course_count` int NOT NULL DEFAULT '0' COMMENT '内训课数量',
  `logo_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '机构 Logo URL',
  `banner_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '机构横幅图 URL',
  `is_certified` tinyint NOT NULL DEFAULT '0' COMMENT '是否已认证：0=否，1=是',
  `is_recommended` tinyint NOT NULL DEFAULT '0' COMMENT '是否金牌推荐：0=否，1=是',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序权重，值越大越靠前',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态：0=待审核，1=已发布，2=已下线',
  `public_list_eligible` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否在 C 端机构频道公开展示：0=否 1=是',
  `client_cases` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '服务过的客户描述',
  `success_cases` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '成功案例（长文本，机构详情页对外展示）',
  `agreement_signed_at` datetime DEFAULT NULL COMMENT '注册培训机构合作协议签署时间',
  `agreement_version` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '协议版本号，默认 v1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `association` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否培训协会',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_user_id` (`user_id`) USING BTREE,
  KEY `idx_org_name` (`org_name`) USING BTREE,
  KEY `idx_org_type` (`org_type`) USING BTREE,
  KEY `idx_license_no` (`license_no`) USING BTREE,
  KEY `idx_status` (`status`) USING BTREE,
  KEY `idx_sort_order` (`sort_order`) USING BTREE,
  KEY `idx_company_info_status` (`company_info_status`) USING BTREE,
  KEY `idx_user_institutions_public_list` (`status`,`public_list_eligible`,`sort_order`,`view_count`),
  KEY `idx_user_institutions_legacy_role_id` (`legacy_role_id`,`status`,`public_list_eligible`)
) ENGINE=InnoDB AUTO_INCREMENT=1142182 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='机构扩展信息表';

-- 数据导出被取消选择。

-- 导出  表 v3test.user_likes 结构
CREATE TABLE IF NOT EXISTS `user_likes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户 ID',
  `target_type` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '资源类型：COURSE/TRAINER/INSTITUTION/CASE',
  `target_id` int NOT NULL COMMENT '资源主键',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_user_like_unique` (`user_id`,`target_type`,`target_id`) USING BTREE,
  KEY `idx_like_target` (`target_type`,`target_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户点赞表';

-- 数据导出被取消选择。

-- 导出  表 v3test.user_trainer_assistant_bindings 结构
CREATE TABLE IF NOT EXISTS `user_trainer_assistant_bindings` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `trainer_user_id` int NOT NULL COMMENT '专家用户 ID',
  `assistant_user_id` int NOT NULL COMMENT '助理用户 ID',
  `status` tinyint NOT NULL DEFAULT '2' COMMENT '绑定状态：1=生效，2=待确认，3=已解绑',
  `confirmed_at` datetime DEFAULT NULL COMMENT '确认时间',
  `auth_scope` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '授权范围（JSON 数组，如 ["edit_profile","manage_course"]）',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `reject_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '拒绝理由',
  `initiator_user_id` int DEFAULT NULL COMMENT '发起方用户 ID',
  `note` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '发起备注',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_trainer_user_id` (`trainer_user_id`) USING BTREE,
  UNIQUE KEY `idx_assistant_user_id` (`assistant_user_id`) USING BTREE,
  KEY `idx_status` (`status`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家-助理绑定表';

-- 数据导出被取消选择。

-- 导出  表 v3test.user_trainer_books 结构
CREATE TABLE IF NOT EXISTS `user_trainer_books` (
  `id` int NOT NULL AUTO_INCREMENT,
  `trainer_id` int NOT NULL COMMENT '关联 user_trainers.id',
  `submitter_user_id` int DEFAULT NULL COMMENT '提交著作的用户 ID',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '书名',
  `author_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '专家/作者展示名',
  `cover_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '封面图 URL',
  `publisher` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '出版社',
  `publish_date` date DEFAULT NULL COMMENT '出版日期',
  `description` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '简介',
  `buy_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '购买链接',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序值，越大越靠前',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '0=待审核 1=已通过 2=已驳回',
  `reject_reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '驳回原因',
  `reviewer_id` int DEFAULT NULL COMMENT '审核人 ID',
  `reviewed_at` datetime DEFAULT NULL COMMENT '审核时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_trainer_books_trainer_id` (`trainer_id`) USING BTREE,
  KEY `idx_trainer_books_sort_order` (`sort_order`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1336 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家著作表';

-- 数据导出被取消选择。

-- 导出  表 v3test.user_trainer_case_files 结构
CREATE TABLE IF NOT EXISTS `user_trainer_case_files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `trainer_id` int NOT NULL COMMENT '关联 user_trainers.id',
  `case_id` int NOT NULL COMMENT '关联 user_trainer_cases.id',
  `file_type` tinyint NOT NULL DEFAULT '1' COMMENT '文件类型：1=图片, 2=视频',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '标题',
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '描述',
  `file_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '文件 URL',
  `thumbnail_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '缩略图 URL',
  `width` int NOT NULL DEFAULT '0' COMMENT '图片宽度（px）',
  `height` int NOT NULL DEFAULT '0' COMMENT '图片高度（px）',
  `duration` int NOT NULL DEFAULT '0' COMMENT '视频时长（秒），图片为 0',
  `file_size` bigint NOT NULL DEFAULT '0' COMMENT '文件大小（字节）',
  `auto_extracted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否系统自动萃取',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序值',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '审核状态：0=待审核, 1=通过, 2=驳回',
  `reject_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '驳回原因',
  `reviewer_id` int DEFAULT NULL COMMENT '审核人 ID',
  `reviewed_at` datetime DEFAULT NULL COMMENT '审核时间',
  `view_count` int NOT NULL DEFAULT '0' COMMENT '浏览/播放次数',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_trainer_case_files_case_sort` (`case_id`,`sort_order`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2852 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家案例文件表';

-- 数据导出被取消选择。

-- 导出  表 v3test.user_trainer_cases 结构
CREATE TABLE IF NOT EXISTS `user_trainer_cases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `trainer_id` int NOT NULL COMMENT '关联 user_trainers.id',
  `case_title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '案例标题',
  `enterprise_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '客户/企业名称',
  `industry` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '所属行业',
  `training_topic` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '培训主题',
  `training_effect` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '培训效果描述',
  `trainee_count` int DEFAULT NULL COMMENT '培训人数',
  `province_id` int DEFAULT NULL COMMENT '培训地点 - 省 ID',
  `city_id` int DEFAULT NULL COMMENT '培训地点 - 市 ID',
  `district_id` int DEFAULT NULL COMMENT '培训地点 - 区/县 ID',
  `town_id` int DEFAULT NULL COMMENT '培训地点 - 镇/街道 ID',
  `training_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '培训地点 - 详细地址',
  `training_date` date DEFAULT NULL COMMENT '培训日期',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '案例详细描述',
  `cover_image` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '封面图 URL',
  `view_count` int NOT NULL DEFAULT '0' COMMENT '案例详情页访问次数',
  `auto_extracted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否系统自动萃取：0=否, 1=是',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序值，值越大越靠前',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '审核状态：0=待审核, 1=通过, 2=驳回',
  `reject_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '驳回原因',
  `reviewer_id` int DEFAULT NULL COMMENT '审核人 ID',
  `reviewed_at` datetime DEFAULT NULL COMMENT '审核时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_trainer_cases_trainer_status_sort` (`trainer_id`,`status`,`sort_order`) USING BTREE,
  KEY `idx_trainer_cases_status_id` (`status`,`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20420 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家授课案例表';

-- 数据导出被取消选择。

-- 导出  表 v3test.user_trainer_highlight_files 结构
CREATE TABLE IF NOT EXISTS `user_trainer_highlight_files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `highlight_id` int NOT NULL COMMENT '关联 user_trainer_highlights.id',
  `trainer_id` int NOT NULL COMMENT '关联 user_trainers.id',
  `file_type` tinyint NOT NULL DEFAULT '1' COMMENT '文件类型：1=图片, 2=视频',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '标题',
  `file_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '文件 URL',
  `thumbnail_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '缩略图 URL',
  `width` int NOT NULL DEFAULT '0' COMMENT '图片宽度（px）',
  `height` int NOT NULL DEFAULT '0' COMMENT '图片高度（px）',
  `duration` int NOT NULL DEFAULT '0' COMMENT '视频时长（秒），图片为 0',
  `file_size` bigint NOT NULL DEFAULT '0' COMMENT '文件大小（字节）',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序值',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_highlight_files_highlight_sort` (`highlight_id`,`sort_order`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家精彩瞬间文件表';

-- 数据导出被取消选择。

-- 导出  表 v3test.user_trainer_highlights 结构
CREATE TABLE IF NOT EXISTS `user_trainer_highlights` (
  `id` int NOT NULL AUTO_INCREMENT,
  `trainer_id` int DEFAULT NULL,
  `institution_id` int DEFAULT NULL COMMENT '机构主体 ID（user_institutions.id）',
  `media_type` tinyint NOT NULL DEFAULT '1' COMMENT '媒体类型：1=图片, 2=视频',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '标题',
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '描述',
  `cover_image` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '封面图 URL',
  `media_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '图片/视频 URL',
  `thumbnail_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '缩略图 URL',
  `duration` int NOT NULL DEFAULT '0' COMMENT '视频时长（秒），图片为 0',
  `file_size` bigint NOT NULL DEFAULT '0' COMMENT '文件大小（字节）',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序值，值越大越靠前',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '审核状态：0=待审核, 1=通过, 2=驳回',
  `reject_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '驳回原因',
  `reviewer_id` int DEFAULT NULL COMMENT '审核人 ID',
  `reviewed_at` datetime DEFAULT NULL COMMENT '审核时间',
  `view_count` int NOT NULL DEFAULT '0' COMMENT '浏览/播放次数',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_trainer_highlights_trainer_status_sort` (`trainer_id`,`status`,`sort_order`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家精彩瞬间表';

-- 数据导出被取消选择。

-- 导出  表 v3test.user_trainers 结构
CREATE TABLE IF NOT EXISTS `user_trainers` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` int NOT NULL COMMENT '用户 ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '讲师姓名',
  `teaching_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '授课姓名',
  `avatar` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '头像 URL',
  `gender` tinyint DEFAULT '0' COMMENT '性别：0=未知，1=男，2=女',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '联系电话',
  `email` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '电子邮箱',
  `post_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '邮编',
  `province_id` int DEFAULT '0' COMMENT '省份 ID',
  `city_id` int DEFAULT '0' COMMENT '城市 ID',
  `district_id` int DEFAULT '0' COMMENT '区县 ID',
  `town_id` int DEFAULT '0' COMMENT '乡镇 ID',
  `address` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '详细地址',
  `id_card_no` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '身份证号',
  `id_card_front` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '身份证人像面 URL',
  `id_card_back` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '身份证国徽面 URL',
  `real_name_status` tinyint DEFAULT NULL COMMENT '实名认证状态：NULL未提交 1待审核 2已通过 3已驳回',
  `real_name_reject_reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '实名认证驳回原因',
  `real_name_submitted_at` datetime DEFAULT NULL COMMENT '实名认证最近一次提交时间',
  `real_name_audited_at` datetime DEFAULT NULL COMMENT '实名认证最近一次审核时间',
  `certification_files` json DEFAULT NULL COMMENT '专业认证附件 URL 列表（JSON 数组）',
  `professional_status` tinyint DEFAULT NULL COMMENT '专业认证状态：NULL未提交 1待审核 2已通过 3已驳回',
  `professional_reject_reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '专业认证驳回原因',
  `professional_submitted_at` datetime DEFAULT NULL COMMENT '专业认证最近一次提交时间',
  `professional_audited_at` datetime DEFAULT NULL COMMENT '专业认证最近一次审核时间',
  `title` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '头衔（如：高级讲师、资深顾问）',
  `bio` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '个人简介（支持富文本）',
  `one_line_intro` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '一句话介绍',
  `intro` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '个人简介（富文本）',
  `background` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '从业经历/背景',
  `partial_clients` mediumtext COLLATE utf8mb4_unicode_ci,
  `good_at` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '专长描述',
  `teaching_style` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '授课风格',
  `quote_min` decimal(10,2) DEFAULT NULL COMMENT '报价范围-最低',
  `quote_max` decimal(10,2) DEFAULT NULL COMMENT '报价范围-最高',
  `quote_unit` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '天' COMMENT '报价单位：天/次/小时',
  `quote_remark` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '报价备注',
  `taoke_price` decimal(10,2) DEFAULT NULL COMMENT '淘课网售价（元）',
  `taoke_commission` decimal(10,2) DEFAULT NULL COMMENT '淘课网合作课酬（元）',
  `agreement_signed_at` datetime DEFAULT NULL COMMENT '注册专家合作协议签署时间',
  `agreement_version` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '协议版本号，默认 v1',
  `resume_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '最近上传的简历文件 URL',
  `background_image` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '主页背景图 URL',
  `cert_level` tinyint NOT NULL DEFAULT '0' COMMENT '认证等级：0=未认证，1=基础，2=高级，3=专家',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态：0=草稿，1=待审核，2=审核通过，3=驳回，4=禁用',
  `reject_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '审核驳回原因',
  `is_signed` tinyint NOT NULL DEFAULT '0' COMMENT '是否签约讲师',
  `is_trusted` tinyint NOT NULL DEFAULT '0' COMMENT '是否信得过专家',
  `is_recommended` tinyint NOT NULL DEFAULT '0' COMMENT '是否推荐讲师',
  `has_copyright_course` tinyint NOT NULL DEFAULT '0' COMMENT '是否拥有版权课',
  `exposure_weight` int NOT NULL DEFAULT '0' COMMENT '曝光权重',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '自定义排序',
  `score` decimal(3,2) NOT NULL DEFAULT '0.00' COMMENT '综合评分',
  `view_count` int NOT NULL DEFAULT '0' COMMENT '累计曝光量',
  `consultation_count` int NOT NULL DEFAULT '0' COMMENT '累计咨询量',
  `comment_count` int NOT NULL DEFAULT '0' COMMENT '累计评论数',
  `draft_expired_at` datetime DEFAULT NULL COMMENT '草稿过期时间',
  `approved_at` datetime DEFAULT NULL COMMENT '审核通过时间',
  `specialties` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '擅长领域，JSON 数组',
  `expertise_tags` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '擅长标签，逗号分隔',
  `experience_years` int DEFAULT NULL COMMENT '从业年限',
  `teaching_years` int DEFAULT '0' COMMENT '培训年限',
  `qualification_level` tinyint NOT NULL DEFAULT '0' COMMENT '资质等级：0=普通，1=认证，2=高级认证',
  `service_city_ids` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '授课城市 ID 列表，JSON 数组',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `trainer_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '专家编号，如 TK-A1B2C3',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_user_id` (`user_id`) USING BTREE,
  UNIQUE KEY `idx_trainer_code` (`trainer_code`) USING BTREE,
  KEY `idx_qualification_level` (`qualification_level`) USING BTREE,
  KEY `idx_status` (`status`) USING BTREE,
  KEY `idx_cert_level` (`cert_level`) USING BTREE,
  KEY `idx_province_city` (`province_id`,`city_id`) USING BTREE,
  KEY `idx_exposure_weight` (`exposure_weight`) USING BTREE,
  KEY `idx_sort_order` (`sort_order`) USING BTREE,
  KEY `idx_score` (`score`) USING BTREE,
  KEY `idx_draft_expired` (`draft_expired_at`) USING BTREE,
  KEY `idx_real_name_status` (`real_name_status`) USING BTREE,
  KEY `idx_professional_status` (`professional_status`) USING BTREE,
  KEY `idx_status_sort_score_id` (`status`,`sort_order`,`score`,`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1142218 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='专家扩展信息表';

-- 数据导出被取消选择。

-- 导出  表 v3test.video_chapter_progress 结构
CREATE TABLE IF NOT EXISTS `video_chapter_progress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `video_id` int NOT NULL COMMENT '录播课ID',
  `chapter_id` int NOT NULL COMMENT '章节ID',
  `user_id` int NOT NULL COMMENT '学员用户ID',
  `watch_duration` int NOT NULL DEFAULT '0' COMMENT '已观看时长（秒）',
  `chapter_duration` int NOT NULL DEFAULT '0' COMMENT '章节总时长（秒）',
  `progress` int NOT NULL DEFAULT '0' COMMENT '章节进度（0~100）',
  `started_at` datetime DEFAULT NULL COMMENT '首次观看时间',
  `last_watched_at` datetime DEFAULT NULL COMMENT '最近观看时间',
  `completed` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否看完：0=否 1=是',
  `completed_at` datetime DEFAULT NULL COMMENT '看完时间',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_chapter_user` (`chapter_id`,`user_id`) USING BTREE,
  KEY `idx_video_user` (`video_id`,`user_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='录播课章节学习进度表';

-- 数据导出被取消选择。

-- 导出  表 v3test.video_chapters 结构
CREATE TABLE IF NOT EXISTS `video_chapters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `video_id` int NOT NULL COMMENT '所属录播课ID',
  `series_id` int NOT NULL DEFAULT '0' COMMENT '所属系列ID，0=不属于任何系列',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '章节标题',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '章节描述',
  `video_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '视频地址',
  `cover_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '章节封面URL',
  `duration` int NOT NULL DEFAULT '0' COMMENT '时长（秒）',
  `file_size` bigint NOT NULL DEFAULT '0' COMMENT '文件大小（字节）',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序',
  `is_preview` tinyint NOT NULL DEFAULT '0' COMMENT '是否可免费预览：0=否 1=是',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_video_id` (`video_id`) USING BTREE,
  KEY `idx_series_id` (`series_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=46737 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='录播课章节表';

-- 数据导出被取消选择。

-- 导出  表 v3test.video_comments 结构
CREATE TABLE IF NOT EXISTS `video_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `video_id` int NOT NULL COMMENT '录播课 ID',
  `user_id` int NOT NULL DEFAULT '0' COMMENT '评论用户 ID，0=匿名/游客',
  `user_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '展示昵称',
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '评论正文',
  `rating` tinyint NOT NULL COMMENT '星级 1-5',
  `audit_status` tinyint NOT NULL DEFAULT '1' COMMENT '0待审核1已通过2已驳回',
  `reject_reason` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '驳回原因',
  `visible` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否展示：1=是 0=否',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_video_comments_video` (`video_id`,`visible`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=830 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='录播课评论';

-- 数据导出被取消选择。

-- 导出  表 v3test.video_enrollments 结构
CREATE TABLE IF NOT EXISTS `video_enrollments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `video_id` int NOT NULL COMMENT '录播课ID',
  `user_id` int NOT NULL COMMENT '报名用户ID',
  `order_id` int NOT NULL DEFAULT '0' COMMENT '关联订单ID（后续支付模块）',
  `price_paid` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '实付金额',
  `enrolled_at` datetime DEFAULT NULL COMMENT '报名时间',
  `expired_at` datetime DEFAULT NULL COMMENT '过期时间（NULL=永久有效）',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：1=有效 0=已取消/退款',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_video_user` (`video_id`,`user_id`) USING BTREE,
  KEY `idx_user_id` (`user_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=62643 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='录播课报名表';

-- 数据导出被取消选择。

-- 导出  表 v3test.video_package_groups 结构
CREATE TABLE IF NOT EXISTS `video_package_groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `package_id` int NOT NULL COMMENT '视频包 ID',
  `topic_id` int NOT NULL DEFAULT '0' COMMENT '专题 ID',
  `parent_id` int NOT NULL DEFAULT '0' COMMENT '父级专题 ID',
  `name` varchar(150) NOT NULL DEFAULT '' COMMENT '系列名称',
  `price` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '系列单价（元/人/年）',
  `company_price` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '企业采购封顶价（元）',
  `max_purchase_qty` int NOT NULL DEFAULT '20' COMMENT '单次最多购买人数',
  `video_count` int NOT NULL DEFAULT '0' COMMENT '系列内视频数',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pkg_group` (`package_id`,`topic_id`,`parent_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1845 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='录播课视频包分组（全系列购买）';

-- 数据导出被取消选择。

-- 导出  表 v3test.video_package_labels 结构
CREATE TABLE IF NOT EXISTS `video_package_labels` (
  `id` int NOT NULL COMMENT '对应老站 tk_video_topic_item.id',
  `name` varchar(150) NOT NULL DEFAULT '' COMMENT '包/专题名称',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='录播课视频包名称';

-- 数据导出被取消选择。

-- 导出  表 v3test.video_package_relations 结构
CREATE TABLE IF NOT EXISTS `video_package_relations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `video_id` int NOT NULL COMMENT '录播课 ID',
  `package_id` int NOT NULL COMMENT '视频包 ID（老站 packageId）',
  `topic_id` int NOT NULL DEFAULT '0' COMMENT '专题 ID（老站 topicId）',
  `parent_id` int NOT NULL DEFAULT '0' COMMENT '父级专题 ID（老站 parentId）',
  `is_primary` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否该视频的主包关系（老站 is_first）',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '包内排序（老站 serial）',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_video_package_topic` (`video_id`,`package_id`,`topic_id`),
  KEY `idx_package_group` (`package_id`,`topic_id`,`parent_id`,`sort_order`),
  KEY `idx_video_id` (`video_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13823 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='录播课所属视频包关系';

-- 数据导出被取消选择。

-- 导出  表 v3test.video_series 结构
CREATE TABLE IF NOT EXISTS `video_series` (
  `id` int NOT NULL AUTO_INCREMENT,
  `video_id` int NOT NULL COMMENT '所属录播课ID',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '系列标题',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '系列描述',
  `cover_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '系列封面URL',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_video_id` (`video_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=507280 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='录播课系列表';

-- 数据导出被取消选择。

-- 导出  表 v3test.video_students 结构
CREATE TABLE IF NOT EXISTS `video_students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `video_id` int NOT NULL COMMENT '录播课ID',
  `user_id` int NOT NULL COMMENT '学员用户ID',
  `enrollment_id` int NOT NULL COMMENT '关联报名记录ID',
  `last_chapter_id` int NOT NULL DEFAULT '0' COMMENT '上次观看的章节ID',
  `progress` int NOT NULL DEFAULT '0' COMMENT '整体进度（0~100）',
  `completed_chapters` int NOT NULL DEFAULT '0' COMMENT '已完成章节数',
  `total_watch_time` int NOT NULL DEFAULT '0' COMMENT '累计观看时长（秒）',
  `started_at` datetime DEFAULT NULL COMMENT '首次学习时间',
  `last_watched_at` datetime DEFAULT NULL COMMENT '最近观看时间',
  `is_completed` tinyint NOT NULL DEFAULT '0' COMMENT '是否完成全部课程：0=否 1=是',
  `completed_at` datetime DEFAULT NULL COMMENT '完成时间',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_video_user` (`video_id`,`user_id`) USING BTREE,
  KEY `idx_user_id` (`user_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=27084 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='录播课学员表';

-- 数据导出被取消选择。

-- 导出  表 v3test.video_supplier_categories 结构
CREATE TABLE IF NOT EXISTS `video_supplier_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `supplier_id` int NOT NULL COMMENT '供应商 ID',
  `parent_id` int NOT NULL DEFAULT '0' COMMENT '父分类 ID，0=顶级',
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '分类名称',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序',
  `total_price` decimal(10,2) DEFAULT NULL COMMENT '打包总价',
  `discount_rate` decimal(5,2) NOT NULL DEFAULT '100.00' COMMENT '折扣率（%）',
  `enabled` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否启用',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_video_supplier_categories_supplier` (`supplier_id`,`parent_id`,`sort_order`)
) ENGINE=InnoDB AUTO_INCREMENT=1078 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='录播课供应商分类';

-- 数据导出被取消选择。

-- 导出  表 v3test.video_supplier_category_videos 结构
CREATE TABLE IF NOT EXISTS `video_supplier_category_videos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `supplier_id` int NOT NULL COMMENT '供应商 ID',
  `category_id` int NOT NULL COMMENT '分类 ID',
  `video_id` int NOT NULL COMMENT '录播课 ID',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_supplier_category_video` (`category_id`,`video_id`),
  KEY `idx_supplier_category_videos_supplier` (`supplier_id`,`category_id`,`sort_order`)
) ENGINE=InnoDB AUTO_INCREMENT=6719 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='供应商分类与录播课关联';

-- 数据导出被取消选择。

-- 导出  表 v3test.video_suppliers 结构
CREATE TABLE IF NOT EXISTS `video_suppliers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '关联用户 ID',
  `company_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '公司名称',
  `member_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'TRAINING_ORG' COMMENT '会员类型',
  `enabled` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否启用',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_video_suppliers_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='录播课供应商';

-- 数据导出被取消选择。

-- 导出  表 v3test.videos 结构
CREATE TABLE IF NOT EXISTS `videos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `publisher_id` int NOT NULL COMMENT '发布者用户ID',
  `publisher_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '发布者类型：TRAINER/INSTITUTION',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '录播课标题',
  `cover_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '封面图URL',
  `intro` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '课程介绍（富文本HTML）',
  `video_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SERIES' COMMENT '视频类型：SERIES(多节/系列)/SINGLE(单个视频)/EXTERNAL(外部链接)',
  `video_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '视频地址（SINGLE类型时使用）',
  `external_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '外部链接（EXTERNAL类型时使用）',
  `category_id` int DEFAULT '0' COMMENT '一级分类ID（关联sys_categories, type=VIDEO_COURSE）',
  `sub_category_id` int DEFAULT '0' COMMENT '二级分类ID',
  `teacher_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '授课老师（文本）',
  `trainer_id` int DEFAULT '0' COMMENT '关联讲师ID（可选）',
  `price` decimal(10,2) DEFAULT '0.00' COMMENT '课程价格（元/人/年）',
  `company_price` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '企业采购封顶价（元）',
  `max_purchase_qty` int NOT NULL DEFAULT '20' COMMENT '单次最多购买人数',
  `original_price` decimal(10,2) DEFAULT '0.00' COMMENT '原价（划线价）',
  `is_free` tinyint NOT NULL DEFAULT '0' COMMENT '是否免费：0=否 1=是',
  `keywords` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '关键词，逗号分隔',
  `duration` int NOT NULL DEFAULT '0' COMMENT '总时长（秒）',
  `total_episodes` int NOT NULL DEFAULT '0' COMMENT '总集数（冗余计数）',
  `view_count` int NOT NULL DEFAULT '0' COMMENT '浏览次数',
  `enrollment_count` int NOT NULL DEFAULT '0' COMMENT '报名人数',
  `student_count` int NOT NULL DEFAULT '0' COMMENT '学习人数',
  `score` decimal(3,2) NOT NULL DEFAULT '0.00' COMMENT '综合评分（0.00-5.00）',
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态：0=草稿 1=待审核 2=已上架 3=驳回 4=已下架',
  `reject_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '驳回原因',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT '排序权重（越大越靠前）',
  `is_featured` tinyint NOT NULL DEFAULT '0' COMMENT '是否推荐：0=否 1=是',
  `sticky_priority` tinyint NOT NULL DEFAULT '0' COMMENT '置顶优先级: 0=不限 1=列表推荐 2=列表置顶',
  `published_at` datetime DEFAULT NULL COMMENT '上线时间',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_publisher` (`publisher_id`,`publisher_type`) USING BTREE,
  KEY `idx_category` (`category_id`,`sub_category_id`) USING BTREE,
  KEY `idx_status` (`status`) USING BTREE,
  KEY `idx_is_featured` (`is_featured`,`status`) USING BTREE,
  KEY `idx_videos_sticky_priority` (`sticky_priority`)
) ENGINE=InnoDB AUTO_INCREMENT=24072 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='录播课主表';

-- 数据导出被取消选择。

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
