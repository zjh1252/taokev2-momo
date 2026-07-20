/** 专家模块 — 前端类型定义 */

export interface CategoryRef {
  id: number;
  categoryId: number;
  sortOrder: number;
  categoryName: string;
}

export interface CategoryTreeNode {
  id: number;
  name: string;
  level: number;
  sortOrder: number;
  icon?: string;
  children?: CategoryTreeNode[];
}

/** 专家公开列表查询参数 */
export interface TrainerListParams {
  page?: number;
  size?: number;
  expertiseCategoryId?: number;
  industryCategoryId?: number;
  provinceId?: number;
  cityId?: number;
  keyword?: string;
  sort?: string;
  /** 质量承诺：1=仅显示信得过专家 */
  isTrusted?: number;
  /** 是否回填课程数量与标题 */
  includeCourse?: boolean;
  /** 擅长领域名称（多选用下划线连接，如 "经营战略_战略规划"） */
  field?: string;
  /** 擅长行业名称（多选用下划线连接） */
  industry?: string;
  /** 长驻省市名称 */
  region?: string;
}

export interface TrainerEducation {
  id?: number;
  schoolName: string;
  major?: string;
  degree?: string;
  startDate: string;
  endDate?: string;
  isGraduated: number;
  sortOrder: number;
}

export interface TrainerWorkExperience {
  id?: number;
  companyName: string;
  position?: string;
  startDate: string;
  endDate?: string;
  jobDescription?: string;
  sortOrder: number;
}

export interface TrainerHonor {
  id?: number;
  honorName: string;
  honorImage?: string;
  issuingAuthority?: string;
  issuedAt?: string;
  description?: string;
  sortOrder: number;
}

/** 专家公开详情（对应后端 TrainerPublicResponse） */
export interface TrainerDetail {
  id: number;
  /** 平台用户 ID：收藏/互动状态/留言等与后端 TRAINER 维度一致 */
  userId: number;
  trainerCode?: string;
  name: string;
  /** 授课姓名（对外展示，可与 name 不同） */
  teachingName?: string;
  avatar: string;
  /** 素材库默认头像；主头像加载失败时回退 */
  avatarFallback?: string;
  title: string;
  gender: number;
  provinceId?: number;
  cityId?: number;
  provinceName?: string;
  cityName?: string;
  /** 一句话介绍 */
  oneLineIntro?: string;
  bio?: string;
  intro?: string;
  background?: string;
  /** 部分客户（长文本，单行展示） */
  partialClients?: string;
  goodAt?: string;
  specialties?: string;
  expertiseTags?: string;
  teachingStyle?: string;
  experienceYears?: number;
  teachingYears?: number;
  backgroundImage?: string;
  certLevel: number;
  isSigned: number;
  isTrusted: number;
  isRecommended: number;
  hasCopyrightCourse: number;
  score: number;
  viewCount: number;
  consultationCount: number;
  commentCount: number;
  educations: TrainerEducation[];
  workExperiences: TrainerWorkExperience[];
  honors: TrainerHonor[];
  expertiseCategories: CategoryRef[];
  industryCategories: CategoryRef[];
}

/** 专家列表项（对应后端 TrainerListItemResponse） */
export interface TrainerListItem {
  id: number;
  userId?: number;
  name: string;
  teachingName?: string;
  avatar: string;
  /** 素材库默认头像；主头像加载失败时回退 */
  avatarFallback?: string;
  title: string;
  oneLineIntro?: string;
  score: number;
  expertiseTags?: string;
  /** 是否后台推荐位：0=否，1=是 */
  isRecommended?: number;
  isTrusted: number;
  /** 淘课价（列表） */
  taokePrice?: number;
  /** 已上架课程数 */
  courseCount?: number;
  /** 课程标题（按浏览量降序） */
  courseTitles?: string[];
  commentCount: number;
  viewCount: number;
  provinceId: number;
  cityId: number;
  provinceName?: string;
  cityName?: string;
  expertiseCategories: CategoryRef[];
  industryCategories?: CategoryRef[];
}

/** 通用分页响应 */
export interface PageResponse<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

/** 后端统一响应包装 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// ==================== Mock 用类型 ====================

export interface MockCourse {
  id: number;
  type: 'copyright' | 'internal';
  title: string;
  target: string;
  duration: string;
  description: string;
}

export interface MockCase {
  id: number;
  title: string;
  description: string;
  image: string;
  industry?: string;
  course?: string;
}

export interface MockClip {
  id: number;
  type: 'video' | 'article';
  title: string;
  image: string;
  duration?: string;
  price?: string;
  lessons?: string;
}

export interface MockReview {
  id: number;
  username: string;
  role: string;
  rating: number;
  courseName: string;
  content: string;
  date: string;
  company: string;
  hasReply: boolean;
  replyContent?: string;
  image?: string;
  helpfulCount: number;
}

export interface MockBook {
  id: number;
  title: string;
  image: string;
  publisher: string;
  price: number;
}

export interface MockRelatedTrainer {
  id: number;
  name: string;
  title: string;
  avatar: string;
  score: number;
}

/** 推荐课程项（专家详情页右侧栏） */
export interface RecommendedCourseItem {
  id: number;
  title: string;
  coverUrl?: string;
  viewCount?: number;
  type?: string;
}

/** 推荐相关专家项（专家详情页右侧栏） */
export interface RecommendedTrainerItem {
  id: number;
  name: string;
  teachingName?: string;
  title?: string;
  avatar?: string;
  score?: number;
  isRecommended?: number;
  oneLineIntro?: string;
}

/** 专家著作（对应后端 TrainerBookResponse，公开列表仅返回已通过项） */
export interface TrainerBook {
  id: number;
  trainerId: number;
  title: string;
  authorName?: string;
  coverUrl?: string;
  publisher?: string;
  publishDate?: string;
  description?: string;
  buyUrl?: string;
  sortOrder: number;
  status?: number;
  rejectReason?: string | null;
  reviewedAt?: string | null;
}

/** 保存著作请求（与后端 SaveTrainerBookRequest 对齐） */
export interface SaveTrainerBookRequest {
  title: string;
  authorName?: string;
  coverUrl?: string;
  publisher?: string;
  publishDate?: string;
  description?: string;
  buyUrl?: string;
  sortOrder?: number;
}
