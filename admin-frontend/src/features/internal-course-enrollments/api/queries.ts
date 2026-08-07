import { queryOptions } from '@tanstack/react-query';
import {
  getInternalCourseEnrollments,
  getInternalCourseEnrollmentDetail,
} from './service';
import type { InternalCourseEnrollmentFilters } from './types';

export const internalCourseEnrollmentKeys = {
  all: ['internal-course-enrollments'] as const,
  list: (filters: InternalCourseEnrollmentFilters) =>
    [...internalCourseEnrollmentKeys.all, 'list', filters] as const,
  detail: (id: number) =>
    [...internalCourseEnrollmentKeys.all, 'detail', id] as const,
};

export const internalCourseEnrollmentsQueryOptions = (
  filters: InternalCourseEnrollmentFilters,
) =>
  queryOptions({
    queryKey: internalCourseEnrollmentKeys.list(filters),
    queryFn: () => getInternalCourseEnrollments(filters),
  });

export const internalCourseEnrollmentDetailQueryOptions = (id: number) =>
  queryOptions({
    queryKey: internalCourseEnrollmentKeys.detail(id),
    queryFn: () => getInternalCourseEnrollmentDetail(id),
  });
