-- -- ============================================================
-- -- V20: 扩展机构表字段 + 种子数据
-- --
-- -- 1. 为 user_institutions 增加公开列表/详情所需的字段
-- -- 2. 插入测试机构数据（7+ 条）
-- -- 3. 将 13265717020 用户关联到一家机构并授予 INSTITUTION 角色
-- -- ============================================================

-- -- ------------------------------------------------------------
-- -- Part 1: 新增字段
-- -- -----------------------------------a-------------------------

-- ALTER TABLE `user_institutions`
--     ADD COLUMN `specialties`         VARCHAR(512)  NULL     DEFAULT NULL    COMMENT '擅长领域，逗号分隔' AFTER `address`,
--     ADD COLUMN `industries`          VARCHAR(512)  NULL     DEFAULT NULL    COMMENT '擅长行业，逗号分隔' AFTER `specialties`,
--     ADD COLUMN `score`               DECIMAL(3,2)  NOT NULL DEFAULT 0.00   COMMENT '综合评分（0.00-5.00）' AFTER `industries`,
--     ADD COLUMN `view_count`          INT           NOT NULL DEFAULT 0      COMMENT '浏览量/人气' AFTER `score`,
--     ADD COLUMN `comment_count`       INT           NOT NULL DEFAULT 0      COMMENT '评价数量' AFTER `view_count`,
--     ADD COLUMN `open_course_count`   INT           NOT NULL DEFAULT 0      COMMENT '公开课数量' AFTER `comment_count`,
--     ADD COLUMN `inner_course_count`  INT           NOT NULL DEFAULT 0      COMMENT '内训课数量' AFTER `open_course_count`,
--     ADD COLUMN `logo_url`            VARCHAR(512)  NULL     DEFAULT NULL    COMMENT '机构 Logo URL' AFTER `inner_course_count`,
--     ADD COLUMN `banner_url`          VARCHAR(512)  NULL     DEFAULT NULL    COMMENT '机构横幅图 URL' AFTER `logo_url`,
--     ADD COLUMN `is_certified`        TINYINT       NOT NULL DEFAULT 0      COMMENT '是否已认证：0=否，1=是' AFTER `banner_url`,
--     ADD COLUMN `is_recommended`      TINYINT       NOT NULL DEFAULT 0      COMMENT '是否金牌推荐：0=否，1=是' AFTER `is_certified`,
--     ADD COLUMN `sort_order`          INT           NOT NULL DEFAULT 0      COMMENT '排序权重，值越大越靠前' AFTER `is_recommended`,
--     ADD COLUMN `status`              TINYINT       NOT NULL DEFAULT 0      COMMENT '状态：0=待审核，1=已发布，2=已下线' AFTER `sort_order`,
--     ADD COLUMN `client_cases`        TEXT          NULL                    COMMENT '服务过的客户描述' AFTER `status`;

-- ALTER TABLE `user_institutions`
--     ADD INDEX `idx_status` (`status`),
--     ADD INDEX `idx_sort_order` (`sort_order`);

-- -- ------------------------------------------------------------
-- -- Part 2: 创建机构用户账号（先插 sys_users）
-- -- ------------------------------------------------------------

-- INSERT INTO `sys_users` (`phone`, `nickname`, `real_name`, `status`, `reg_origin`) VALUES
-- ('13800000101', '枫晶企管', '枫晶企管', 1, 1),
-- ('13800000102', '迪铭咨询', '迪铭咨询', 1, 1),
-- ('13800000103', '见素咨询', '见素咨询', 1, 1),
-- ('13800000104', '金太阳教育', '金太阳教育', 1, 1),
-- ('13800000105', '东方智业', '东方智业', 1, 1),
-- ('13800000106', '采招咨询', '采招咨询', 1, 1),
-- ('13800000107', '劳达咨询', '劳达咨询', 1, 1);

-- -- ------------------------------------------------------------
-- -- Part 3: 插入机构扩展信息
-- -- ------------------------------------------------------------

