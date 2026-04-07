import { apiGet } from '@/lib/http/client';
import type {
  ApiResponse,
  InstitutionDetail,
  InstitutionListItem,
  PageResponse,
} from '../types';

/**
 * 机构列表查询参数
 */
export interface InstitutionListParams {
  page?: number;
  size?: number;
  keyword?: string;
  sort?: string;
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
