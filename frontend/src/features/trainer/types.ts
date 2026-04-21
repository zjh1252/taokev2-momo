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
  avatar: string;
  title: string;
  gender: number;
  provinceId?: number;
  cityId?: number;
  provinceName?: string;
  cityName?: string;
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
  name: string;
  avatar: string;
  title: string;
  score: number;
  expertiseTags?: string;
  isTrusted: number;
  commentCount: number;
  viewCount: number;
  provinceId: number;
  cityId: number;
  provinceName?: string;
  cityName?: string;
  expertiseCategories: CategoryRef[];
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
}

/** 推荐相关专家项（专家详情页右侧栏） */
export interface RecommendedTrainerItem {
  id: number;
  name: string;
  title?: string;
  avatar?: string;
  score?: number;
  isRecommended?: number;
}

/** 专家著作（对应后端 TrainerBookResponse） */
export interface TrainerBook {
  id: number;
  trainerId: number;
  title: string;
  coverUrl?: string;
  publisher?: string;
  publishDate?: string;
  description?: string;
  buyUrl?: string;
  sortOrder: number;
}

/** 保存著作请求 */
export interface SaveTrainerBookRequest {
  title: string;
  coverUrl?: string;
  publisher?: string;
  publishDate?: string;
  description?: string;
  buyUrl?: string;
  sortOrder?: number;
}
