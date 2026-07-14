// 路由路径常量，避免硬编码字符串散落各处

export const ROUTES = {
  HOME: '/',
  TRAINERS: '/trainer',
  PUBLIC_COURSES: '/opencourse',
  INTERNAL_COURSES: '/inhousecourse',
  ONLINE_COURSES: '/videos',
  INSTITUTIONS: '/company',
  ASSOCIATIONS: '/association',
  SEARCH: '/search',
  /** 城市综合频道（SEO：/city/{拼音}） */
  cityChannel: (enName: string) => `/city/${enName}`,
  CART: '/cart',
  CHECKOUT: '/checkout',
  ARTICLES: '/articles',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',

  // ---- 用户中心 ----
  DASHBOARD: '/dashboard',
  UC_MESSAGES: '/dashboard/messages',
  UC_LEARNING: '/dashboard/learning',
  UC_ORDERS: '/dashboard/orders',
  UC_ORDERS_INVOICE: '/dashboard/orders/invoice',
  UC_DEMANDS: '/dashboard/demands',
  UC_DEMANDS_CREATE: '/dashboard/demands/create',
  PUBLISH_DEMAND: '/publish-demand',
  UC_FAVORITES: '/dashboard/favorites',
  UC_REVIEWS: '/dashboard/reviews',
  UC_ALLIANCE_AMBASSADOR: '/dashboard/alliance/ambassador',
  UC_ALLIANCE_AMBASSADOR_PENDING: '/dashboard/alliance/ambassador/pending',
  UC_ALLIANCE_PARTNER: '/dashboard/alliance/partner',
  UC_ALLIANCE_PARTNER_PENDING: '/dashboard/alliance/partner/pending',
  UC_ALLIANCE_721: '/dashboard/alliance/721',
  UC_ALLIANCE_721_PENDING: '/dashboard/alliance/721/pending',
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
  UC_ACCOUNT_BUYER_CERT_REAL_NAME: '/dashboard/account/certification/buyer/real-name',
  UC_ACCOUNT_BUYER_CERT_WORK: '/dashboard/account/certification/buyer/work',
  UC_ACCOUNT_AGENCY_QUALIFICATION: '/dashboard/account/certification/agency/qualification',
  UC_ACCOUNT_INSTITUTION_COMPANY_INFO: '/dashboard/account/certification/institution/company-info',

  // ---- 我的课程 ----
  UC_COURSES: '/dashboard/courses',
  UC_COURSES_CREATE: '/dashboard/courses/create',
  UC_COURSES_MANAGE: '/dashboard/courses/manage',

  // ---- 我的案例 ----
  UC_CASES_MANAGE: '/dashboard/cases/manage',
  UC_CASES_CREATE: '/dashboard/cases/create',

  // ---- 我的著作 ----
  UC_BOOKS_MANAGE: '/dashboard/books/manage',
  UC_BOOKS_CREATE: '/dashboard/books/create',

  // ---- 我的精彩瞬间 ----
  UC_HIGHLIGHTS_MANAGE: '/dashboard/highlights/manage',
  UC_HIGHLIGHTS_CREATE: '/dashboard/highlights/create',

  // ---- 我的视频（录播课） ----
  VIDEOS: '/videos',
  /** 录播课播放页 */
  videoPlay: (videoId: number, chapterId?: number) =>
    chapterId
      ? `/videos/${videoId}/play?chapter=${chapterId}`
      : `/videos/${videoId}/play`,
  UC_VIDEOS_CREATE: '/dashboard/video/create',
  UC_VIDEOS_MANAGE: '/dashboard/video/manage',

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
