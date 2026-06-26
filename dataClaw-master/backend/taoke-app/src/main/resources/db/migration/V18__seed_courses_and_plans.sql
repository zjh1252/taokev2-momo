-- ==============================================================
-- V18: 种子数据 — 课程表 + 公开课开课计划
-- 数据来源：设计稿 innercourse_list.html / opencourse_list.html / innercourse.html / opencourse.html
-- ==============================================================

-- 获取已有讲师的 user_id 和 trainer_id
SET @u_cah = (SELECT id FROM sys_users WHERE phone = '13266660001');
SET @u_gdf = (SELECT id FROM sys_users WHERE phone = '13266660002');
SET @u_fzm = (SELECT id FROM sys_users WHERE phone = '13266660003');
SET @u_lj  = (SELECT id FROM sys_users WHERE phone = '13266660004');
SET @u_zhc = (SELECT id FROM sys_users WHERE phone = '13266660005');
SET @u_zy  = (SELECT id FROM sys_users WHERE phone = '13266660016');
SET @u_lxf = (SELECT id FROM sys_users WHERE phone = '13266660017');
SET @u_zsj = (SELECT id FROM sys_users WHERE phone = '13266660018');
SET @u_dyx = (SELECT id FROM sys_users WHERE phone = '13266660019');

SET @t_cah = (SELECT id FROM user_trainers WHERE user_id = @u_cah);
SET @t_gdf = (SELECT id FROM user_trainers WHERE user_id = @u_gdf);
SET @t_fzm = (SELECT id FROM user_trainers WHERE user_id = @u_fzm);
SET @t_lj  = (SELECT id FROM user_trainers WHERE user_id = @u_lj);
SET @t_zhc = (SELECT id FROM user_trainers WHERE user_id = @u_zhc);
SET @t_zy  = (SELECT id FROM user_trainers WHERE user_id = @u_zy);
SET @t_lxf = (SELECT id FROM user_trainers WHERE user_id = @u_lxf);
SET @t_zsj = (SELECT id FROM user_trainers WHERE user_id = @u_zsj);
SET @t_dyx = (SELECT id FROM user_trainers WHERE user_id = @u_dyx);

-- 课程分类 ID
SET @cat_leadership = (SELECT id FROM sys_categories WHERE type='COURSE_CATEGORY' AND name='领导力' LIMIT 1);
SET @cat_hr         = (SELECT id FROM sys_categories WHERE type='COURSE_CATEGORY' AND name='人力资源' LIMIT 1);
SET @cat_career     = (SELECT id FROM sys_categories WHERE type='COURSE_CATEGORY' AND name='职业素养' LIMIT 1);
SET @cat_training   = (SELECT id FROM sys_categories WHERE type='COURSE_CATEGORY' AND name='培训发展' LIMIT 1);
SET @cat_strategy   = (SELECT id FROM sys_categories WHERE type='COURSE_CATEGORY' AND name='经营战略' LIMIT 1);
SET @cat_service    = (SELECT id FROM sys_categories WHERE type='COURSE_CATEGORY' AND name='客户服务' LIMIT 1);

-- ---------------------------------------------------------------
-- 1. 内训课种子数据
-- ---------------------------------------------------------------
INSERT INTO `courses`
    (`title`, `type`, `publisher_id`, `publisher_type`, `category_id`, `duration_days`, `hours_per_day`, `price`, `keywords`, `trainer_id`, `is_featured`, `status`, `score`, `view_count`, `enrollment_count`, `sort_order`, `published_at`, `audience`, `intro`, `created_at`, `updated_at`)
VALUES
('系统性管理能力训练——管理九剑', 'INTERNAL', @u_zy, 'TRAINER', @cat_leadership, 2, 6.0, 0.00,
 '管理,基层主管,领导力', @t_zy, 1, 2, 5.00, 16404, 320, 100,
 '2026-01-15 09:00:00', '经理人',
 '<h3>培训受众：</h3><p>未经系统培训的基、中、高层管理者，新晋升主管、经理，准备晋升管理的核心员工，创业者。</p><h3>课程收益：</h3><p>大部分管理者都是因为业务优秀而升职。从业务明星升职管理者，却不培训管理知识和技能，不仅失去一个业务明星，更可能拖累整个业务团队。</p>',
 NOW(), NOW()),

