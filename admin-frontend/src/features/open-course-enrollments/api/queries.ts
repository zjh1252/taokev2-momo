import { queryOptions } from '@tanstack/react-query';
import { getOpenCourseEnrollments, getOpenCourseEnrollmentDetail } from './service';
import type { OpenCourseEnrollmentFilters } from './types';

export const openCourseEnrollmentKeys = {
  all: ['open-course-enrollments'] as const,
  list: (filters: OpenCourseEnrollmentFilters) =>
    [...openCourseEnrollmentKeys.all, 'list', filters] as const,
  detail: (id: number) =>
    [...openCourseEnrollmentKeys.all, 'detail', id] as const,
};

export const openCourseEnrollmentsQueryOptions = (
  filters: OpenCourseEnrollmentFilters,
) =>
  queryOptions({
    queryKey: openCourseEnrollmentKeys.list(filters),
    queryFn: () => getOpenCourseEnrollments(filters),
  });

export const openCourseEnrollmentDetailQueryOptions = (id: number) =>
  queryOptions({
    queryKey: openCourseEnrollmentKeys.detail(id),
    queryFn: () => getOpenCourseEnrollmentDetail(id),
  });
