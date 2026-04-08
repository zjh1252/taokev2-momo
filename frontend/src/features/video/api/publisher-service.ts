import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/http/client';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import type {
  ApiResponse,
  PageResponse,
  VideoListItem,
  VideoDetail,
  SaveVideoRequest,
  VideoSeries,
  VideoChapter,
  SaveVideoSeriesRequest,
  SaveVideoChapterRequest,
} from './types';

/**
 * 录播课发布者 API（需登录）— 对应后端 VideoController / VideoSeriesController / VideoChapterController
 */

function authHeaders() {
  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  return { Authorization: `Bearer ${tokenData?.accessToken || ''}` };
}

export interface MyVideoListParams {
  status?: number;
  keyword?: string;
  page?: number;
  size?: number;
}

// ==================== 录播课 CRUD ====================

export async function getMyVideos(
  params: MyVideoListParams = {},
): Promise<PageResponse<VideoListItem>> {
  const query = new URLSearchParams();
  if (params.status !== undefined) query.set('status', String(params.status));
  if (params.keyword) query.set('keyword', params.keyword);
  if (params.page) query.set('page', String(params.page));
  if (params.size) query.set('size', String(params.size));
  const qs = query.toString();
  const res = await apiGet<ApiResponse<PageResponse<VideoListItem>>>(
    `/videos/me${qs ? `?${qs}` : ''}`,
    { headers: authHeaders() },
  );
  return res.data;
}

export async function getMyVideoDetail(id: number): Promise<VideoDetail> {
  const res = await apiGet<ApiResponse<VideoDetail>>(`/videos/me/${id}`, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function createVideo(data: SaveVideoRequest): Promise<VideoDetail> {
  const res = await apiPost<ApiResponse<VideoDetail>>('/videos', data, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function updateVideo(id: number, data: SaveVideoRequest): Promise<VideoDetail> {
  const res = await apiPut<ApiResponse<VideoDetail>>(`/videos/${id}`, data, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function submitVideo(id: number): Promise<void> {
  await apiPut<ApiResponse<void>>(`/videos/${id}/submit`, undefined, {
    headers: authHeaders(),
  });
}

export async function unpublishVideo(id: number): Promise<void> {
  await apiPut<ApiResponse<void>>(`/videos/${id}/unpublish`, undefined, {
    headers: authHeaders(),
  });
}

export async function deleteVideo(id: number): Promise<void> {
  await apiDelete<ApiResponse<void>>(`/videos/${id}`, {
    headers: authHeaders(),
  });
}

// ==================== 系列管理 ====================

export async function getVideoSeriesList(videoId: number): Promise<VideoSeries[]> {
  const res = await apiGet<ApiResponse<VideoSeries[]>>(`/videos/${videoId}/series`, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function createVideoSeries(videoId: number, data: SaveVideoSeriesRequest): Promise<VideoSeries> {
  const res = await apiPost<ApiResponse<VideoSeries>>(`/videos/${videoId}/series`, data, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function updateVideoSeries(videoId: number, seriesId: number, data: SaveVideoSeriesRequest): Promise<VideoSeries> {
  const res = await apiPut<ApiResponse<VideoSeries>>(`/videos/${videoId}/series/${seriesId}`, data, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function deleteVideoSeries(videoId: number, seriesId: number): Promise<void> {
  await apiDelete<ApiResponse<void>>(`/videos/${videoId}/series/${seriesId}`, {
    headers: authHeaders(),
  });
}

// ==================== 章节管理 ====================

export async function getVideoChapterList(videoId: number, seriesId?: number): Promise<VideoChapter[]> {
  const query = seriesId ? `?seriesId=${seriesId}` : '';
  const res = await apiGet<ApiResponse<VideoChapter[]>>(`/videos/${videoId}/chapters${query}`, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function batchCreateVideoChapters(
  videoId: number,
  data: SaveVideoChapterRequest[],
): Promise<VideoChapter[]> {
  const res = await apiPost<ApiResponse<VideoChapter[]>>(`/videos/${videoId}/chapters/batch`, data, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function createVideoChapter(videoId: number, data: SaveVideoChapterRequest): Promise<VideoChapter> {
  const res = await apiPost<ApiResponse<VideoChapter>>(`/videos/${videoId}/chapters`, data, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function updateVideoChapter(videoId: number, chapterId: number, data: SaveVideoChapterRequest): Promise<VideoChapter> {
  const res = await apiPut<ApiResponse<VideoChapter>>(`/videos/${videoId}/chapters/${chapterId}`, data, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function deleteVideoChapter(videoId: number, chapterId: number): Promise<void> {
  await apiDelete<ApiResponse<void>>(`/videos/${videoId}/chapters/${chapterId}`, {
    headers: authHeaders(),
  });
}

/** 上传图片（用于封面等） */
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  const resp = await fetch(`${API_BASE_URL}/uploads/images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${storage.get<{ accessToken?: string }>(TOKEN_KEY)?.accessToken || ''}` },
    body: formData,
  });
  if (!resp.ok) throw new Error('上传失败');
  const json = await resp.json() as ApiResponse<{ url: string }>;
  return json.data.url;
}

/** 上传视频文件 */
export async function uploadVideoFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  const resp = await fetch(`${API_BASE_URL}/uploads/videos`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${storage.get<{ accessToken?: string }>(TOKEN_KEY)?.accessToken || ''}` },
    body: formData,
  });
  if (!resp.ok) throw new Error('视频上传失败');
  const json = await resp.json() as ApiResponse<{ url: string }>;
  return json.data.url;
}
