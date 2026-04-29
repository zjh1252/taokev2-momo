/**
 * 临时 mock 数据
 *
 * 用途：在后端接口未联通或字段尚未对齐时，让 UI 跑得起来；
 * 接口对接后逐项替换。
 */

export const MOCK_BANNER = {
  title: '提升企业核心竞争力',
  subtitle: '从优质内训开始 — 精选行业大咖，定制化课程方案',
  primaryAction: { text: '立即预约', url: '/pages/course/list' },
  secondaryAction: { text: '了解更多', url: '/pages/course/list' },
};

export const MOCK_LATEST_CASE =
  '某世界 500 强企业引入《卓越领导力》内训课程，满意度 98%';

export const MOCK_EXPERTS = [
  {
    id: 1,
    nickname: '张大卫',
    title: '资深领导力教练',
    avatar: 'https://avatars.githubusercontent.com/u/9919?v=4',
    rating: 5,
    verified: true,
    tags: ['领导力', '组织发展', '高管教练'],
    viewCount: 1280,
    favCount: 86,
  },
  {
    id: 2,
    nickname: '李雪梅',
    title: '敏捷管理专家',
    avatar: 'https://avatars.githubusercontent.com/u/1024025?v=4',
    rating: 4.5,
    verified: true,
    tags: ['敏捷', 'Scrum', '项目管理'],
    viewCount: 980,
    favCount: 64,
  },
  {
    id: 3,
    nickname: '王建国',
    title: '战略规划顾问',
    avatar: 'https://avatars.githubusercontent.com/u/6128107?v=4',
    rating: 4,
    verified: false,
    tags: ['战略', '商业模式'],
    viewCount: 612,
    favCount: 41,
  },
];

export const MOCK_COURSES = [
  {
    id: 101,
    title: '数智化转型背景下的组织效能提升与绩效管理',
    coverUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400',
    startDate: '10月24日',
    city: '上海',
    trainerName: '张大卫',
    price: 3980,
  },
  {
    id: 102,
    title: '高管演讲与呈现技巧：如何用故事打动人心',
    coverUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400',
    startDate: '11月05日',
    city: '北京',
    trainerName: '李雪梅',
    price: 4500,
  },
  {
    id: 103,
    title: '敏捷转型与高效团队打造',
    coverUrl: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400',
    startDate: '11月18日',
    city: '深圳',
    trainerName: '王建国',
    price: 3680,
  },
];

// 公开课列表页：分类八宫格（与 design_stitch/_2 对齐）
export const MOCK_VIDEO_CATEGORIES = [
  { id: 1, name: '经营战略', icon: 'list' },
  { id: 2, name: '市场营销', icon: 'shop' },
  { id: 3, name: '研发管理', icon: 'videocam' },
  { id: 4, name: '销售管理', icon: 'cart' },
  { id: 5, name: '采购管理', icon: 'cart' },
  { id: 6, name: '生产管理', icon: 'gear' },
  { id: 7, name: '物流管理', icon: 'paperplane' },
  { id: 8, name: '全部分类', icon: 'list' },
];

// 专家列表页 mock（与 TkExpertCard row 数据契约对齐）
export const MOCK_TRAINER_LIST = [
  {
    id: 1,
    name: '李建国',
    avatar: 'https://avatars.githubusercontent.com/u/9919?v=4',
    title: '前阿里政委，组织发展与领导力实战专家，20年企业管理经验。',
    score: 4.9,
    isTrusted: 1,
    viewCount: 1200,
    commentCount: 128,
    expertiseCategories: [
      { categoryName: '领导力' },
      { categoryName: '组织发展' },
      { categoryName: '企业文化' },
    ],
  },
  {
    id: 2,
    name: '王芳',
    avatar: 'https://avatars.githubusercontent.com/u/1024025?v=4',
    title: '资深财税专家，四大前合伙人，专注企业税务筹划与内控体系建设。',
    score: 4.8,
    isTrusted: 1,
    viewCount: 890,
    commentCount: 96,
    expertiseCategories: [
      { categoryName: '财税筹划' },
      { categoryName: '企业内控' },
      { categoryName: '财务管理' },
    ],
  },
  {
    id: 3,
    name: '张晨',
    avatar: 'https://avatars.githubusercontent.com/u/6128107?v=4',
    title: '新媒体营销实战派，曾打造多个千万级爆款案例，擅长流量裂变。',
    score: 5.0,
    isTrusted: 1,
    viewCount: 3500,
    commentCount: 215,
    expertiseCategories: [
      { categoryName: '新媒体营销' },
      { categoryName: '私域流量' },
      { categoryName: '爆款打造' },
    ],
  },
  {
    id: 4,
    name: '赵静',
    avatar: 'https://avatars.githubusercontent.com/u/1500684?v=4',
    title: '职场心理学与沟通专家，国家二级心理咨询师，世界500强内训师。',
    score: 4.7,
    isTrusted: 1,
    viewCount: 540,
    commentCount: 64,
    expertiseCategories: [
      { categoryName: '职场沟通' },
      { categoryName: '情绪管理' },
      { categoryName: '心理学' },
    ],
  },
];

