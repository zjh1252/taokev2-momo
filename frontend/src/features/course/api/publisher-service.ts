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

/** 创建课程（草稿） */
export async function createCourse(data: SaveCourseRequest): Promise<CourseDetail> {
  const res = await apiPost<ApiResponse<CourseDetail>>('/courses', data, {
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
