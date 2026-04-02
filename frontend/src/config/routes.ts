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
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  MY_COURSES: '/my-courses',
  MY_ORDERS: '/my-orders',
  MY_PAGE: '/my-page',
  CERTIFICATES: '/certificates',
} as const;