// 专家详情 mock
export const MOCK_TRAINER_DETAIL = {
  id: 1,
  userId: 1001,
  name: '李建国',
  avatar: 'https://avatars.githubusercontent.com/u/9919?v=4',
  title: '前阿里政委 / 组织发展专家',
  oneLineIntro: '20 年企业管理经验，深耕组织发展与领导力实战领域。',
  bio: '李建国先生，国内知名组织发展与领导力实战派专家。曾任阿里巴巴政委、腾讯战略顾问。专注于企业文化建设、组织能力提升、高管教练等领域，累计为 200+ 中大型企业提供过咨询与培训服务，深受学员好评。',
  goodAt: '组织诊断、领导力发展、文化重塑、高管教练',
  teachingStyle: '案例驱动 + 实战沙盘，理论与实操紧密结合',
  partialClients: '阿里巴巴 / 腾讯 / 华为 / 美的集团 / 招商银行 / 中国平安',
  experienceYears: 20,
  teachingYears: 12,
  isTrusted: 1,
  isSigned: 1,
  isRecommended: 1,
  hasCopyrightCourse: 1,
  score: 4.9,
  viewCount: 12856,
  consultationCount: 320,
  commentCount: 128,
  provinceName: '上海',
  cityName: '上海',
  expertiseCategories: [
    { categoryName: '领导力' },
    { categoryName: '组织发展' },
    { categoryName: '企业文化' },
    { categoryName: '高管教练' },
  ],
  industryCategories: [
    { categoryName: '互联网' },
    { categoryName: '金融' },
    { categoryName: '制造业' },
  ],
  educations: [
    { schoolName: '北京大学光华管理学院', major: 'MBA', isGraduated: 1 },
    { schoolName: '清华大学经管学院', major: '管理学博士', isGraduated: 1 },
  ],
  workExperiences: [
    { companyName: '阿里巴巴集团', position: '资深政委', startDate: '2008-05-01', endDate: '2018-12-31' },
    { companyName: '腾讯', position: '组织发展顾问', startDate: '2019-01-01', endDate: '2023-06-30' },
  ],
};

// 课程详情 mock
export const MOCK_COURSE_DETAIL = {
  id: 101,
  title: '战略落地与年度经营计划制定实战班',
  coverUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600',
  type: 'OPEN',
  typeLabel: '公开课',
  categoryName: '经营战略',
  trainerName: '王健林',
  publisherName: '淘课企业大学',
  durationDays: 2,
  totalHours: 12,
  price: 2500,
  originalPrice: 3200,
  isFree: 0,
  score: 4.8,
  viewCount: 5680,
  enrollmentCount: 128,
  nextPlanStartDate: '2026-05-12',
  nextPlanCity: '上海',
  intro:
    '在当今复杂多变的商业环境中，企业的战略制定与落地能力成为决定生存和发展的关键。本课程旨在帮助企业高管、战略负责人以及相关业务骨干，掌握科学、系统的战略规划工具与方法，将宏伟的战略蓝图切实转化为可执行的年度经营计划。',
  syllabus:
    '1. 宏观环境与行业趋势分析框架\n2. 企业核心竞争力识别与培育\n3. 战略目标的设定与量化指标设计\n4. 年度经营计划的编制流程与关键节点管控\n5. 战略执行过程中的绩效监控与复盘机制',
  audience: '企业高管、战略负责人、业务骨干、HR / 经营分析负责人',
  highlights:
    '• 大量实战案例分析与沙盘演练\n• BSC、战略地图等工具直接落地\n• 现场辅导：每位学员产出本企业的年度经营计划草案',
  plans: [
    {
      id: 1,
      startTime: '2026-05-12T09:00:00',
      endTime: '2026-05-13T17:30:00',
      address: '上海·浦东丽思卡尔顿酒店',
    },
    {
      id: 2,
      startTime: '2026-06-22T09:00:00',
      endTime: '2026-06-23T17:30:00',
      address: '北京·国贸大酒店',
    },
  ],
};