-- INSERT INTO `user_institutions`
--     (`user_id`, `org_name`, `org_type`, `license_no`, `bio`, `contact_name`, `contact_phone`, `show_contact`,
--      `province_id`, `city_id`, `specialties`, `industries`, `score`, `view_count`, `comment_count`,
--      `open_course_count`, `inner_course_count`, `is_certified`, `is_recommended`, `sort_order`, `status`, `client_cases`)
-- VALUES
-- -- 1. 上海枫晶企业管理咨询有限公司
-- ((SELECT `id` FROM `sys_users` WHERE `phone` = '13800000101'),
--  '上海枫晶企业管理咨询有限公司', 0, '91310000MA1FL8XX2K',
--  '上海枫晶企业管理咨询有限公司专注于客户服务领域的企业培训，致力于为通信、电子、制造业等行业提供高品质的培训解决方案。',
--  '王经理', '021-55551234', 1,
--  310000, 310100,
--  '客户服务', '通信,电子,自动化,IT/软件,制造业',
--  4.2, 1156, 3, 0, 0, 1, 0, 10, 1,
--  '中国移动、华为技术、上海电气、中芯国际等。'),

-- -- 2. 迪铭（北京）咨询有限公司
-- ((SELECT `id` FROM `sys_users` WHERE `phone` = '13800000102'),
--  '迪铭（北京）咨询有限公司', 0, '91110000MA001XX3XK',
--  '迪铭(北京)咨询有限公司(DMclick)，简称迪铭咨询，成立于2006年。是一家专注于客户价值管理与服务营销解决方案的专业顾问机构。',
--  '李总监', '010-88881234', 1,
--  110000, 110100,
--  '客户服务,销售管理', '金融,保险,汽车,机械,制造,批发,零售',
--  4.5, 1352, 8, 1, 0, 1, 1, 20, 1,
--  '中国银行、平安保险、一汽大众、宝马中国、沃尔玛等。'),

-- -- 3. 南通见素（上海）管理咨询有限公司
-- ((SELECT `id` FROM `sys_users` WHERE `phone` = '13800000103'),
--  '南通见素（上海）管理咨询有限公司', 0, '91310000MA1GP2XX5N',
--  '南通见素(上海)管理咨询有限公司成立于2022年12月02日，注册地位于中国（上海）自由贸易试验区临港新片区，法定代表人为胡新明。经营范围包括企业管理咨询、商务咨询、企业形象策划、文化艺术交流策划等。',
--  '胡经理', '021-66661234', 1,
--  310000, 310100,
--  '综合管理,心理学,健康养生', '金融,餐饮,农林牧渔,党政公共',
--  4.0, 1540, 5, 1, 0, 1, 0, 15, 1,
--  '上海浦发银行、海底捞集团、中国农业发展集团等。'),

-- -- 4. 厦门金太阳教育科技有限公司
-- ((SELECT `id` FROM `sys_users` WHERE `phone` = '13800000104'),
--  '厦门金太阳教育科技有限公司', 0, '91350200MA001XX4XJ',
--  '厦门金太阳教育科技有限公司是一家专注于职业素养培训的教育科技企业，为各类企业提供定制化的内训解决方案。',
--  '陈经理', '0592-55551234', 1,
--  330000, 330300,
--  '职业素养', '综合行业',
--  3.8, 800, 2, 0, 7, 1, 0, 5, 1,
--  '温州正泰集团、报喜鸟集团等。'),

-- -- 5. 北京东方智业管理咨询有限公司
-- ((SELECT `id` FROM `sys_users` WHERE `phone` = '13800000105'),
--  '北京东方智业管理咨询有限公司', 0, '91110000MA005XX6XK',
--  '东方智业秉承兼容并蓄与博采众长，立足行业，贴近企业，立足前沿，面向IT、人资、运营、生产管理。汇聚名师，服务企业，为中国人提供最好的企业培训服务，努力成为中国最具影响力的培训服务商。',
--  '张总', '010-66661234', 1,
--  110000, 110100,
--  '综合管理,经营战略', 'IT/软件/通信,汽车,机械,制造',
--  4.6, 1069, 12, 39, 0, 1, 1, 30, 1,
--  '联想集团、百度、华为、中兴通讯、比亚迪、吉利汽车、三一重工等。'),

-- -- 6. 河北采招企业管理咨询有限公司
-- ((SELECT `id` FROM `sys_users` WHERE `phone` = '13800000106'),
--  '河北采招企业管理咨询有限公司', 0, '91130000MA07XX8XK',
--  '河北采招企业管理咨询有限公司专注于采购管理领域，为各行业企业提供专业的采购培训与咨询服务。',
--  '刘经理', '0335-55551234', 1,
--  130000, 130300,
--  '采购管理', '综合行业',
--  4.1, 995, 4, 10, 0, 1, 0, 8, 1,
--  '秦皇岛港务集团、中信戴卡等。'),

