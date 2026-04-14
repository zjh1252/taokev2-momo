/** 搜索模块 — 前端类型定义 */

/** 后端统一响应包装 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/** 通用分页响应 */
export interface PageResponse<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

/** 搜索 Tab 类型 */
export type SearchTab = 'trainer' | 'openCourse' | 'innerCourse';

/** 搜索请求参数 */
export interface SearchParams {
  keyword?: string;
  docType?: string;
  courseType?: string[];
  categoryId?: number;
  subCategoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  durationDays?: number;
  provinceId?: number;
  cityId?: number;
  minExperienceYears?: number;
  expertiseCategoryId?: number;
  page?: number;
  size?: number;
}

/** 搜索结果条目（ES source map，按 docType 区分字段） */
export interface SearchResultItem {
  docId: string;
  docType: 'course' | 'trainer';
  id: number;
  createdAt: string;
  updatedAt: string;

  // 课程字段
  title?: string;
  type?: string;
  coverUrl?: string;
  intro?: string;
  audience?: string;
  highlights?: string;
  keywords?: string;
  durationDays?: number;
  hoursPerDay?: number;
  price?: number;
  originalPrice?: number;
  isFeatured?: number;
  isFree?: number;
  viewCount?: number;
  enrollmentCount?: number;
  score?: number;
  publishedAt?: string;
  trainerName?: string;
  categoryId?: number;
  categoryName?: string;
  subCategoryId?: number;
  subCategoryName?: string;

  // 专家字段
  name?: string;
  avatar?: string;
  bio?: string;
  goodAt?: string;
  specialties?: string;
  expertiseTags?: string;
  teachingStyle?: string;
  experienceYears?: number;
  teachingYears?: number;
  certLevel?: number;
  isSigned?: number;
  isRecommended?: number;
  approvedAt?: string;
  provinceId?: number;
  provinceName?: string;
  cityId?: number;
  cityName?: string;

  /** ES highlight 片段，key 为字段名，value 为带 <em> 标签的高亮文本 */
  _highlight?: Record<string, string>;
}
