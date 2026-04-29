import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/http/client';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import type {
  ApiResponse,
  PageResponse,
  CourseListItem,
  CourseDetail,
  SaveCourseRequest,
} from './types';

/**
 * 课程发布者 API（需登录）— 对应后端 CourseController
 *
 * @author Fangxinxin
 * @date 2026-04-07 10:30
 */

function authHeaders() {
  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  return { Authorization: `Bearer ${tokenData?.accessToken || ''}` };
}

export interface MyCourseListParams {
  status?: number;
  keyword?: string;
  page?: number;
  size?: number;
  /** 代管模式：指定专家 user_id 时，列出该专家旗下课程 */
  trainerUserId?: number;
}

/** 我的课程列表 */
export async function getMyCourses(
  params: MyCourseListParams = {},
): Promise<PageResponse<CourseListItem>> {
  const query = new URLSearchParams();
  if (params.status !== undefined) query.set('status', String(params.status));
  if (params.keyword) query.set('keyword', params.keyword);
  if (params.page) query.set('page', String(params.page));
  if (params.size) query.set('size', String(params.size));
  if (params.trainerUserId) query.set('trainerUserId', String(params.trainerUserId));
  const qs = query.toString();
  const res = await apiGet<ApiResponse<PageResponse<CourseListItem>>>(
    `/courses/me${qs ? `?${qs}` : ''}`,
    { headers: authHeaders() },
  );
  return res.data;
}

/** 我的课程详情 */
export async function getMyCourseDetail(id: number): Promise<CourseDetail> {
  const res = await apiGet<ApiResponse<CourseDetail>>(`/courses/me/${id}`, {
    headers: authHeaders(),
  });
  return res.data;
}

/** 创建课程（草稿）；trainerUserId 提供时以专家身份发布 */
export async function createCourse(
  data: SaveCourseRequest,
  trainerUserId?: number,
): Promise<CourseDetail> {
  const url = trainerUserId ? `/courses?trainerUserId=${trainerUserId}` : '/courses';
  const res = await apiPost<ApiResponse<CourseDetail>>(url, data, {
    headers: authHeaders(),
  });
  return res.data;
}

/** 编辑课程 */
export async function updateCourse(id: number, data: SaveCourseRequest): Promise<CourseDetail> {
  const res = await apiPut<ApiResponse<CourseDetail>>(`/courses/${id}`, data, {
    headers: authHeaders(),
  });
  return res.data;
}

/** 提交审核 */
export async function submitCourse(id: number): Promise<void> {
  await apiPut<ApiResponse<void>>(`/courses/${id}/submit`, undefined, {
    headers: authHeaders(),
  });
}

/** 下架课程 */
export async function unpublishCourse(id: number): Promise<void> {
  await apiPut<ApiResponse<void>>(`/courses/${id}/unpublish`, undefined, {
    headers: authHeaders(),
  });
}

/** 删除课程 */
export async function deleteCourse(id: number): Promise<void> {
  await apiDelete<ApiResponse<void>>(`/courses/${id}`, {
    headers: authHeaders(),
  });
}

/**
 * 上传图片（用于封面等）。
 *
 * <p>同时接受 {@code File} 和 {@code Blob}（裁剪后通常是 Blob），
 * 当传入 Blob 时会用 {@code filename} 作为附件文件名（默认 cover.jpg）。</p>
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
    headers: { Authorization: `Bearer ${storage.get<{ accessToken?: string }>(TOKEN_KEY)?.accessToken || ''}` },
    body: formData,
  });
  if (!resp.ok) throw new Error('上传失败');
  const json = await resp.json() as ApiResponse<{ url: string }>;
  return json.data.url;
}

/**
 * 上传课程资料文件（doc/docx/pdf）— 走通用 /uploads/files 接口。
 *
 * <p>本方法仅完成上传并返回文件可访问 URL，AI 解析逻辑由调用方后续接入。</p>
 */
export async function uploadCourseMaterial(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  const resp = await fetch(`${API_BASE_URL}/uploads/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${storage.get<{ accessToken?: string }>(TOKEN_KEY)?.accessToken || ''}`,
    },
    body: formData,
  });
  if (!resp.ok) throw new Error('上传失败');
  const json = (await resp.json()) as ApiResponse<{ url: string }>;
  return json.data.url;
}
