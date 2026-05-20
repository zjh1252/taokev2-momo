// 路由路径常量，避免硬编码字符串散落各处

export const ROUTES = {
  HOME: '/',
  TRAINERS: '/trainers',
  PUBLIC_COURSES: '/opencourses',
  INTERNAL_COURSES: '/innercourses',
  ONLINE_COURSES: '/videos',
  INSTITUTIONS: '/institutions',
  ASSOCIATIONS: '/associations',
  SEARCH: '/search',
  CART: '/cart',
  CHECKOUT: '/checkout',
  COURSES: '/courses',
  INSTRUCTORS: '/instructors',
  ARTICLES: '/articles',
  CASES: '/cases',
  LOGIN: '/login',
  REGISTER: '/register',

  // ---- 用户中心 ----
  DASHBOARD: '/dashboard',
  UC_MESSAGES: '/dashboard/messages',
  UC_LEARNING: '/dashboard/learning',
  UC_ORDERS: '/dashboard/orders',
  UC_DEMANDS: '/dashboard/demands',
  UC_DEMANDS_CREATE: '/dashboard/demands/create',
  UC_FAVORITES: '/dashboard/favorites',
  UC_REVIEWS: '/dashboard/reviews',
  UC_ALLIANCE_AMBASSADOR: '/dashboard/alliance/ambassador',
  UC_ALLIANCE_PARTNER: '/dashboard/alliance/partner',
  UC_ALLIANCE_721: '/dashboard/alliance/721',
  UC_ACCOUNT_INFO: '/dashboard/account/info',
  UC_ACCOUNT_BASE: '/dashboard/account/base',
  UC_ACCOUNT_MORE: '/dashboard/account/more',
  UC_ACCOUNT_VERIFY: '/dashboard/account/verify',
  UC_ACCOUNT_BIND: '/dashboard/account/bind',
  UC_ACCOUNT_SWITCH: '/dashboard/account/switch',
  UC_ACCOUNT_PASSWORD: '/dashboard/account/password',
  // 注销
  UC_ACCOUNT_WITHDRAW_ROLE: '/dashboard/account/withdraw-role',
  UC_ACCOUNT_DELETE: '/dashboard/account/delete-account',
  // 专家四维度资质认证
  UC_ACCOUNT_CERT_REAL_NAME: '/dashboard/account/certification/real-name',
  UC_ACCOUNT_CERT_PROFESSIONAL: '/dashboard/account/certification/professional',
  UC_ACCOUNT_CERT_EDUCATION: '/dashboard/account/certification/education',
  UC_ACCOUNT_CERT_WORK: '/dashboard/account/certification/work',
  // 三角色身份信息认证
  UC_ACCOUNT_AGENT_WORK_CERT: '/dashboard/account/certification/agent/work',
  UC_ACCOUNT_AGENCY_QUALIFICATION: '/dashboard/account/certification/agency/qualification',
  UC_ACCOUNT_INSTITUTION_COMPANY_INFO: '/dashboard/account/certification/institution/company-info',

  // ---- 我的课程 ----
  UC_COURSES: '/dashboard/courses',
  UC_COURSES_CREATE: '/dashboard/courses/create',
  UC_COURSES_MANAGE: '/dashboard/courses/manage',

  // ---- 我的案例 ----
  UC_CASES_MANAGE: '/dashboard/cases/manage',
  UC_CASES_CREATE: '/dashboard/cases/create',

  // ---- 我的精彩瞬间 ----
  UC_HIGHLIGHTS_MANAGE: '/dashboard/highlights/manage',
  UC_HIGHLIGHTS_CREATE: '/dashboard/highlights/create',

  // ---- 我的视频（录播课） ----
  VIDEOS: '/videos',
  UC_VIDEOS_CREATE: '/dashboard/videos/create',
  UC_VIDEOS_MANAGE: '/dashboard/videos/manage',

  // ---- 我的专家（经纪人/助理/机构/机构员工） ----
  UC_MY_EXPERTS: '/dashboard/my-experts',
  UC_MY_EXPERTS_LIST: '/dashboard/my-experts/list',
  UC_MY_EXPERTS_ADD: '/dashboard/my-experts/add',

  // ---- 我的业务（经纪人/经纪公司） ----
  UC_MY_BUSINESS: '/dashboard/my-business',
  UC_MY_BUSINESS_ORDERS: '/dashboard/my-business/orders',
  UC_MY_BUSINESS_REVIEWS: '/dashboard/my-business/reviews',
  UC_MY_BUSINESS_DATA: '/dashboard/my-business/data',

  // ---- 我的机构（机构员工） ----
  UC_MY_INSTITUTION: '/dashboard/my-institution',

  // ---- 我的员工（培训机构） ----
  UC_MY_STAFF: '/dashboard/my-staff',
  UC_MY_EMPLOYEES: '/dashboard/my-employees',

  // ---- 我的场地（培训机构） ----
  UC_MY_VENUES: '/dashboard/my-venues',

  // ---- 我的代理（专家） ----
  UC_MY_AGENTS: '/dashboard/my-agents',

  // ---- 我的经纪公司（经纪人） ----
  UC_MY_ENTERPRISE_AGENT: '/dashboard/my-enterprise-agent',

  // ---- 我的经纪团队（经纪公司） ----
  UC_MY_AGENTS_TEAM: '/dashboard/my-agents-team',

  // ---- 角色申请 ----
  UC_APPLY: '/dashboard/apply',
  UC_APPLY_SUCCESS: '/dashboard/apply/success',
} as const;
