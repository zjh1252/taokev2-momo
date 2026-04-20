import { apiGet } from '@/lib/http/client';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import type {
  ApiResponse,
  InstitutionDetail,
  InstitutionListItem,
  PageResponse,
} from '../types';

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

  const qs = query.toString();
  const res = await apiGet<ApiResponse<PageResponse<InstitutionListItem>>>(
    `/institutions${qs ? `?${qs}` : ''}`,
  );
  return res.data;
}

/**
 * 获取机构公开详情
 */
export async function getInstitutionDetail(id: number): Promise<InstitutionDetail> {
  const res = await apiGet<ApiResponse<InstitutionDetail>>(`/institutions/${id}`);
  return res.data;
}
