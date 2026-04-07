// 路由路径常量，避免硬编码字符串散落各处

export const ROUTES = {
  HOME: '/',
  TRAINERS: '/trainers',
  PUBLIC_COURSES: '/opencourses',
  INTERNAL_COURSES: '/innercourses',
  ONLINE_COURSES: '/online-courses',
  INSTITUTIONS: '/institutions',
  COURSES: '/courses',
  INSTRUCTORS: '/instructors',
  ARTICLES: '/articles',
  CASES: '/cases',
  LOGIN: '/login',
  REGISTER: '/register',
  MY_PAGE: '/my-page',

  // ---- 用户中心 ----
  DASHBOARD: '/dashboard',
  UC_MESSAGES: '/dashboard/messages',
  UC_LEARNING: '/dashboard/learning',
  UC_ORDERS: '/dashboard/orders',
  UC_DEMANDS: '/dashboard/demands',
  UC_FAVORITES: '/dashboard/favorites',
  UC_REVIEWS: '/dashboard/reviews',
  UC_ALLIANCE_AMBASSADOR: '/dashboard/alliance/ambassador',
  UC_ALLIANCE_PARTNER: '/dashboard/alliance/partner',
  UC_ALLIANCE_721: '/dashboard/alliance/721',
  UC_ACCOUNT_INFO: '/dashboard/account/info',
  UC_ACCOUNT_BASE: '/dashboard/account/base',
  UC_ACCOUNT_VERIFY: '/dashboard/account/verify',
  UC_ACCOUNT_BIND: '/dashboard/account/bind',
  UC_ACCOUNT_SWITCH: '/dashboard/account/switch',

  // ---- 我的课程 ----
  UC_COURSES: '/dashboard/courses',
  UC_COURSES_CREATE: '/dashboard/courses/create',
  UC_COURSES_MANAGE: '/dashboard/courses/manage',

  // ---- 我的视频（录播课） ----
  VIDEOS: '/videos',
  UC_VIDEOS_CREATE: '/dashboard/videos/create',
  UC_VIDEOS_MANAGE: '/dashboard/videos/manage',

  // ---- 角色申请 ----
  UC_APPLY: '/dashboard/apply',
  UC_APPLY_SUCCESS: '/dashboard/apply/success',
} as const;
