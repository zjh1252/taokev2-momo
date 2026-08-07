import { apiGet, apiPost } from '@/lib/http/client';
import { fetchCategoryCountMap } from '@/lib/category-counts';
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
  VideoComment,
  SubmitVideoCommentPayload,
  VideoSeriesPackage,
  VideoPurchaseOptions,
  VideoChapterPlaybackUrl,
} from './types';
import type { CourseListItem } from '@/features/course/api/types';

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
  /** 机构 ID 过滤（仅返回该机构发布的录播课） */
  institutionId?: number;
  /** 1=仅精品推荐录播课 */
  isFeatured?: number;
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
  if (params.institutionId) query.set('institutionId', String(params.institutionId));
  if (params.isFeatured != null) query.set('isFeatured', String(params.isFeatured));

  const qs = query.toString();
  const res = await apiGet<ApiResponse<PageResponse<VideoListItem>>>(
    `/videos${qs ? `?${qs}` : ''}`,
    { skipAuth: true },
  );
  return res.data;
}

/**
 * 录播课公开详情
 */
export async function getVideoDetail(id: number): Promise<VideoDetail> {
  const res = await apiGet<ApiResponse<VideoDetail>>(`/videos/${id}`, {
    skipAuth: true,
  });
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

/** 签发第三方章节 iframe 播放地址（eceibs / kuaike，需登录） */
export async function getChapterPlaybackUrl(
  videoId: number,
  chapterId: number,
): Promise<VideoChapterPlaybackUrl> {
  const res = await apiGet<ApiResponse<VideoChapterPlaybackUrl>>(
    `/videos/${videoId}/chapters/${chapterId}/playback-url`,
    { headers: authHeaders(), silent: true },
  );
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

/** 录播课一级分类批量计数（频道底部分类导航） */
export async function getVideoCategoryCounts(): Promise<Record<number, number>> {
  return fetchCategoryCountMap('/videos/category-counts');
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

/** 录播课相关面授课 */
export async function getVideoRelatedCourses(videoId: number): Promise<CourseListItem[]> {
  const res = await apiGet<ApiResponse<CourseListItem[]>>(
    `/videos/${videoId}/related-courses`,
  );
  return res.data;
}

/** 系列介绍 — 视频包内录播课列表 */
export async function getVideoSeriesPackage(
  videoId: number,
): Promise<VideoSeriesPackage | null> {
  const res = await apiGet<ApiResponse<VideoSeriesPackage | null>>(
    `/videos/${videoId}/series-videos`,
  );
  return res.data;
}

/** 录播课购买选项 */
export async function getVideoPurchaseOptions(
  videoId: number,
): Promise<VideoPurchaseOptions | null> {
  const res = await apiGet<ApiResponse<VideoPurchaseOptions | null>>(
    `/videos/${videoId}/purchase-options`,
  );
  return res.data;
}

/** 录播课评论列表 */
export async function getVideoComments(
  videoId: number,
  page = 1,
  size = 10,
): Promise<PageResponse<VideoComment>> {
  const res = await apiGet<ApiResponse<PageResponse<VideoComment>>>(
    `/videos/${videoId}/comments?page=${page}&size=${size}`,
  );
  return res.data;
}

/** 发表录播课评论（需登录） */
export async function submitVideoComment(
  videoId: number,
  payload: SubmitVideoCommentPayload,
): Promise<number> {
  const res = await apiPost<ApiResponse<number>>(`/videos/${videoId}/comments`, payload, {
    headers: authHeaders(),
  });
  return res.data;
}
