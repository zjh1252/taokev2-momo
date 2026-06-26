import { apiGet } from '@/lib/http/client';
import { fetchCategoryCountMap } from '@/lib/category-counts';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import type {
  ApiResponse,
  TrainerDetail,
  TrainerListItem,
  PageResponse,
  CategoryTreeNode,
  RecommendedCourseItem,
  RecommendedTrainerItem,
  TrainerBook,
} from '../types';
import type { CourseListItem } from '@/features/course/api/types';
import { isPresentableRecommendedTrainer } from '../utils/recommended';
import type { VideoListItem } from '@/features/video/api/types';
import type { TrainerCase } from '@/features/trainer-case/api/types';
import type { TrainerHighlight } from '@/features/trainer-highlight/api/types';

function authHeaders(): Record<string, string> {
  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  return { Authorization: `Bearer ${tokenData?.accessToken || ''}` };
}

/**
 * 获取当前登录专家本人档案（需 TRAINER 角色）
 * <p>用于顶栏「我的主页」解析公开详情路径 {@code /trainers/{id}}。</p>
 */
export async function getMyTrainerProfile(): Promise<{ id: number; trainerCode?: string }> {
  const res = await apiGet<ApiResponse<{ id: number; trainerCode?: string }>>('/trainers/me', {
    headers: authHeaders(),
    silent: true,
  });
  return res.data;
}

/**
 * 获取专家公开详情
 */
export async function getTrainerDetail(id: number): Promise<TrainerDetail> {
  const res = await apiGet<ApiResponse<TrainerDetail>>(`/trainers/${id}`);
  return res.data;
}

/**
 * 专家列表查询参数
 */
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
  /** 擅长领域名称（多选用下划线连接，如 "经营战略_战略规划"） */
  field?: string;
  /** 擅长行业名称（多选用下划线连接） */
  industry?: string;
  /** 长驻省市名称 */
  region?: string;
}

/**
 * 获取专家公开列表（分页 + 筛选）
 */
export async function getTrainerList(
  params: TrainerListParams = {},
): Promise<PageResponse<TrainerListItem>> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.size) query.set('size', String(params.size));
  if (params.expertiseCategoryId) query.set('expertiseCategoryId', String(params.expertiseCategoryId));
  if (params.industryCategoryId) query.set('industryCategoryId', String(params.industryCategoryId));
  if (params.provinceId) query.set('provinceId', String(params.provinceId));
  if (params.cityId) query.set('cityId', String(params.cityId));
  if (params.keyword) query.set('keyword', params.keyword);
  if (params.sort) query.set('sort', params.sort);
  if (params.isTrusted) query.set('isTrusted', String(params.isTrusted));
  // SEO 名称参数（后端按名称匹配）
  if (params.field) query.set('field', params.field);
  if (params.industry) query.set('industry', params.industry);
  if (params.region) query.set('region', params.region);

  const qs = query.toString();
  const res = await apiGet<ApiResponse<PageResponse<TrainerListItem>>>(
    `/trainers${qs ? `?${qs}` : ''}`,
  );
  return res.data;
}

/**
 * 获取专家详情页推荐课程（仅已上架，按浏览量倒序）
 * @param trainerId 专家 ID
 * @param limit 返回条数上限（默认 10）
 */
export async function getRecommendedCourses(
  trainerId: number,
  limit = 10,
): Promise<RecommendedCourseItem[]> {
  const res = await apiGet<ApiResponse<RecommendedCourseItem[]>>(
    `/trainers/${trainerId}/recommended-courses?limit=${limit}`,
  );
  return res.data || [];
}

/**
 * 获取专家详情页推荐相关专家
 * <p>命中规则：与当前专家共享至少一个擅长领域或擅长行业，按推荐 + 评分倒序。</p>
 * @param trainerId 专家 ID
 * @param limit 返回条数上限（默认 6）
 */
export async function getRecommendedTrainers(
  trainerId: number,
  limit = 6,
): Promise<RecommendedTrainerItem[]> {
  const res = await apiGet<ApiResponse<RecommendedTrainerItem[]>>(
    `/trainers/${trainerId}/recommended-trainers?limit=${limit}`,
  );
  return res.data || [];
}

