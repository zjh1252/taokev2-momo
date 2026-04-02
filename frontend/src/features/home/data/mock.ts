import type {
  HeroCategory,
  Expert,
  CaseStudy,
  InternalCourse,
  PublicCourse,
} from '../types';

/**
 * 首页 Hero 分类侧栏
 * TODO: 替换为接口 /categories
 */
export const heroCategories: HeroCategory[] = [
  { id: '1', name: '战略管理与领导力', slug: 'strategy-leadership' },
  { id: '2', name: '人力资源与培训', slug: 'hr-training' },
  { id: '3', name: '市场营销与销售', slug: 'marketing-sales' },
  { id: '4', name: '生产制造与供应链', slug: 'manufacturing-supply-chain' },
  { id: '5', name: '财务管理与资本运营', slug: 'finance-capital' },
  { id: '6', name: '数字化转型与AI', slug: 'digital-transformation' },
  { id: '7', name: '通用素质与软技能', slug: 'soft-skills' },
];

/**
 * 推荐专家（首页 6+3+3 混合布局）
 * TODO: 替换为接口 GET /trainers?featured=true
 */
export const featuredExperts: Expert[] = [
  {
    id: 1,
    name: '张敬之',
    title: '战略咨询导师',
    subtitle: '前麦肯锡全球合伙人 / 20年企业转型经验',
    badge: '首席专家',
    avatar: '/statics/images/expert-main.jpg',
    coverImage: '/statics/images/expert-main.jpg',
    bio: '深度辅导过超过50家世界500强企业，独创"动态战略演进模型"，专注于复杂商业环境下的组织战略诊断、顶层设计与数字化领导力提升，帮助企业实现跨越式增长。',
    tags: ['战略规划', '组织变革', '领导力'],
  },
  {
    id: 2,
    name: 'Robert Han',
    title: '组织战略顾问',
    avatar: '/statics/images/expert-robert.jpg',
    bio: '前世界500强亚太区首席顾问，专注组织战略诊断与数字化领导力提升。',
    tags: ['战略执行', '组织诊断'],
  },
  {
    id: 3,
    name: '李清华',
    title: '清华大学特聘讲师',
    avatar: '/statics/images/expert-liqinghua.jpg',
    bio: '专注于组织文化重构与核心竞争力模型打造。',
    tags: ['企业文化', '领导力'],
  },
  {
    id: 4,
    name: '陈思语',
    title: '资深财务专家',
    avatar: '/statics/images/expert-chensiyu.jpg',
    bio: '擅长企业税务筹划与内控体系建设，助力合规。',
    tags: ['税务筹划', '内控体系'],
  },
];

/**
 * 专家案例（4 列卡片）
 * TODO: 替换为接口 GET /cases?featured=true
 */
export const featuredCases: CaseStudy[] = [
  {
    id: 1,
    tag: '制造业专题',
    title: '组织架构重塑与中高层领导力提升项目',
    description: '帮助企业实现了从职能型向矩阵型组织的平稳过渡，有效提升跨部门协同效率。',
    image: '/statics/images/case-1.jpg',
    tags: ['战略规划', '领导力'],
  },
  {
    id: 2,
    tag: '互联网科技',
    title: '某大厂：全员OKR管理体系导入与落地实践',
    description: '帮助团队从KPI指标向价值产出转型，提升跨部门协作效率40%。',
    image: '/statics/images/expert-liqinghua.jpg',
    tags: ['目标管理', '绩效考核'],
  },
  {
    id: 3,
    tag: '金融服务',
    title: '某商业银行：数字化时代下的零售业务转型培训',
    description: '重塑网点职能，打造数智化理财师团队，助力零售额增长30%。',
    image: '/statics/images/case-2.jpg',
    tags: ['零售业务', '数字化'],
  },
  {
    id: 4,
    tag: '快消品零售',
    title: '全国连锁品牌：店长综合管理能力沙盘演练',
    description: '通过沉浸式沙盘推演，全面提升单店坪效与核心人员留存率。',
    image: '/statics/images/expert-chensiyu.jpg',
    tags: ['店长培养', '沙盘演练'],
  },
];

/**
 * 热门内训课（2 列横向卡片，6 张）
 * TODO: 替换为接口 GET /courses?type=internal&sort=popular
 */
export const popularInternalCourses: InternalCourse[] = [
  {
    id: 1,
    title: '《AI时代的办公效率革命：提示词工程》',
    subtitle: '定制化方案 • 线下授课',
    image: '/statics/images/case-1.jpg',
    instructorName: '徐老师',
    instructorAvatar: '/statics/images/expert-robert.jpg',
    instructorDesc: '50+场成功案例',
  },
  {
    id: 2,
    title: '《非财务经理的财务管理实务》',
    subtitle: '决策支持 • 数据分析',
    image: '/statics/images/course-1.jpg',
    instructorName: '陈老师',
    instructorAvatar: '/statics/images/expert-chensiyu.jpg',
    instructorDesc: '注册会计师',
  },
  {
    id: 3,
    title: '《全栈产品经理能力提升工坊》',
    subtitle: '全流程闭环 • 实操演练',
    image: '/statics/images/public-course-1.jpg',
    instructorName: '林老师',
    instructorAvatar: '/statics/images/expert-liqinghua.jpg',
    instructorDesc: '前美国产品总监',
  },
  {
    id: 4,
    title: '《卓越领导力：从管理到赋能》',
    subtitle: '组织心理学 • 绩效提升',
    image: '/statics/images/hero-banner.jpg',
    instructorName: '张教授',
    instructorAvatar: '/statics/images/case-2.jpg',
    instructorDesc: '中欧客座讲师',
  },
  {
    id: 5,
    title: '《大客户销售与控单技巧》',
    subtitle: '销售技巧 • 实战演练',
    image: '/statics/images/case-1.jpg',
    instructorName: '王老师',
    instructorAvatar: '/statics/images/expert-robert.jpg',
    instructorDesc: '资深销售总监',
  },
  {
    id: 6,
    title: '《高效沟通与跨部门协作》',
    subtitle: '沟通技巧 • 团队建设',
    image: '/statics/images/course-1.jpg',
    instructorName: '李老师',
    instructorAvatar: '/statics/images/expert-chensiyu.jpg',
    instructorDesc: '组织发展专家',
  },
];

/**
 * 线下公开课
 * TODO: 替换为接口 GET /courses?type=public&sort=startDate
 */
export const upcomingPublicCourses: PublicCourse[] = [
  {
    id: 1,
    title: 'CSTD学习设计师认证 (4月19日AI版在线开学)',
    image: '/statics/images/public-course-1.jpg',
    organizer: 'CSTD',
    instructor: '-',
    city: '在线',
    startDate: '2026-04-19',
    durationDays: 31,
  },
  {
    id: 2,
    title: '培训经理AI赋能训练营 (5月10日龙虾班)',
    image: '/statics/images/public-course-2.jpg',
    organizer: 'CSTD',
    instructor: '熊俊彬 ; David',
    city: '在线',
    startDate: '2026-05-10',
    durationDays: 32,
  },
  {
    id: 3,
    title: '业务赋能引导师认证 (5月15日深圳班)',
    image: '/statics/images/course-1.jpg',
    organizer: 'CSTD',
    instructor: '-',
    city: '深圳',
    startDate: '2026-05-15',
    durationDays: 2,
  },
];
