/** 课程模块 — 前端类型定义（对齐后端 DTO） */

export type CourseType = 'INTERNAL' | 'OPEN_OFFLINE' | 'OPEN_ONLINE';

/** 课程状态（对应后端 CourseStatus 枚举） */
export const CourseStatus = {
  DRAFT: 0,
  PENDING: 1,
  PUBLISHED: 2,
  REJECTED: 3,
  UNPUBLISHED: 4,
} as const;

export type CourseStatusValue = (typeof CourseStatus)[keyof typeof CourseStatus];

export const CourseStatusLabelMap: Record<CourseStatusValue, string> = {
  [CourseStatus.DRAFT]: '草稿',
  [CourseStatus.PENDING]: '待审核',
  [CourseStatus.PUBLISHED]: '已上架',
  [CourseStatus.REJECTED]: '已驳回',
  [CourseStatus.UNPUBLISHED]: '已下架',
};

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
  provinceName?: string;
  cityName?: string;
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
  totalHours: number;
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
  /** 主讲专家 ID（内训课跳转讲师详情） */
  trainerId?: number;
  /** 主讲专家省份（内训课「讲师常驻地」） */
  trainerProvinceName?: string;
  /** 主讲专家城市（内训课「讲师常驻地」） */
  trainerCityName?: string;
  keywords: string;
  publishedAt: string;
  createdAt: string;
  /** 最近一场开课时间（公开课列表展示用） */
  nextPlanStartDate?: string;
  /** 最近一场开课城市名称（公开课列表展示用） */
  nextPlanCity?: string;
}

/** 创建/编辑课程请求体（对应后端 SaveCourseRequest） */
export interface SaveCourseRequest {
  title: string;
  /** hasPlan=1 时传 OPEN_OFFLINE/OPEN_ONLINE，否则可不传（后端默认 INTERNAL） */
  type?: CourseType;
  categoryId?: number;
  subCategoryId?: number;
  coverUrl?: string;
  intro?: string;
  /** true=保存草稿（仅校验标题），false/不传=提交审核 */
  draft?: boolean;
  /** 课程简介（短文本，可选；发布表单已移除该输入） */
  summary?: string;
  syllabus?: string;
  /** 课程资料文件 URL（doc/docx/pdf） */
  materialUrl?: string;
  /** 课程资料抽取后的全文（由 AI 解析流程产生，提交时回传供后端持久化） */
  materialText?: string;
  audience?: string;
  highlights?: string;
  durationDays?: number;
  /** 课程总时长（小时） */
  totalHours?: number;
  price?: number;
  originalPrice?: number;
  keywords?: string;
  isFeatured?: number;
  isFree?: number;
  /** 是否有公开课计划：0=否 1=是 */
  hasPlan?: number;
  plans?: CoursePlanDTO[];
}

/** 开课计划 DTO（创建/编辑时提交用） */
export interface CoursePlanDTO {
  id?: number;
  startTime: string;
  endTime: string;
  provinceId?: number;
  cityId?: number;
  districtId?: number;
  address?: string;
  onlineUrl?: string;
  sortOrder?: number;
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
  summary: string;
  syllabus: string;
  materialUrl: string;
  /** 课程资料抽取后的全文（由 AI 解析流程产生） */
  materialText: string;
  audience: string;
  highlights: string;
  durationDays: number;
  totalHours: number;
  price: number;
  originalPrice: number;
  keywords: string;
  trainerId: number;
  trainerName: string;
  isFeatured: number;
  isFree: number;
  hasPlan: number;
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
  /** 线下公开课结束日期 */
  courseOpenEndDate?: string | null;
  /** 到期是否前台自动隐藏：1=是 0=否 */
  isExpireHide?: number | null;
  /** 是否已过期（线下公开课且结束日期早于今日） */
  isOverdue?: boolean;
}

/**
 * AI 解析返回的可回填字段集合（对应后端 AiParseMaterialResultVO.ParsedFields）。
 *
 * <p>课程简介（summary）与课程大纲（syllabus）不在 AI 提取范围内，由用户自行撰写。</p>
 */
export interface AiParsedFields {
  title?: string;
  durationDays?: number;
  totalHours?: number;
  /** 一级分类 ID（后端 categoryName 匹配 COURSE_CATEGORY 后填充；匹配不上为 undefined） */
  categoryId?: number;
  /** AI 原始返回的分类名（调试 / 展示用） */
  categoryName?: string;
  /** 关键词，最多 3 个 */
  keywords?: string[];
  audience?: string;
  highlights?: string;
  intro?: string;
  syllabus?: string;
}

/** AI 解析课程资料接口的响应（对应后端 AiParseMaterialResultVO） */
export interface AiParseMaterialResult {
  /** 上传后文件 URL */
  materialUrl: string;
  /** 抽取后的全文（前端缓存，提交表单时回传） */
  materialText: string;
  /** AI 提取的结构化字段 */
  parsed: AiParsedFields;
}