/**
 * 获取首页/列表页推荐专家（仅后台 isRecommended=1，过滤测试占位数据）
 */
export async function getTopRecommendedTrainers(limit = 9): Promise<TrainerListItem[]> {
  const fetchLimit = Math.max(limit * 3, 12);
  const res = await apiGet<ApiResponse<TrainerListItem[]>>(
    `/trainers/recommended?limit=${fetchLimit}`,
  );
  return (res.data || []).filter(isPresentableRecommendedTrainer).slice(0, limit);
}

/**
 * 全平台最近的已审核案例（专家列表页中部滚动展示）
 */
export interface RecentTrainerCase {
  id: number;
  trainerId: number;
  trainerUserId: number;
  trainerName: string;
  trainerAvatar: string | null;
  /** 专家综合评分（来自 user_trainers.score），前端列表展示「★ 4.5」 */
  trainerScore?: number | null;
  caseTitle: string;
  coverImage: string | null;
  industry: string | null;
  description: string | null;
  /** 培训日期，首页案例卡片展示「案例时间」 */
  trainingDate?: string | null;
}

export async function getRecentTrainerCases(limit = 10): Promise<RecentTrainerCase[]> {
  const res = await apiGet<ApiResponse<RecentTrainerCase[]>>(
    `/trainer-cases/recent?limit=${limit}`,
  );
  return res.data;
}

/** 专家擅长领域一级分类批量计数（底部分类导航） */
export async function getTrainerExpertiseCategoryCounts(): Promise<Record<number, number>> {
  return fetchCategoryCountMap('/trainers/expertise-category-counts');
}

/**
 * 获取分类树
 */
export async function getCategoryTree(type: string): Promise<CategoryTreeNode[]> {
  const res = await apiGet<ApiResponse<CategoryTreeNode[]>>(
    `/categories/tree?type=${encodeURIComponent(type)}`,
  );
  return res.data;
}

/* ==================== 专家详情页聚合接口 ==================== */

/**
 * 专家「主讲课程」 — 已上架课程，分页
 */
export async function getTrainerCourses(
  trainerId: number,
  page = 1,
  size = 20,
): Promise<PageResponse<CourseListItem>> {
  const qs = new URLSearchParams({ page: String(page), size: String(size) });
  const res = await apiGet<ApiResponse<PageResponse<CourseListItem>>>(
    `/trainers/${trainerId}/courses?${qs}`,
  );
  return res.data;
}

/**
 * 专家「录播课」 — 已上架视频，分页
 */
export async function getTrainerVideos(
  trainerId: number,
  page = 1,
  size = 20,
): Promise<PageResponse<VideoListItem>> {
  const qs = new URLSearchParams({ page: String(page), size: String(size) });
  const res = await apiGet<ApiResponse<PageResponse<VideoListItem>>>(
    `/trainers/${trainerId}/videos?${qs}`,
  );
  return res.data;
}

/**
 * 专家「授课案例」 — 已通过案例（公开）
 */
export async function getTrainerApprovedCases(trainerId: number): Promise<TrainerCase[]> {
  const res = await apiGet<ApiResponse<TrainerCase[]>>(`/trainers/${trainerId}/cases`);
  return res.data || [];
}

/**
 * 单个已审核案例详情 — 公开
 */
export async function getApprovedCaseDetail(caseId: number): Promise<TrainerCase> {
  const res = await apiGet<ApiResponse<TrainerCase>>(`/trainer-cases/${caseId}`);
  return res.data;
}

/**
 * 专家「精彩瞬间」 — 公开列表（已审核通过）
 */
export async function getTrainerApprovedHighlights(trainerId: number): Promise<TrainerHighlight[]> {
  const res = await apiGet<ApiResponse<TrainerHighlight[]>>(`/trainers/${trainerId}/highlights`);
  return res.data || [];
}

/**
 * 专家「著作」 — 公开列表
 */
export async function getTrainerBooks(trainerId: number): Promise<TrainerBook[]> {
  const res = await apiGet<ApiResponse<TrainerBook[]>>(`/trainers/${trainerId}/books`);
  return res.data || [];
}
