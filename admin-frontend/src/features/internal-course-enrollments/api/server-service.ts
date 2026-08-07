import 'server-only';
import { serverFetch } from '@/lib/server-fetch';
import type {
  InternalCourseEnrollmentFilters,
  InternalCourseEnrollmentsResponse,
} from './types';
import { buildEnrollmentParams } from './service';

export async function getInternalCourseEnrollmentsFromServer(
  filters: InternalCourseEnrollmentFilters,
): Promise<InternalCourseEnrollmentsResponse> {
  const params = buildEnrollmentParams(filters);
  return serverFetch(
    `/admin/internal-course-enrollments?${params.toString()}`,
  ) as Promise<InternalCourseEnrollmentsResponse>;
}
