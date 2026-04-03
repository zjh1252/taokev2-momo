import { queryOptions } from '@tanstack/react-query';
import { getCourses, getCoursePlans } from './service';
import type { CourseFilters, PlanFilters } from './types';

export const courseKeys = {
  all: ['courses'] as const,
  list: (filters: CourseFilters) =>
    [...courseKeys.all, 'list', filters] as const,
  plans: (filters: PlanFilters) =>
    [...courseKeys.all, 'plans', filters] as const
};

export const coursesQueryOptions = (filters: CourseFilters) =>
  queryOptions({
    queryKey: courseKeys.list(filters),
    queryFn: () => getCourses(filters)
  });

export const plansQueryOptions = (filters: PlanFilters) =>
  queryOptions({
    queryKey: courseKeys.plans(filters),
    queryFn: () => getCoursePlans(filters)
  });
