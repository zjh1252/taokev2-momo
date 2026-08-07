import { apiGet, apiPost, apiPut, apiDelete, authHeaders, getAccessToken } from '@/lib/http/client';
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

export interface MyVideoListParams {
  status?: number;
  keyword?: string;
  page?: number;
  size?: number;
  /** 代管模式：指定专家 user_id 时，列出该专家旗下视频 */
  trainerUserId?: number;
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
  if (params.trainerUserId) query.set('trainerUserId', String(params.trainerUserId));
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

export async function createVideo(
  data: SaveVideoRequest,
  trainerUserId?: number,
): Promise<VideoDetail> {
  const url = trainerUserId ? `/videos?trainerUserId=${trainerUserId}` : '/videos';
  const res = await apiPost<ApiResponse<VideoDetail>>(url, data, {
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

/**
 * 上传图片（用于封面等）。
 *
 * <p>同时接受 {@code File} 与 {@code Blob}（如视频抽帧得到的 PNG/JPEG），
 * 当传入 Blob 时使用 {@code filename} 作为附件文件名（默认 cover.jpg）。</p>
 */
export async function uploadImage(
  file: File | Blob,
  filename = 'cover.jpg',
): Promise<string> {
  const formData = new FormData();
  if (file instanceof File) {
    formData.append('file', file);
  } else {
    formData.append('file', file, filename);
  }
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  const resp = await fetch(`${API_BASE_URL}/uploads/images`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  if (!resp.ok) throw new Error('上传失败');
  const json = await resp.json() as ApiResponse<{ url: string }>;
  return json.data.url;
}

/** 视频文件上传限制 */
export const VIDEO_MAX_SIZE_MB = 500;
const VIDEO_ALLOWED_EXTENSIONS = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'mpeg', 'mpg'];

/** 视频文件上传格式提示文案（用于上传区说明与错误提示） */
export const VIDEO_UPLOAD_HINT = `最大不能超过 ${VIDEO_MAX_SIZE_MB}MB，支持 ${VIDEO_ALLOWED_EXTENSIONS.join('/')} 格式的文件`;

/**
 * 上传前本地校验视频文件大小与格式。
 *
 * @return null 表示通过，否则返回错误提示文案
 */
export function validateVideoFile(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!VIDEO_ALLOWED_EXTENSIONS.includes(ext)) {
    return `「${file.name}」格式不支持，仅支持 ${VIDEO_ALLOWED_EXTENSIONS.join('/')} 格式`;
  }
  if (file.size > VIDEO_MAX_SIZE_MB * 1024 * 1024) {
    return `「${file.name}」超过 ${VIDEO_MAX_SIZE_MB}MB，请压缩后再上传`;
  }
  return null;
}

/**
 * 上传视频文件（XHR 实现，支持实时上传进度回调）。
 *
 * @param onProgress 进度回调，参数为 0-100 的整数百分比
 */
export function uploadVideoFile(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  const token = getAccessToken();
  if (!token) {
    return Promise.reject(new Error('登录已过期，请重新登录'));
  }

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}/uploads/videos`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText) as ApiResponse<{ url: string }>;
          resolve(json.data.url);
        } catch {
          reject(new Error('视频上传失败'));
        }
      } else {
        let message = '视频上传失败';
        try {
          const body = JSON.parse(xhr.responseText) as { message?: string };
          if (body?.message) message = body.message;
        } catch { /* 响应体非 JSON，使用默认提示 */ }
        reject(new Error(message));
      }
    };
    xhr.onerror = () => reject(new Error('网络异常，视频上传失败'));
    xhr.send(formData);
  });
}
