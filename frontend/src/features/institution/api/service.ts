import { apiGet } from '@/lib/http/client';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import type {
  ApiResponse,
  InstitutionDetail,
  InstitutionListItem,
  PageResponse,
} from '../types';
import type { CourseListItem } from '@/features/course/api/types';
import type { VideoListItem } from '@/features/video/api/types';

function authHeaders(): Record<string, string> {
  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  return { Authorization: `Bearer ${tokenData?.accessToken || ''}` };
}

/**
 * 获取当前登录机构本人信息（需 INSTITUTION 角色）
 * <p>用于顶栏「个人主页」解析公开详情路径 {@code /institutions/{id}}。</p>
 */
export async function getMyInstitutionProfile(): Promise<{ id: number }> {
  const res = await apiGet<ApiResponse<{ id: number }>>('/institutions/me', {
    headers: authHeaders(),
    silent: true,
  });
  return res.data;
}

/**
 * 机构列表查询参数
 */
export interface InstitutionListParams {
  page?: number;
  size?: number;
  keyword?: string;
  sort?: string;
  association?: boolean;
  /** 擅长领域（机构类别） */
  specialty?: string;
  /** 擅长行业 */
  industry?: string;
  provinceId?: number;
  cityId?: number;
  /** 最低星级评分 */
  minScore?: number;
}

/**
 * 获取机构公开列表（分页 + 多筛选）
 */
export async function getInstitutionList(
  params: InstitutionListParams = {},
): Promise<PageResponse<InstitutionListItem>> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.size) query.set('size', String(params.size));
  if (params.keyword) query.set('keyword', params.keyword);
  if (params.sort) query.set('sort', params.sort);
  if (params.association != null) query.set('association', String(params.association));
  if (params.specialty) query.set('specialty', params.specialty);
  if (params.industry) query.set('industry', params.industry);
  if (params.provinceId) query.set('provinceId', String(params.provinceId));
  if (params.cityId) query.set('cityId', String(params.cityId));
  if (params.minScore != null) query.set('minScore', String(params.minScore));

  const qs = query.toString();
  const res = await apiGet<ApiResponse<PageResponse<InstitutionListItem>>>(
    `/institutions${qs ? `?${qs}` : ''}`,
  );
  return res.data;
}

/** 机构筛选项聚合（擅长领域/擅长行业 计数） */
export interface InstitutionCategoryCount {
  name: string;
  count: number;
}
export interface InstitutionFacets {
  specialties: InstitutionCategoryCount[];
  industries: InstitutionCategoryCount[];
}

/** 获取机构筛选项聚合（领域/行业 token 计数） */
export async function getInstitutionFacets(): Promise<InstitutionFacets> {
  const res = await apiGet<ApiResponse<InstitutionFacets>>('/institutions/facets');
  return res.data;
}

/** 高分培训机构 */
export async function getTopRatedInstitutions(limit = 5): Promise<InstitutionListItem[]> {
  const res = await apiGet<ApiResponse<InstitutionListItem[]>>(`/institutions/top-rated?limit=${limit}`);
  return res.data || [];
}

/** 最新加入培训机构 */
export async function getNewestInstitutions(limit = 5): Promise<InstitutionListItem[]> {
  const res = await apiGet<ApiResponse<InstitutionListItem[]>>(`/institutions/newest?limit=${limit}`);
  return res.data || [];
}

/** 金牌推荐培训机构 */
export async function getRecommendedInstitutions(limit = 4): Promise<InstitutionListItem[]> {
  const res = await apiGet<ApiResponse<InstitutionListItem[]>>(`/institutions/recommended?limit=${limit}`);
  return res.data || [];
}

/** 本周活跃培训机构（最近 7 天有发课） */
export async function getWeeklyActiveInstitutions(limit = 5): Promise<InstitutionListItem[]> {
  const res = await apiGet<ApiResponse<InstitutionListItem[]>>(`/institutions/weekly-active?limit=${limit}`);
  return res.data || [];
}

/** 省份列表（用于机构搜索面板） */
export interface RegionItem {
  id: number;
  code: string;
  name: string;
}
export async function getProvinces(): Promise<RegionItem[]> {
  const res = await apiGet<ApiResponse<RegionItem[]>>('/regions/children');
  return res.data || [];
}

/**
 * 获取机构公开详情
 */
export async function getInstitutionDetail(id: number): Promise<InstitutionDetail> {
  const res = await apiGet<ApiResponse<InstitutionDetail>>(`/institutions/${id}`);
  return res.data;
}

/* ==================== 机构详情聚合接口 ==================== */

/**
 * 机构课程列表（分页，type=OPEN/INNER 区分公开课/内训课）
 */
export async function getInstitutionCourses(
  institutionId: number,
  type: 'OPEN' | 'INNER',
  page = 1,
  size = 10,
): Promise<PageResponse<CourseListItem>> {
  const qs = new URLSearchParams({ type, page: String(page), size: String(size) });
  const res = await apiGet<ApiResponse<PageResponse<CourseListItem>>>(
    `/institutions/${institutionId}/courses?${qs}`,
  );
  return res.data;
}

/**
 * 机构录播课列表（分页）
 */
export async function getInstitutionVideos(
  institutionId: number,
  page = 1,
  size = 10,
): Promise<PageResponse<VideoListItem>> {
  const qs = new URLSearchParams({ page: String(page), size: String(size) });
  const res = await apiGet<ApiResponse<PageResponse<VideoListItem>>>(
    `/institutions/${institutionId}/videos?${qs}`,
  );
  return res.data;
}

/**
 * 机构详情页右侧栏：机构公开课（最多 6 条）
 */
export async function getInstitutionSidebarOpenCourses(
  institutionId: number,
): Promise<CourseListItem[]> {
  const res = await apiGet<ApiResponse<CourseListItem[]>>(
    `/institutions/${institutionId}/sidebar/open-courses`,
  );
  return res.data;
}

/**
 * 机构详情页右侧栏：机构录播课（最多 6 条）
 */
export async function getInstitutionSidebarVideos(
  institutionId: number,
): Promise<VideoListItem[]> {
  const res = await apiGet<ApiResponse<VideoListItem[]>>(
    `/institutions/${institutionId}/sidebar/videos`,
  );
  return res.data;
}

/**
 * 全平台热门公开课（最多 5 条）
 */
export async function getHotOpenCourses(): Promise<CourseListItem[]> {
  const res = await apiGet<ApiResponse<CourseListItem[]>>('/opencourses/hot');
  return res.data;
}
