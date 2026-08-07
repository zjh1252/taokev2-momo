import { apiGet, apiPost } from '@/lib/http/client';
import { fetchCategoryCountMap } from '@/lib/category-counts';
import type {
  ApiResponse,
  PageResponse,
  CourseListItem,
  CourseDetail,
  CategoryTreeNode,
} from './types';

export interface CourseListParams {
  page?: number;
  size?: number;
  /** 一级分类 ID 集合（多选） */
  categoryIds?: number[];
  /** 二级分类 ID 集合（多选） */
  subCategoryIds?: number[];
  type?: string;
  isOpen?: boolean;
  keyword?: string;
  sortBy?: string;
  /** 机构 ID 过滤（仅返回该机构发布的课程） */
  institutionId?: number;
  /** 开课省份 ID 集合（按开课计划过滤，多选） */
  provinceIds?: number[];
  /** 开课城市 ID 集合（按开课计划过滤，多选） */
  cityIds?: number[];
  /** 开课时间起（YYYY-MM-DD） */
  startTimeFrom?: string;
  /** 开课时间止（YYYY-MM-DD） */
  startTimeTo?: string;
  /** 时间快捷段：thisWeek / thisMonth / nextThreeMonths */
  timeQuick?: string;
  /** 最低价（含） */
  priceMin?: number;
  /** 最高价（含） */
  priceMax?: number;
  /** 1=仅看免费课程 */
  isFree?: number;
  /** 报名状态：ENROLLING / ENDED */
  enrollStatus?: string;
  /** 最低评分（3/4/5，培训宝 embed 筛选用） */
  minScore?: number;
  /** 内训课：主讲专家擅长行业 */
  trainerIndustryCategoryId?: number;
  /** 内训课：主讲专家省份 */
  trainerProvinceId?: number;
  /** 内训课：主讲专家城市 */
  trainerCityId?: number;
  /** 1=仅看信得过专家 */
  trainerIsTrusted?: number;
  /** 1=仅看独家/版权课讲师 */
  trainerHasCopyright?: number;
}

/**
 * 公开课程列表（分页 + 筛选）
 */
export async function getCourseList(
  params: CourseListParams = {},
): Promise<PageResponse<CourseListItem>> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.size) query.set('size', String(params.size));
  if (params.categoryIds && params.categoryIds.length > 0) {
    params.categoryIds.forEach((id) => query.append('categoryIds', String(id)));
  }
  if (params.subCategoryIds && params.subCategoryIds.length > 0) {
    params.subCategoryIds.forEach((id) => query.append('subCategoryIds', String(id)));
  }
  if (params.type) query.set('type', params.type);
  if (params.isOpen !== undefined) query.set('isOpen', String(params.isOpen));
  if (params.keyword) query.set('keyword', params.keyword);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.institutionId) query.set('institutionId', String(params.institutionId));
  if (params.provinceIds && params.provinceIds.length > 0) {
    params.provinceIds.forEach((id) => query.append('provinceIds', String(id)));
  }
  if (params.cityIds && params.cityIds.length > 0) {
    params.cityIds.forEach((id) => query.append('cityIds', String(id)));
  }
  if (params.startTimeFrom) query.set('startTimeFrom', params.startTimeFrom);
  if (params.startTimeTo) query.set('startTimeTo', params.startTimeTo);
  if (params.timeQuick) query.set('timeQuick', params.timeQuick);
  if (params.priceMin !== undefined && params.priceMin !== null) {
    query.set('priceMin', String(params.priceMin));
  }
  if (params.priceMax !== undefined && params.priceMax !== null) {
    query.set('priceMax', String(params.priceMax));
  }
  if (params.isFree !== undefined && params.isFree !== null) {
    query.set('isFree', String(params.isFree));
  }
  if (params.enrollStatus) query.set('enrollStatus', params.enrollStatus);
  if (params.minScore != null) query.set('minScore', String(params.minScore));
  if (params.trainerIndustryCategoryId) {
    query.set('trainerIndustryCategoryId', String(params.trainerIndustryCategoryId));
  }
  if (params.trainerProvinceId) {
    query.set('trainerProvinceId', String(params.trainerProvinceId));
  }
  if (params.trainerCityId) {
    query.set('trainerCityId', String(params.trainerCityId));
  }
  if (params.trainerIsTrusted !== undefined && params.trainerIsTrusted !== null) {
    query.set('trainerIsTrusted', String(params.trainerIsTrusted));
  }
  if (params.trainerHasCopyright !== undefined && params.trainerHasCopyright !== null) {
    query.set('trainerHasCopyright', String(params.trainerHasCopyright));
  }

  const qs = query.toString();
  const res = await apiGet<ApiResponse<PageResponse<CourseListItem>>>(
    `/courses${qs ? `?${qs}` : ''}`,
    { skipAuth: true },
  );
  return res.data;
}

