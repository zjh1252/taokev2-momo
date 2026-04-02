/** 课程模块 — 前端类型定义（对齐后端 DTO） */

export type CourseType = 'INTERNAL' | 'OPEN_OFFLINE' | 'OPEN_ONLINE';

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

/** 分类树节点 */
export interface CategoryTreeNode {
  id: number;
  name: string;
  level: number;
  sortOrder: number;
  icon?: string;
  children?: CategoryTreeNode[];
}

/** 公开课开课计划 */
export interface CoursePlan {
  id: number;
  startTime: string;
  endTime: string;
  provinceId: number;
  cityId: number;
  districtId: number;
  address: string;
  onlineUrl: string;
  sortOrder: number;
}

/** 课程列表项（对应后端 CourseListItemVO） */
export interface CourseListItem {
  id: number;
  title: string;
  type: CourseType;
  typeLabel: string;
  coverUrl: string;
  categoryId: number;
  categoryName: string;
  durationDays: number;
  hoursPerDay: number;
  price: number;
  originalPrice: number;
  isFeatured: number;
  isFree: number;
  status: number;
  statusLabel: string;
  viewCount: number;
  enrollmentCount: number;
  score: number;
  publisherType: string;
  publisherName: string;
  trainerName: string;
  keywords: string;
  publishedAt: string;
  createdAt: string;
}

/** 课程详情（对应后端 CourseDetailVO） */
export interface CourseDetail {
  id: number;
  title: string;
  type: CourseType;
  typeLabel: string;
  publisherId: number;
  publisherType: string;
  publisherName: string;
  categoryId: number;
  categoryName: string;
  subCategoryId: number;
  subCategoryName: string;
  coverUrl: string;
  intro: string;
  syllabus: string;
  audience: string;
  highlights: string;
  durationDays: number;
  hoursPerDay: number;
  price: number;
  originalPrice: number;
  keywords: string;
  trainerId: number;
  trainerName: string;
  isFeatured: number;
  isFree: number;
  status: number;
  statusLabel: string;
  rejectReason: string;
  sortOrder: number;
  viewCount: number;
  enrollmentCount: number;
  score: number;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  plans: CoursePlan[];
}