('PowerPoint结构化设计与排版', 'INTERNAL', @u_lxf, 'TRAINER', @cat_career, 2, 6.0, 0.00,
 'ppt,office,办公技能,PowerPoint', @t_lxf, 0, 2, 4.80, 9155, 186, 99,
 '2026-01-20 09:00:00', '企业白领、行政人员、培训师',
 '<p>本课程帮助学员掌握 PPT 排版设计的核心技巧，从结构化思维到视觉呈现，全面提升商务演示水平。</p>',
 NOW(), NOW()),

('六段锦职场成长管理', 'INTERNAL', @u_zsj, 'TRAINER', @cat_leadership, 1, 6.0, 0.00,
 '员工管理,激励,高效沟通,目标管理', @t_zsj, 0, 2, 4.50, 1812, 78, 98,
 '2026-02-01 09:00:00', '中基层管理者',
 '<p>以六个关键模块帮助管理者系统掌握职场成长的核心技能，包括目标管理、高效沟通、员工激励等实用方法。</p>',
 NOW(), NOW()),

('用数字管理领导力沙盘', 'INTERNAL', @u_dyx, 'TRAINER', @cat_leadership, 1, 6.0, 0.00,
 '沟通,跨部门沟通,团队建设', @t_dyx, 0, 2, 4.90, 10190, 245, 97,
 '2026-02-05 09:00:00', '中高层管理者',
 '<p>通过沙盘模拟的方式，让管理者在实战中掌握数据驱动的领导力，提升决策能力和团队协作能力。</p>',
 NOW(), NOW()),

('六大工具防错主管——有效解决问题', 'INTERNAL', @u_cah, 'TRAINER', @cat_leadership, 1, 6.0, 0.00,
 '一线主管,骨干员工,六大工具,pdca', @t_cah, 0, 2, 4.70, 12447, 198, 96,
 '2026-02-10 09:00:00', '一线主管、骨干员工',
 '<p>运用六大问题解决工具帮助一线主管高效处理现场问题，提升管理效率和团队执行力。</p>',
 NOW(), NOW()),

('非人力资源的人力资源管理', 'INTERNAL', @u_gdf, 'TRAINER', @cat_hr, 1, 6.0, 0.00,
 '非人,人力资源管理,人才招聘,绩效考核', @t_gdf, 1, 2, 4.85, 16370, 402, 95,
 '2026-02-15 09:00:00', '非HR部门的中高层管理者',
 '<p>帮助非人力资源部门的管理者掌握选、育、用、留核心技能，打造高绩效团队。</p>',
 NOW(), NOW()),

('OKR开发及应用', 'INTERNAL', @u_fzm, 'TRAINER', @cat_hr, 1, 6.0, 0.00,
 '绩效管理,okr', @t_fzm, 0, 2, 4.60, 14053, 310, 94,
 '2026-02-20 09:00:00', 'HR 管理者、部门负责人',
 '<p>系统讲解 OKR 的设计逻辑与落地策略，结合案例演练帮助企业高效推进目标管理变革。</p>',
 NOW(), NOW()),

('培训管理者的项目管理', 'INTERNAL', @u_lj, 'TRAINER', @cat_hr, 2, 6.0, 0.00,
 '培训管理,培训体系,培训师', @t_lj, 0, 2, 4.75, 18001, 456, 93,
 '2026-02-25 09:00:00', '培训管理者、HR BP',
 '<p>以项目管理的方法论系统提升培训管理者的项目策划、执行和评估能力。</p>',
 NOW(), NOW()),

('打造狼性团队', 'INTERNAL', @u_zsj, 'TRAINER', @cat_leadership, 2, 6.0, 0.00,
 '管理,团队建设,激励,执行力,沟通', @t_zsj, 0, 2, 4.40, 5643, 102, 92,
 '2026-03-01 09:00:00', '企业中高层管理者',
 '<p>打造一支具有狼性精神的高绩效团队，从目标设定、激励机制到执行监督全流程闭环。</p>',
 NOW(), NOW()),

('内部讲师培养 TTT', 'INTERNAL', @u_cah, 'TRAINER', @cat_training, 2, 6.0, 0.00,
 'TTT,讲师培养', @t_cah, 1, 2, 4.95, 16756, 523, 91,
 '2026-03-05 09:00:00', '企业内训师、培训经理',
 '<p>从课程设计到授课技巧，全面提升内部讲师的专业能力和授课水平，打造企业内训师梯队。</p>',
 NOW(), NOW()),

