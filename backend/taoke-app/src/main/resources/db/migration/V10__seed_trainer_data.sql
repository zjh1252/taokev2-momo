-- ==============================================================
-- V10: 种子数据 — 从 taoke.com 抓取 15 位人力资源类专家
-- 来源页: /trainer/511/.../def/.../1.htm（第 1 页）
-- ==============================================================

-- ---------------------------------------------------------------
-- 1. sys_users — 创建虚拟用户（reg_origin=2 表示导入数据）
-- ---------------------------------------------------------------
INSERT INTO `sys_users` (`phone`, `nickname`, `real_name`, `avatar_url`, `gender`, `status`, `reg_origin`) VALUES
('13266660001', '曹爱宏',  '曹爱宏',  '/statics/images/trainers/20066.jpg',    0, 1, 2),
('13266660002', '郭敬峰',  '郭敬峰',  '/statics/images/trainers/690367.jpg',   0, 1, 2),
('13266660003', '冯智明',  '冯智明',  '/statics/images/trainers/956156.png',   0, 1, 2),
('13266660004', '刘建',    '刘建',    '/statics/images/trainers/770.jpg',      0, 1, 2),
('13266660005', '周洪超',  '周洪超',  '/statics/images/trainers/797163.png',   0, 1, 2),
('13266660006', '刘建军',  '刘建军',  '/statics/images/trainers/1122078.jpg',  0, 1, 2),
('13266660007', '张怀',    '张怀',    '/statics/images/trainers/498.png',      0, 1, 2),
('13266660008', '安梅',    '安梅',    '/statics/images/trainers/583530.jpg',   0, 1, 2),
('13266660009', '宋致旸',  '宋致旸',  '/statics/images/trainers/1121587.jpg',  0, 1, 2),
('13266660010', '聂振亚',  '聂振亚',  '/statics/images/trainers/1919.jpg',     0, 1, 2),
('13266660011', '邱加州',  '邱加州',  '/statics/images/trainers/593239.png',   0, 1, 2),
('13266660012', '张海林',  '张海林',  '/statics/images/trainers/1076836.jpg',  0, 1, 2),
('13266660013', '刘原彰',  '刘原彰',  '/statics/images/trainers/660753.jpg',   0, 1, 2),
('13266660014', '林嘉',    '林嘉',    '/statics/images/trainers/336507.jpg',   0, 1, 2),
('13266660015', '陈仕灿',  '陈仕灿',  '/statics/images/trainers/658504.jpg',   0, 1, 2);

-- 记录起始 user_id（当前 max(id)=2，新行从 3 开始）
SET @u1  = (SELECT id FROM sys_users WHERE phone = '13266660001');
SET @u2  = (SELECT id FROM sys_users WHERE phone = '13266660002');
SET @u3  = (SELECT id FROM sys_users WHERE phone = '13266660003');
SET @u4  = (SELECT id FROM sys_users WHERE phone = '13266660004');
SET @u5  = (SELECT id FROM sys_users WHERE phone = '13266660005');
SET @u6  = (SELECT id FROM sys_users WHERE phone = '13266660006');
SET @u7  = (SELECT id FROM sys_users WHERE phone = '13266660007');
SET @u8  = (SELECT id FROM sys_users WHERE phone = '13266660008');
SET @u9  = (SELECT id FROM sys_users WHERE phone = '13266660009');
SET @u10 = (SELECT id FROM sys_users WHERE phone = '13266660010');
SET @u11 = (SELECT id FROM sys_users WHERE phone = '13266660011');
SET @u12 = (SELECT id FROM sys_users WHERE phone = '13266660012');
SET @u13 = (SELECT id FROM sys_users WHERE phone = '13266660013');
SET @u14 = (SELECT id FROM sys_users WHERE phone = '13266660014');
SET @u15 = (SELECT id FROM sys_users WHERE phone = '13266660015');

