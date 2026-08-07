import { apiGet, apiPost, apiPut, apiDelete, authHeaders } from '@/lib/http/client';
import type {
  ApiResponse,
  PageResponse,
  CourseListItem,
  CourseDetail,
  SaveCourseRequest,
  AiParseMaterialResult,
} from './types';

/**
 * 课程发布者 API（需登录）— 对应后端 CourseController
 *
 * @author Fangxinxin
 * @date 2026-04-07 10:30
 */

export interface MyCourseListParams {
  status?: number;
  keyword?: string;
  page?: number;
  size?: number;
  /** 代管模式：指定专家 user_id 时，列出该专家旗下课程 */
  trainerUserId?: number;
  /** 经纪人代经纪公司：指定经纪公司 user_id 时，列出该经纪公司发布的课程 */
  enterpriseAgentUserId?: number;
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
  if (params.enterpriseAgentUserId) {
    query.set('enterpriseAgentUserId', String(params.enterpriseAgentUserId));
  }
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

/**
 * 创建课程。
 *
 * <p>trainerUserId 提供时以专家身份代发；enterpriseAgentUserId 提供时经纪人代经纪公司发布；
 * data.draft=true 时存为草稿，否则创建即提交审核。</p>
 */
export async function createCourse(
  data: SaveCourseRequest,
  trainerUserId?: number,
  enterpriseAgentUserId?: number,
): Promise<CourseDetail> {
  const query = new URLSearchParams();
  if (trainerUserId) query.set('trainerUserId', String(trainerUserId));
  else if (enterpriseAgentUserId) query.set('enterpriseAgentUserId', String(enterpriseAgentUserId));
  const qs = query.toString();
  const res = await apiPost<ApiResponse<CourseDetail>>(`/courses${qs ? `?${qs}` : ''}`, data, {
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

/** 撤回审核（待审核 → 草稿） */
export async function withdrawCourse(id: number): Promise<void> {
  await apiPut<ApiResponse<void>>(`/courses/${id}/withdraw`, undefined, {
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
    headers: authHeaders(),
    body: formData,
  });
  if (!resp.ok) throw new Error('上传失败');
  const json = await resp.json() as ApiResponse<{ url: string }>;
  return json.data.url;
}

/**
 * 上传课程资料文件（doc/docx/pdf）— 走通用 /uploads/files 接口。
 *
 * <p>本方法仅完成上传并返回文件可访问 URL，AI 解析逻辑由 {@link parseCourseMaterial} 提供。</p>
 */
export async function uploadCourseMaterial(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  const resp = await fetch(`${API_BASE_URL}/uploads/files`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  if (!resp.ok) throw new Error('上传失败');
  const json = (await resp.json()) as ApiResponse<{ url: string }>;
  return json.data.url;
}

/**
 * AI 解析课程资料：上传 doc/docx/pdf，后端抽取全文并调用 LLM 提取结构化字段。
 *
 * <p>错误处理：</p>
 * <ul>
 *   <li>HTTP 503（{@code AI_NOT_ENABLED}）→ 抛出包含 {@code AI_NOT_ENABLED} 标记的 Error，
 *       供调用方区分「能力未启用」和普通失败</li>
 *   <li>其他非 2xx → 抛出包含后端 message 的 Error</li>
 * </ul>
 */
export async function parseCourseMaterial(file: File): Promise<AiParseMaterialResult> {
  const formData = new FormData();
  formData.append('file', file);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  const resp = await fetch(`${API_BASE_URL}/courses/ai/parse-material`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  if (!resp.ok) {
    let message = '解析失败';
    try {
      const errJson = (await resp.json()) as { code?: number; message?: string };
      if (errJson?.message) message = errJson.message;
      if (errJson?.code === 90030) {
        const e = new Error(errJson?.message || 'AI 能力暂未启用');
        (e as Error & { code?: string }).code = 'AI_NOT_ENABLED';
        throw e;
      }
    } catch (parseErr) {
      if ((parseErr as Error & { code?: string })?.code === 'AI_NOT_ENABLED') throw parseErr;
    }
    throw new Error(message);
  }
  const json = (await resp.json()) as ApiResponse<AiParseMaterialResult>;
  return json.data;
}