('PDCA 解决问题的金钥匙', 'INTERNAL', @u_zhc, 'TRAINER', @cat_career, 1, 6.0, 0.00,
 '问题解决,pdca', @t_zhc, 0, 2, 4.55, 10741, 218, 90,
 '2026-03-10 09:00:00', '中基层管理者、一线班组长',
 '<p>以 PDCA 循环为核心方法论，帮助管理者和员工建立系统的问题解决思维和执行闭环。</p>',
 NOW(), NOW()),

('跨部门沟通与协作', 'INTERNAL', @u_dyx, 'TRAINER', @cat_hr, 2, 6.0, 0.00,
 '跨部门沟通,沟通技巧', @t_dyx, 0, 2, 4.65, 4896, 135, 89,
 '2026-03-15 09:00:00', '中层管理者、项目负责人',
 '<p>破解跨部门沟通壁垒，建立高效协作机制，提升组织整体运作效率。</p>',
 NOW(), NOW()),

('关键时刻：职场人的高情商沟通', 'INTERNAL', @u_lxf, 'TRAINER', @cat_career, 1, 6.0, 0.00,
 '职场沟通,高情商', @t_lxf, 0, 2, 4.80, 12592, 367, 88,
 '2026-03-20 09:00:00', '职场各层级人员',
 '<p>掌握关键场景下的高情商沟通技巧，包括向上沟通、平级协作、向下反馈等核心场景。</p>',
 NOW(), NOW());

-- ---------------------------------------------------------------
-- 2. 线下公开课种子数据（OPEN_OFFLINE）
-- ---------------------------------------------------------------
INSERT INTO `courses`
    (`title`, `type`, `publisher_id`, `publisher_type`, `category_id`, `duration_days`, `hours_per_day`, `price`, `original_price`, `keywords`, `trainer_id`, `is_featured`, `status`, `score`, `view_count`, `enrollment_count`, `sort_order`, `published_at`, `audience`, `intro`, `syllabus`, `created_at`, `updated_at`)
VALUES
('客户代表管理技能提升培训（高级班）', 'OPEN_OFFLINE', @u_zy, 'TRAINER', @cat_service, 2, 6.0, 4980.00, 5980.00,
 '大客户管理,销售管理,客户服务', @t_zy, 1, 2, 4.90, 1208, 86, 80,
 '2026-03-01 09:00:00',
 '大客户经理、销售主管、客户服务总监及相关管理人员',
 '<h3>课程背景</h3><p>客户代表管理，是现代企业客户管理体系、运营主管、培训等支持架构的重要环节。发展与提升企业的核心竞争力，是企业长期发展的重中之重。</p><h3>课程收益</h3><ul><li>知识收益：了解大客户管理的底层逻辑，掌握大客户生命周期。</li><li>提升能力：系统了解客户开发，搭建落地管理体系。</li></ul>',
 '<h4>模块一：客户生命周期管理与大客户画像</h4><ul><li>何为客户生命周期？</li><li>大客户画像建模与关键指标分析</li></ul><h4>模块二：大客户开发与关系深度维护</h4><ul><li>顾问式销售：以解决客户痛点为核心</li><li>高层对话技巧</li></ul>',
 NOW(), NOW()),

('金字塔原理：逻辑思维与高效表达', 'OPEN_OFFLINE', @u_lxf, 'TRAINER', @cat_career, 2, 6.0, 3980.00, 4580.00,
 '金字塔原理,逻辑思维,高效表达', @t_lxf, 1, 2, 5.00, 2945, 152, 79,
 '2026-03-10 09:00:00',
 '需要进行工作汇报、方案展示、商务演示的各层级管理者和专业人员',
 '<p>以麦肯锡金字塔原理为核心框架，帮助学员建立结构化思维和逻辑表达能力。</p>',
 '<h4>第一部分：金字塔原理基础</h4><ul><li>结论先行与逻辑递进</li><li>MECE 原则</li></ul><h4>第二部分：高效表达实操</h4><ul><li>30秒电梯演讲</li><li>商务写作应用</li></ul>',
 NOW(), NOW()),

('高效目标管理与执行落地工作坊', 'OPEN_OFFLINE', @u_zsj, 'TRAINER', @cat_leadership, 2, 6.0, 4280.00, 5280.00,
 '目标管理,执行力,工作坊', @t_zsj, 0, 2, 4.70, 876, 42, 78,
 '2026-03-15 09:00:00',
 '企业中高层管理者、部门负责人',
 '<p>以目标管理方法论结合工作坊形式，让管理者在实操中掌握目标分解、计划制定和执行监控的完整闭环。</p>',
 '<h4>Day 1：目标设定与分解</h4><ul><li>SMART 目标设定</li><li>OKR 与 KPI 融合</li></ul><h4>Day 2：执行与复盘</h4><ul><li>项目计划甘特图</li><li>PDCA 复盘法</li></ul>',
 NOW(), NOW()),

