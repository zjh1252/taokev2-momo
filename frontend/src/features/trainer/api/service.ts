import { apiGet } from '@/lib/http/client';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import type {
  ApiResponse,
  TrainerDetail,
  TrainerListItem,
  PageResponse,
  CategoryTreeNode,
} from '../types';

function authHeaders(): Record<string, string> {
  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  return { Authorization: `Bearer ${tokenData?.accessToken || ''}` };
}

/**
 * 获取当前登录专家本人档案（需 TRAINER 角色）
 * <p>用于顶栏「我的主页」解析公开详情路径 {@code /trainers/{id}}。</p>
 */
export async function getMyTrainerProfile(): Promise<{ id: number }> {
  const res = await apiGet<ApiResponse<{ id: number }>>('/trainers/me', {
    headers: authHeaders(),
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
  keyword?: string;
  sort?: string;
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
  if (params.keyword) query.set('keyword', params.keyword);
  if (params.sort) query.set('sort', params.sort);

  const qs = query.toString();
  const res = await apiGet<ApiResponse<PageResponse<TrainerListItem>>>(
    `/trainers${qs ? `?${qs}` : ''}`,
  );
  return res.data;
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
