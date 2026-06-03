/**
 * 培训需求模块 — 类型定义
 */

/** 需求状态 */
export enum DemandStatus {
  SUBMITTED = 1,
  PROCESSING = 2,
  MATCHED = 3,
  COMPLETED = 4,
  CANCELLED = 5,
}

export const DEMAND_STATUS_MAP: Record<number, { label: string; color: string }> = {
  [DemandStatus.SUBMITTED]: { label: '已提交', color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
  [DemandStatus.PROCESSING]: { label: '处理中', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  [DemandStatus.MATCHED]: { label: '已匹配', color: 'bg-purple-50 text-purple-600 border-purple-100' },
  [DemandStatus.COMPLETED]: { label: '已完成', color: 'bg-green-50 text-green-600 border-green-100' },
  [DemandStatus.CANCELLED]: { label: '已取消', color: 'bg-gray-50 text-gray-500 border-gray-100' },
};

/** 需求类型 */
export enum DemandType {
  DEFAULT = 'DEFAULT',
  TRAINING = 'TRAINING',
  CASE_CUSTOM = 'CASE_CUSTOM',
  INTERNAL_RESERVATION = 'INTERNAL_RESERVATION',
}

export const DEMAND_TYPE_MAP: Record<string, string> = {
  [DemandType.DEFAULT]: '默认',
  [DemandType.TRAINING]: '企业培训需求',
  [DemandType.CASE_CUSTOM]: '案例定制',
  [DemandType.INTERNAL_RESERVATION]: '内训课预约',
};

/** 培训形式 */
export const FORMAT_OPTIONS = [
  { value: 'ONLINE', label: '线上' },
  { value: 'OFFLINE', label: '线下' },
  { value: 'HYBRID', label: '混合' },
] as const;

/** 培训类型：公开课 / 内训课 */
export const COURSE_TYPE_OPTIONS = [
  { value: 'PUBLIC', label: '公开课' },
  { value: 'INTERNAL', label: '内训课' },
] as const;

export const COURSE_TYPE_MAP: Record<string, string> = {
  PUBLIC: '公开课',
  INTERNAL: '内训课',
};

/** 后端统一响应结构 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/** 分页响应 */
export interface PageResponse<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

/** 创建需求请求 */
export interface CreateDemandRequest {
  demandType: string;
  title?: string;
  trainingTopic?: string;
  traineeCount?: number;
  budgetMin?: number;
  budgetMax?: number;
  expectedStartDate?: string;
  format?: string;
  /** 培训类型：PUBLIC=公开课, INTERNAL=内训课 */
  courseType?: string;
  /** 意向专家（自由文本，选填） */
  intendedTrainer?: string;
  description?: string;
  sourceCaseId?: number;
  sourceCourseId?: number;
  contactName?: string;
  contactPhone?: string;
  provinceId?: number;
  cityId?: number;
  districtId?: number;
}

/** 需求列表项 */
export interface DemandListItem {
  id: number;
  demandType: string;
  demandTypeLabel: string;
  title: string;
  trainingTopic: string;
  status: number;
  statusLabel: string;
  budgetMin: number | null;
  budgetMax: number | null;
  format: string | null;
  /** 培训类型：PUBLIC=公开课, INTERNAL=内训课 */
  courseType?: string | null;
  traineeCount: number | null;
  createdAt: string;
  userId: number;
}

/** 跟进记录 */
export interface DemandFollowUp {
  id: number;
  demandId: number;
  operatorId: number;
  action: string;
  actionLabel: string;
  content: string | null;
  oldStatus: number | null;
  oldStatusLabel: string | null;
  newStatus: number | null;
  newStatusLabel: string | null;
  createdAt: string;
  operatorName: string | null;
}

/** 需求详情 */
export interface DemandDetail {
  id: number;
  userId: number;
  enterpriseId: number | null;
  demandType: string;
  demandTypeLabel: string;
  title: string;
  trainingTopic: string;
  traineeCount: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  expectedStartDate: string | null;
  format: string | null;
  formatLabel: string | null;
  /** 培训类型：PUBLIC=公开课, INTERNAL=内训课 */
  courseType: string | null;
  courseTypeLabel: string | null;
  /** 意向专家（自由文本） */
  intendedTrainer: string | null;
  description: string | null;
  sourceCaseId: number | null;
  sourceCourseId: number | null;
  contactName: string | null;
  contactPhone: string | null;
  provinceId: number | null;
  cityId: number | null;
  districtId: number | null;
  status: number;
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
  followUps: DemandFollowUp[];
}