('新晋管理者的八堂必修课', 'OPEN_OFFLINE', @u_cah, 'TRAINER', @cat_leadership, 2, 6.0, 3680.00, 4280.00,
 '新晋管理者,管理技能,角色转型', @t_cah, 0, 2, 4.85, 1543, 97, 77,
 '2026-03-20 09:00:00',
 '新晋升的管理者、后备干部',
 '<p>从业务骨干到管理者的角色转变，系统学习八大核心管理技能。</p>',
 '<h4>第一课：角色认知</h4><h4>第二课：目标管理</h4><h4>第三课：计划执行</h4><h4>第四课：团队建设</h4>',
 NOW(), NOW()),

('企业数字化转型战略规划', 'OPEN_OFFLINE', @u_dyx, 'TRAINER', @cat_strategy, 1, 6.0, 5800.00, 6800.00,
 '数字化转型,战略规划,企业创新', @t_dyx, 1, 2, 4.60, 2310, 68, 76,
 '2026-04-01 09:00:00',
 '企业董事长、总经理、CTO、CIO',
 '<p>从战略视角解读企业数字化转型的路径选择、技术架构和组织变革。</p>',
 '<h4>上午：数字化转型趋势与案例</h4><h4>下午：企业数字化战略落地路径</h4>',
 NOW(), NOW());

-- ---------------------------------------------------------------
-- 3. 线上公开课种子数据（OPEN_ONLINE）
-- ---------------------------------------------------------------
INSERT INTO `courses`
    (`title`, `type`, `publisher_id`, `publisher_type`, `category_id`, `duration_days`, `hours_per_day`, `price`, `original_price`, `keywords`, `trainer_id`, `is_featured`, `status`, `score`, `view_count`, `enrollment_count`, `sort_order`, `published_at`, `audience`, `intro`, `created_at`, `updated_at`)
VALUES
('AI 赋能企业管理创新', 'OPEN_ONLINE', @u_dyx, 'TRAINER', @cat_strategy, 1, 3.0, 1980.00, 2580.00,
 'AI,人工智能,管理创新', @t_dyx, 1, 2, 4.75, 3520, 213, 75,
 '2026-04-05 09:00:00',
 '企业中高层管理者、创新部门负责人',
 '<p>探讨 AI 技术在企业管理中的应用场景，帮助管理者理解 AI 赋能的底层逻辑。</p>',
 NOW(), NOW()),

('远程团队管理与协作效率提升', 'OPEN_ONLINE', @u_zy, 'TRAINER', @cat_leadership, 1, 3.0, 1280.00, 1680.00,
 '远程管理,团队协作,效率提升', @t_zy, 0, 2, 4.50, 1867, 145, 74,
 '2026-04-10 09:00:00',
 '远程/混合办公的团队管理者',
 '<p>针对远程办公场景，提供团队管理和协作效率提升的系统方法与工具。</p>',
 NOW(), NOW());

-- ---------------------------------------------------------------
-- 4. 公开课开课计划（course_plans）
-- ---------------------------------------------------------------
SET @c_customer_mgmt = (SELECT id FROM courses WHERE title = '客户代表管理技能提升培训（高级班）' LIMIT 1);
SET @c_pyramid       = (SELECT id FROM courses WHERE title = '金字塔原理：逻辑思维与高效表达' LIMIT 1);
SET @c_target_mgmt   = (SELECT id FROM courses WHERE title = '高效目标管理与执行落地工作坊' LIMIT 1);
SET @c_new_manager   = (SELECT id FROM courses WHERE title = '新晋管理者的八堂必修课' LIMIT 1);
SET @c_digital       = (SELECT id FROM courses WHERE title = '企业数字化转型战略规划' LIMIT 1);
SET @c_ai_mgmt       = (SELECT id FROM courses WHERE title = 'AI 赋能企业管理创新' LIMIT 1);
SET @c_remote        = (SELECT id FROM courses WHERE title = '远程团队管理与协作效率提升' LIMIT 1);

