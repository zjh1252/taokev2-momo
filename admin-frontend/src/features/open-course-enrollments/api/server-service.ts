import 'server-only';
import { serverFetch } from '@/lib/server-fetch';
import type {
  OpenCourseEnrollmentFilters,
  OpenCourseEnrollmentsResponse,
} from './types';
import { buildEnrollmentParams } from './service';

export async function getOpenCourseEnrollmentsFromServer(
  filters: OpenCourseEnrollmentFilters,
): Promise<OpenCourseEnrollmentsResponse> {
  const params = buildEnrollmentParams(filters);
  return serverFetch(
    `/admin/open-course-enrollments?${params.toString()}`,
  ) as Promise<OpenCourseEnrollmentsResponse>;
}
