import type {
  HeroCategory,
  Expert,
  CaseStudy,
  InternalCourse,
  PublicCourse,
} from '../types';

/**
 * 首页 Hero 分类侧栏
 * TODO: 替换为接口 /api/categories
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

const PLACEHOLDER_AVATAR = '/statics/images/avatar-placeholder.svg';
const PLACEHOLDER_COVER = '/statics/images/cover-placeholder.svg';

/**
 * 推荐专家
 * TODO: 替换为接口 GET /api/experts?featured=true
 */
export const featuredExperts: Expert[] = [
  {
    id: 1,
    name: '张敬之',
    title: '战略咨询专家',
    avatar: PLACEHOLDER_AVATAR,
    bio: '前麦肯锡全球合伙人，20年企业转型辅导经验，助力多家跨国企业落地数字化战略。',
    rating: 4.9,
    statType: 'cases',
    statLabel: '128+ 内训案例',
    statCount: 128,
  },
  {
    id: 2,
    name: '李清华',
    title: '组织管理专家',
    avatar: PLACEHOLDER_AVATAR,
    bio: '清华大学特聘讲师，专注于组织文化重构与核心竞争力模型打造。',
    rating: 5.0,
    statType: 'publicSessions',
    statLabel: '200+ 场公开课',
    statCount: 200,
  },
  {
    id: 3,
    name: '王建国',
    title: '实战营销专家',
    avatar: PLACEHOLDER_AVATAR,
    bio: '15年大客户销售实战经验，其"狼性营销"体系已被超过50家大中型企业采用。',
    rating: 4.8,
    statType: 'servedOrgs',
    statLabel: '300+ 服务机构',
    statCount: 300,
  },
  {
    id: 4,
    name: '陈思语',
    title: '财务管理专家',
    avatar: PLACEHOLDER_AVATAR,
    bio: '注册会计师，曾任某知名独角兽CFO，擅长企业税务筹划与内控体系建设。',
    rating: 4.9,
    statType: 'companiesServed',
    statLabel: '80+ 企业陪跑',
    statCount: 80,
  },
];

/**
 * 专家案例
 * TODO: 替换为接口 GET /api/cases?featured=true
 */
export const featuredCases: CaseStudy[] = [
  {
    id: 1,
    tag: '制造业专题',
    title: '某世界500强制造企业：组织架构重塑与中高层领导力提升项目',
    description:
      '历时6个月，覆盖全球4个区域中心，通过深度访谈、定制化课程与高管工作坊，帮助企业实现了从职能型向矩阵型组织的平稳过渡。',
    image: PLACEHOLDER_COVER,
    featured: true,
  },
  {
    id: 2,
    tag: '互联网科技',
    title: '某大厂：全员OKR管理体系导入与落地实践',
    description: '帮助团队从KPI指标向价值产出转型，提升跨部门协作效率40%。',
    image: '',
    instructorName: '周老师',
  },
  {
    id: 3,
    tag: '金融服务',
    title: '某商业银行：数字化时代下的零售业务转型培训',
    description: '重塑网点职能，打造数智化理财师团队，助力零售额增长30%。',
    image: '',
    instructorName: '林教授',
  },
];

/**
 * 热门内训课
 * TODO: 替换为接口 GET /api/courses?type=internal&sort=popular
 */
export const popularInternalCourses: InternalCourse[] = [
  {
    id: 1,
    title: '《AI时代的办公效率革命：提示词工程》',
    subtitle: '定制化方案 · 线下授课',
    image: PLACEHOLDER_COVER,
    instructorName: '徐老师',
    instructorAvatar: PLACEHOLDER_AVATAR,
    successCaseCount: 50,
  },
  {
    id: 2,
    title: '《非财务经理的财务管理实务》',
    subtitle: '决策支持 · 数据分析',
    image: PLACEHOLDER_COVER,
    instructorName: '陈老师',
    instructorAvatar: PLACEHOLDER_AVATAR,
    successCaseCount: 80,
  },
  {
    id: 3,
    title: '《全栈产品经理能力提升工坊》',
    subtitle: '全流程闭环 · 实操演练',
    image: PLACEHOLDER_COVER,
    instructorName: '林老师',
    instructorAvatar: PLACEHOLDER_AVATAR,
    successCaseCount: 60,
  },
  {
    id: 4,
    title: '《卓越领导力：从管理到赋能》',
    subtitle: '组织心理学 · 绩效提升',
    image: PLACEHOLDER_COVER,
    instructorName: '张教授',
    instructorAvatar: PLACEHOLDER_AVATAR,
    successCaseCount: 120,
  },
];

/**
 * 线下公开课
 * TODO: 替换为接口 GET /api/courses?type=public&sort=startDate
 */
export const upcomingPublicCourses: PublicCourse[] = [
  {
    id: 1,
    title: 'CSTD学习设计师认证 (4月19日AI版在线开学)',
    image: PLACEHOLDER_COVER,
    organizer: 'CSTD',
    instructor: '-',
    city: '在线',
    startDate: '2026-04-19',
    durationDays: 31,
  },
  {
    id: 2,
    title: '培训经理AI赋能训练营 (5月10日龙虾班)',
    image: PLACEHOLDER_COVER,
    organizer: 'CSTD',
    instructor: '熊俊彬 ; David',
    city: '在线',
    startDate: '2026-05-10',
    durationDays: 32,
  },
  {
    id: 3,
    title: '业务赋能引导师认证 (5月15日深圳班)',
    image: PLACEHOLDER_COVER,
    organizer: 'CSTD',
    instructor: '-',
    city: '深圳',
    startDate: '2026-05-15',
    durationDays: 2,
  },
];