export interface CourseCategoryCountParams {
  isOpen: boolean;
  cityIds?: number[];
}

/** 课程一级分类批量计数（频道底部分类导航） */
export async function getCourseCategoryCounts(
  params: CourseCategoryCountParams,
): Promise<Record<number, number>> {
  const query = new URLSearchParams();
  query.set('isOpen', String(params.isOpen));
  if (params.cityIds?.length) {
    params.cityIds.forEach((id) => query.append('cityIds', String(id)));
  }
  return fetchCategoryCountMap(`/courses/category-counts?${query.toString()}`);
}

/** 课程公开详情 */
export async function getCourseDetail(id: number): Promise<CourseDetail> {
  const res = await apiGet<ApiResponse<CourseDetail>>(`/courses/${id}`, {
    skipAuth: true,
    silent: true,
  });
  return res.data;
}

/** 查询当前用户是否已预约该课程 */
export async function getCourseReserveStatus(courseId: number): Promise<boolean> {
  const res = await apiGet<ApiResponse<{ reserved: boolean }>>(
    `/courses/${courseId}/reserve-status`,
  );
  return Boolean(res.data?.reserved);
}

/** 查询当前用户是否已购买/报名该课程 */
export async function getCourseEnrollmentStatus(courseId: number): Promise<boolean> {
  const res = await apiGet<ApiResponse<{ enrolled: boolean }>>(
    `/courses/${courseId}/enrollment-status`,
  );
  return Boolean(res.data?.enrolled);
}

/** 免费线上公开课预约 */
export async function reserveCourse(courseId: number): Promise<void> {
  await apiPost<ApiResponse<null>>(`/courses/${courseId}/reserves`);
}

/** 支付成功后触发整单购买通知（公开课/录播课等，与后端回调双保险） */
export async function reserveCourseAfterPay(
  courseId: number,
  orderNo: string,
): Promise<void> {
  await apiPost<ApiResponse<null>>('/courses/reserves/pay', { courseId, orderNo });
}

/**
 * 已支付订单补发全部商品购买站内信。
 * 优先走已稳定注册的 /courses/reserves/pay（整单补发）；
 * 若环境尚未部署该逻辑，再回退 /orders/{orderNo}/purchase-notify。
 */
export async function notifyOrderPurchase(orderNo: string): Promise<void> {
  try {
    await apiPost<ApiResponse<null>>('/courses/reserves/pay', { orderNo, courseId: 0 });
  } catch {
    await apiPost<ApiResponse<null>>(`/orders/${orderNo}/purchase-notify`);
  }
}

/**
 * 获取课程分类树
 */
export async function getCourseCategoryTree(): Promise<CategoryTreeNode[]> {
  const res = await apiGet<ApiResponse<CategoryTreeNode[]>>(
    `/categories/tree?type=COURSE_CATEGORY`,
    { skipAuth: true },
  );
  return res.data;
}

/**
 * 获取指定类型的分类树（通用）
 */
export async function getCategoryTree(
  type: 'TRAINER_EXPERTISE' | 'TRAINER_INDUSTRY' | 'COURSE_CATEGORY',
): Promise<CategoryTreeNode[]> {
  const res = await apiGet<ApiResponse<CategoryTreeNode[]>>(
    `/categories/tree?type=${type}`,
    { skipAuth: true },
  );
  return res.data;
}

/** 公开课报名提交（登录可选） */
export async function submitOpenCourseEnrollment(payload: {
  realName: string;
  companyName: string;
  email: string;
  companyPhone?: string;
  mobile?: string;
  courseId: number;
  planId: number;
}): Promise<number> {
  const res = await apiPost<ApiResponse<number>>('/open-course-enrollments', payload, {
    optionalAuth: true,
  });
  return res.data;
}

/** 内训课报名提交（登录可选） */
export async function submitInternalCourseEnrollment(payload: {
  realName: string;
  companyName: string;
  email: string;
  companyPhone?: string;
  mobile?: string;
  courseId: number;
}): Promise<number> {
  const res = await apiPost<ApiResponse<number>>('/internal-course-enrollments', payload, {
    optionalAuth: true,
  });
  return res.data;
}
