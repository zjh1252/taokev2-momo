import { apiGet } from '@/lib/http/client';
import type {
  ApiResponse,
  PageResponse,
  VideoListItem,
  VideoDetail,
  CategoryTreeNode,
} from './types';

export interface VideoListParams {
  page?: number;
  size?: number;
  categoryId?: number;
  subCategoryId?: number;
  keyword?: string;
  sortBy?: string;
}

/**
 * 公开录播课列表（分页 + 筛选）
 */
export async function getVideoList(
  params: VideoListParams = {},
): Promise<PageResponse<VideoListItem>> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.size) query.set('size', String(params.size));
  if (params.categoryId) query.set('categoryId', String(params.categoryId));
  if (params.subCategoryId) query.set('subCategoryId', String(params.subCategoryId));
  if (params.keyword) query.set('keyword', params.keyword);
  if (params.sortBy) query.set('sortBy', params.sortBy);

  const qs = query.toString();
  const res = await apiGet<ApiResponse<PageResponse<VideoListItem>>>(
    `/videos${qs ? `?${qs}` : ''}`,
  );
  return res.data;
}

/**
 * 录播课公开详情
 */
export async function getVideoDetail(id: number): Promise<VideoDetail> {
  const res = await apiGet<ApiResponse<VideoDetail>>(`/videos/${id}`);
  return res.data;
}

/**
 * 获取录播课分类树
 */
export async function getVideoCategoryTree(): Promise<CategoryTreeNode[]> {
  const res = await apiGet<ApiResponse<CategoryTreeNode[]>>(
    `/videos/categories`,
  );
  return res.data;
}
