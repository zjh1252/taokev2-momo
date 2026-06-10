import { apiGet } from '@/lib/http/client';
import { fetchCategoryCountMap } from '@/lib/category-counts';
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
  /** 擅长领域一级分类 ID */
  expertiseCategoryId?: number;
}

/**
 * 获取机构公开列表（分页 + 搜索）
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
  if (params.expertiseCategoryId) {
    query.set('expertiseCategoryId', String(params.expertiseCategoryId));
  }

  const qs = query.toString();
  const res = await apiGet<ApiResponse<PageResponse<InstitutionListItem>>>(
    `/institutions${qs ? `?${qs}` : ''}`,
  );
  return res.data;
}

/** 机构擅长领域一级分类批量计数（侧栏分类导航） */
export async function getInstitutionExpertiseCategoryCounts(
  association?: boolean,
): Promise<Record<number, number>> {
  const query = new URLSearchParams();
  if (association != null) {
    query.set('association', String(association));
  }
  const qs = query.toString();
  return fetchCategoryCountMap(`/institutions/expertise-category-counts${qs ? `?${qs}` : ''}`);
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