-- ---------------------------------------------------------------
-- 2. sys_user_roles — 分配 TRAINER 角色（status=1 生效）
-- ---------------------------------------------------------------
INSERT INTO `sys_user_roles` (`user_id`, `role`, `status`, `approved_at`) VALUES
(@u1,  'TRAINER', 1, NOW()),
(@u2,  'TRAINER', 1, NOW()),
(@u3,  'TRAINER', 1, NOW()),
(@u4,  'TRAINER', 1, NOW()),
(@u5,  'TRAINER', 1, NOW()),
(@u6,  'TRAINER', 1, NOW()),
(@u7,  'TRAINER', 1, NOW()),
(@u8,  'TRAINER', 1, NOW()),
(@u9,  'TRAINER', 1, NOW()),
(@u10, 'TRAINER', 1, NOW()),
(@u11, 'TRAINER', 1, NOW()),
(@u12, 'TRAINER', 1, NOW()),
(@u13, 'TRAINER', 1, NOW()),
(@u14, 'TRAINER', 1, NOW()),
(@u15, 'TRAINER', 1, NOW());

-- ---------------------------------------------------------------
-- 3. user_trainers — 专家主表
--    province_id / city_id 来源：common_regions 查询结果
--    直辖市（北京/上海/天津/重庆）city_id 取 level=2 "市辖区" 条目
--    status: 2=审核通过
-- ---------------------------------------------------------------
--  城市 → (province_id, city_id)
--  北京市  → (1,  32)    上海市  → (9,  104)
--  广州市  → (19, 348)   深圳市  → (19, 350)
--  武汉市  → (17, 199)   青岛市  → (15, 166)
--  厦门市  → (13, 146)   无锡市  → (10, 106)
--  杭州市  → (11, 118)

INSERT INTO `user_trainers`
    (`user_id`, `name`, `avatar`, `title`, `province_id`, `city_id`, `status`, `expertise_tags`, `approved_at`)
VALUES
-- 1. 曹爱宏 — 北京
(@u1,  '曹爱宏',  '/statics/images/trainers/20066.jpg',   '以结果为导向的经理人提升培训师',                 1,  32,  2, '内训师,TTT,课程开发,经理人职商,国企干部培养', NOW()),
-- 2. 郭敬峰 — 上海
(@u2,  '郭敬峰',  '/statics/images/trainers/690367.jpg',  '压力情绪疏导专家',                               9,  104, 2, '压力情绪管理,职业EQ与团队管理,顾问式销售,高效沟通,EAP心理学培训', NOW()),
-- 3. 冯智明 — 上海
(@u3,  '冯智明',  '/statics/images/trainers/956156.png',  '人才管理专家',                                   9,  104, 2, '人才管理,人力资源,领导力', NOW()),
-- 4. 刘建 — 广州
(@u4,  '刘建',    '/statics/images/trainers/770.jpg',     '资深实战型人力资源培训专家',                     19, 348, 2, '通用管理,人力资源,职业素养,讲师培训', NOW()),
-- 5. 周洪超 — 武汉
(@u5,  '周洪超',  '/statics/images/trainers/797163.png',  '企业战略运营体系管理师',                         17, 199, 2, '人力资源,领导力,战略运营', NOW()),
-- 6. 刘建军 — 上海
(@u6,  '刘建军',  '/statics/images/trainers/1122078.jpg', '领导力和党史党建专家',                           9,  104, 2, '人力资源,领导力,党史党建', NOW()),
-- 7. 张怀 — 广州
(@u7,  '张怀',    '/statics/images/trainers/498.png',     '著名人力资源管理与领导力实战专家',               19, 348, 2, '战略人力资本,股权激励,阿米巴', NOW()),
-- 8. 安梅 — 青岛
(@u8,  '安梅',    '/statics/images/trainers/583530.jpg',  '15年以上企业中高层管理/8年以上的职业教育经验',   15, 166, 2, '经营战略,人力资源', NOW()),
-- 9. 宋致旸 — 广州
(@u9,  '宋致旸',  '/statics/images/trainers/1121587.jpg', '企业人才培养导师',                               19, 348, 2, '人力资源,职业素养', NOW()),
-- 10. 聂振亚 — 深圳
(@u10, '聂振亚',  '/statics/images/trainers/1919.jpg',    '党建党务实战专家, 企业管理/人力资源管理专家',    19, 350, 2, '人力资源,领导力,党建党务', NOW()),
-- 11. 邱加州 — 厦门
(@u11, '邱加州',  '/statics/images/trainers/593239.png',  '顾问/特聘资深讲师国家注册审核员',               13, 146, 2, '人力资源,质量管理', NOW()),
-- 12. 张海林 — 无锡
(@u12, '张海林',  '/statics/images/trainers/1076836.jpg', '实战派管理咨询专家、高级培训讲师、领导力教练',   10, 106, 2, '经营战略,人力资源,领导力', NOW()),
-- 13. 刘原彰 — 上海
(@u13, '刘原彰',  '/statics/images/trainers/660753.jpg',  'HR与领导力发展',                                 9,  104, 2, '人力资源,领导力', NOW()),
-- 14. 林嘉 — 杭州
(@u14, '林嘉',    '/statics/images/trainers/336507.jpg',  '职场效能提升专家',                               11, 118, 2, '人力资源,职业素养', NOW()),
-- 15. 陈仕灿 — 武汉
(@u15, '陈仕灿',  '/statics/images/trainers/658504.jpg',  '人才管理者陪伴与赋能',                           17, 199, 2, '人力资源,领导力', NOW());