INSERT INTO `course_plans` (`course_id`, `start_time`, `end_time`, `province_id`, `city_id`, `district_id`, `address`, `online_url`, `sort_order`, `created_at`, `updated_at`) VALUES
(@c_customer_mgmt, '2026-05-09 09:00:00', '2026-05-10 17:00:00', 19, 200, 0, '深圳市南山区科技园深南大道9966号', '', 1, NOW(), NOW()),
(@c_customer_mgmt, '2026-05-15 09:00:00', '2026-05-16 17:00:00', 9, 104, 0, '上海市浦东新区陆家嘴环路1000号', '', 2, NOW(), NOW()),
(@c_customer_mgmt, '2026-06-12 09:00:00', '2026-06-13 17:00:00', 1, 32, 0, '北京市朝阳区建国门外大街1号', '', 3, NOW(), NOW()),
(@c_customer_mgmt, '2026-07-14 09:00:00', '2026-07-15 17:00:00', 11, 120, 0, '杭州市西湖区文三路388号', '', 4, NOW(), NOW());

INSERT INTO `course_plans` (`course_id`, `start_time`, `end_time`, `province_id`, `city_id`, `district_id`, `address`, `online_url`, `sort_order`, `created_at`, `updated_at`) VALUES
(@c_pyramid, '2026-04-25 09:00:00', '2026-04-26 17:00:00', 9, 104, 0, '上海市静安区南京西路1266号', '', 1, NOW(), NOW()),
(@c_pyramid, '2026-05-20 09:00:00', '2026-05-21 17:00:00', 19, 201, 0, '广州市天河区珠江新城华夏路30号', '', 2, NOW(), NOW());

INSERT INTO `course_plans` (`course_id`, `start_time`, `end_time`, `province_id`, `city_id`, `district_id`, `address`, `online_url`, `sort_order`, `created_at`, `updated_at`) VALUES
(@c_target_mgmt, '2026-05-08 09:00:00', '2026-05-09 17:00:00', 1, 32, 0, '北京市海淀区中关村大街1号', '', 1, NOW(), NOW()),
(@c_target_mgmt, '2026-06-05 09:00:00', '2026-06-06 17:00:00', 23, 268, 0, '成都市锦江区红星路三段1号', '', 2, NOW(), NOW());

INSERT INTO `course_plans` (`course_id`, `start_time`, `end_time`, `province_id`, `city_id`, `district_id`, `address`, `online_url`, `sort_order`, `created_at`, `updated_at`) VALUES
(@c_new_manager, '2026-04-18 09:00:00', '2026-04-19 17:00:00', 9, 104, 0, '上海市黄浦区人民广场附近', '', 1, NOW(), NOW()),
(@c_new_manager, '2026-05-22 09:00:00', '2026-05-23 17:00:00', 19, 200, 0, '深圳市福田区福华一路', '', 2, NOW(), NOW()),
(@c_new_manager, '2026-06-19 09:00:00', '2026-06-20 17:00:00', 10, 110, 0, '南京市鼓楼区汉中路', '', 3, NOW(), NOW());

INSERT INTO `course_plans` (`course_id`, `start_time`, `end_time`, `province_id`, `city_id`, `district_id`, `address`, `online_url`, `sort_order`, `created_at`, `updated_at`) VALUES
(@c_digital, '2026-05-16 09:00:00', '2026-05-16 17:00:00', 9, 104, 0, '上海市浦东新区世纪大道100号', '', 1, NOW(), NOW());

INSERT INTO `course_plans` (`course_id`, `start_time`, `end_time`, `province_id`, `city_id`, `district_id`, `address`, `online_url`, `sort_order`, `created_at`, `updated_at`) VALUES
(@c_ai_mgmt, '2026-04-20 09:00:00', '2026-04-20 12:00:00', 0, 0, 0, '', 'https://live.taoke.com/ai-management-2026', 1, NOW(), NOW()),
(@c_ai_mgmt, '2026-05-18 09:00:00', '2026-05-18 12:00:00', 0, 0, 0, '', 'https://live.taoke.com/ai-management-2026-2', 2, NOW(), NOW());

INSERT INTO `course_plans` (`course_id`, `start_time`, `end_time`, `province_id`, `city_id`, `district_id`, `address`, `online_url`, `sort_order`, `created_at`, `updated_at`) VALUES
(@c_remote, '2026-04-28 14:00:00', '2026-04-28 17:00:00', 0, 0, 0, '', 'https://live.taoke.com/remote-team-2026', 1, NOW(), NOW());
