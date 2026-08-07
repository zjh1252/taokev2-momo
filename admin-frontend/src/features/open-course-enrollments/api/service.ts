import { apiClient } from '@/lib/api-client';
import type {
  OpenCourseEnrollmentFilters,
  OpenCourseEnrollmentsResponse,
  OpenCourseEnrollmentDetailResponse,
} from './types';

export function buildEnrollmentParams(
  filters: OpenCourseEnrollmentFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.status) params.set('status', filters.status);
  if (filters.keyword) params.set('keyword', filters.keyword);
  if (filters.createdFrom) params.set('createdFrom', filters.createdFrom);
  if (filters.createdTo) params.set('createdTo', filters.createdTo);
  return params;
}

export async function getOpenCourseEnrollments(
  filters: OpenCourseEnrollmentFilters,
): Promise<OpenCourseEnrollmentsResponse> {
  const params = buildEnrollmentParams(filters);
  return apiClient<OpenCourseEnrollmentsResponse>(
    `/open-course-enrollments?${params.toString()}`,
  );
}

export async function getOpenCourseEnrollmentDetail(
  id: number,
): Promise<OpenCourseEnrollmentDetailResponse> {
  return apiClient<OpenCourseEnrollmentDetailResponse>(
    `/open-course-enrollments/${id}`,
  );
}

export async function updateOpenCourseEnrollment(
  id: number,
  body: { status: number; adminRemark?: string | null },
) {
  return apiClient<{ code: number; message: string }>(
    `/open-course-enrollments/${id}`,
    { method: 'PUT', body: JSON.stringify(body) },
  );
}

/** 通过 BFF 下载 Excel */
export async function exportOpenCourseEnrollments(options: {
  ids?: number[];
  filters?: OpenCourseEnrollmentFilters;
}): Promise<void> {
  const params = buildEnrollmentParams(options.filters ?? {});
  if (options.ids?.length) {
    params.set('ids', options.ids.join(','));
  }
  const res = await fetch(
    `/api/open-course-enrollments/export?${params.toString()}`,
  );
  if (!res.ok) {
    throw new Error('导出失败');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '公开课报名.xlsx';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