-- 记录 trainer_id 供关联表使用
SET @t1  = (SELECT id FROM user_trainers WHERE user_id = @u1);
SET @t2  = (SELECT id FROM user_trainers WHERE user_id = @u2);
SET @t3  = (SELECT id FROM user_trainers WHERE user_id = @u3);
SET @t4  = (SELECT id FROM user_trainers WHERE user_id = @u4);
SET @t5  = (SELECT id FROM user_trainers WHERE user_id = @u5);
SET @t6  = (SELECT id FROM user_trainers WHERE user_id = @u6);
SET @t7  = (SELECT id FROM user_trainers WHERE user_id = @u7);
SET @t8  = (SELECT id FROM user_trainers WHERE user_id = @u8);
SET @t9  = (SELECT id FROM user_trainers WHERE user_id = @u9);
SET @t10 = (SELECT id FROM user_trainers WHERE user_id = @u10);
SET @t11 = (SELECT id FROM user_trainers WHERE user_id = @u11);
SET @t12 = (SELECT id FROM user_trainers WHERE user_id = @u12);
SET @t13 = (SELECT id FROM user_trainers WHERE user_id = @u13);
SET @t14 = (SELECT id FROM user_trainers WHERE user_id = @u14);
SET @t15 = (SELECT id FROM user_trainers WHERE user_id = @u15);

-- ---------------------------------------------------------------
-- 4. trainer_expertise_categories — 擅长领域关联
--    category_id 来源：sys_categories WHERE type='TRAINER_EXPERTISE'
--    人力资源=63  培训发展=70  领导力=88  经营战略=1
--    职业素养=95  质量管理=76  国学/心理学=109
-- ---------------------------------------------------------------
INSERT INTO `trainer_expertise_categories` (`trainer_id`, `category_id`, `sort_order`) VALUES
-- 曹爱宏: 人力资源, 培训发展
(@t1,  63, 1), (@t1,  70, 2),
-- 郭敬峰: 人力资源, 领导力, 国学/心理学
(@t2,  63, 1), (@t2,  88, 2), (@t2, 109, 3),
-- 冯智明: 人力资源, 领导力
(@t3,  63, 1), (@t3,  88, 2),
-- 刘建: 人力资源
(@t4,  63, 1),
-- 周洪超: 人力资源, 领导力
(@t5,  63, 1), (@t5,  88, 2),
-- 刘建军: 人力资源, 领导力
(@t6,  63, 1), (@t6,  88, 2),
-- 张怀: 人力资源
(@t7,  63, 1),
-- 安梅: 经营战略, 人力资源
(@t8,   1, 1), (@t8,  63, 2),
-- 宋致旸: 人力资源, 职业素养
(@t9,  63, 1), (@t9,  95, 2),
-- 聂振亚: 人力资源, 领导力
(@t10, 63, 1), (@t10, 88, 2),
-- 邱加州: 人力资源, 质量管理
(@t11, 63, 1), (@t11, 76, 2),
-- 张海林: 经营战略, 人力资源
(@t12,  1, 1), (@t12, 63, 2),
-- 刘原彰: 人力资源, 领导力
(@t13, 63, 1), (@t13, 88, 2),
-- 林嘉: 人力资源, 职业素养
(@t14, 63, 1), (@t14, 95, 2),
-- 陈仕灿: 人力资源, 领导力
(@t15, 63, 1), (@t15, 88, 2);