-- -- 7. 上海劳达企业管理咨询有限公司
-- ((SELECT `id` FROM `sys_users` WHERE `phone` = '13800000107'),
--  '上海劳达企业管理咨询有限公司', 0, '91310000MA1FL9XX3K',
--  '2005年，国内资深劳动法与员工关系专家白林汇先生创办劳达(Laboroot)，专为企业提供劳动法及员工关系咨询、培训、法律、在线业务等解决服务。',
--  '白总监', '021-77771234', 1,
--  310000, 310100,
--  '人力资源,行政管理', '汽车,机械,制造,医疗,制药,批发,零售',
--  4.3, 1486, 6, 0, 0, 1, 0, 18, 1,
--  '上汽集团、上海医药、国药控股、永辉超市、华润万家等。');

-- -- ------------------------------------------------------------
-- -- Part 4: 为各机构用户授予 INSTITUTION 业务角色
-- -- ------------------------------------------------------------

-- INSERT INTO `sys_user_roles` (`user_id`, `role`, `status`, `approved_at`) VALUES
-- ((SELECT `id` FROM `sys_users` WHERE `phone` = '13800000101'), 'INSTITUTION', 1, NOW()),
-- ((SELECT `id` FROM `sys_users` WHERE `phone` = '13800000102'), 'INSTITUTION', 1, NOW()),
-- ((SELECT `id` FROM `sys_users` WHERE `phone` = '13800000103'), 'INSTITUTION', 1, NOW()),
-- ((SELECT `id` FROM `sys_users` WHERE `phone` = '13800000104'), 'INSTITUTION', 1, NOW()),
-- ((SELECT `id` FROM `sys_users` WHERE `phone` = '13800000105'), 'INSTITUTION', 1, NOW()),
-- ((SELECT `id` FROM `sys_users` WHERE `phone` = '13800000106'), 'INSTITUTION', 1, NOW()),
-- ((SELECT `id` FROM `sys_users` WHERE `phone` = '13800000107'), 'INSTITUTION', 1, NOW());

-- -- ------------------------------------------------------------
-- -- Part 5: 将 13265717020 用户关联到一家机构（上海复锐企业管理咨询有限公司）
-- -- ------------------------------------------------------------
-- INSERT INTO `user_institutions`
--     (`user_id`, `org_name`, `org_type`, `license_no`, `bio`, `contact_name`, `contact_phone`, `show_contact`,
--      `province_id`, `city_id`, `specialties`, `industries`, `score`, `view_count`, `comment_count`,
--      `open_course_count`, `inner_course_count`, `logo_url`, `banner_url`, `is_certified`, `is_recommended`, `sort_order`, `status`, `client_cases`)
-- VALUES
-- ((SELECT `id` FROM `sys_users` WHERE `phone` = '13265717020'),
--  '上海复锐企业管理咨询有限公司', 0, '91310000MA1FL7XX1K',
--  '上海复锐企业管理咨询有限公司是一家综合性企业管理培训机构，拥有丰富的课程体系和强大的师资力量，服务覆盖领导力、客户服务、培训发展等多个领域。',
--  '老方', '13265717020', 1,
--  310000, 310100,
--  '领导力,培训发展,客户服务', '通信,电子,家电,金融,保险,能源,化工',
--  4.4, 3917, 38, 39, 5, NULL, NULL, 1, 1, 100, 1,
--  '宝钢集团、中国网通、沪东重机、宝山钢铁股份有限公司、龙头股份、施耐德电气、上海中科合臣股份有限公司、中国移动平顶山公司、上海外高桥保税区三联发展有限公司、中华企业股份有限公司、兖矿集团、上海烟草、伊顿忠丸、宝钢商贸、安徽中鼎工业公司、沪东中华、长春一汽集团、四万林、绿城、复星集团、江苏新城、中国人寿、中国银联、中国工商银行、上海银行、浦发银行、中国民生银行、中国农业银行、中国建设银行、平安保险、日立电梯、TCL、艾欧史密斯、美业达集团、上海生物芯片、中科院、六和集团、蓝海股份、永达集团等。');

-- -- 为 13265717020 用户授予 INSTITUTION 角色
-- INSERT INTO `sys_user_roles` (`user_id`, `role`, `status`, `approved_at`) VALUES
-- ((SELECT `id` FROM `sys_users` WHERE `phone` = '13265717020'), 'INSTITUTION', 1, NOW());
