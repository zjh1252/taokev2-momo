import { apiGet, apiPost } from '@/lib/http/client';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import type {
  ApiResponse,
  PageResponse,
  VideoListItem,
  VideoDetail,
  VideoAccessInfo,
  VideoProgressInfo,
  CategoryTreeNode,
} from './types';

function authHeaders() {
  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  return { Authorization: `Bearer ${tokenData?.accessToken || ''}` };
}

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
 * <p>TODO: 依赖后端 {@code GET /videos} 仅返回已上架；当前后端测试阶段会返回全部状态，上线前需与后端对齐。</p>
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
 * 检查录播课访问权限（需登录）
 */
export async function getVideoAccess(id: number): Promise<VideoAccessInfo> {
  const res = await apiGet<ApiResponse<VideoAccessInfo>>(`/videos/${id}/access`, {
    headers: authHeaders(),
    silent: true,
  });
  return res.data;
}

/**
 * 获取学习进度（需登录）
 */
export async function getVideoProgress(videoId: number): Promise<VideoProgressInfo> {
  const res = await apiGet<ApiResponse<VideoProgressInfo>>(`/videos/${videoId}/progress`, {
    headers: authHeaders(),
    silent: true,
  });
  return res.data;
}

/**
 * 上报播放进度（需登录）
 */
export async function updateVideoProgress(
  videoId: number,
  data: { chapterId: number; watchDuration: number; chapterDuration: number },
): Promise<void> {
  await apiPost<ApiResponse<void>>(`/videos/${videoId}/progress`, data, {
    headers: authHeaders(),
    silent: true,
  });
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
