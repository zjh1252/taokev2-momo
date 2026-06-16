import { assertApiOk } from '@/lib/api-client';
import { queryOptions } from '@tanstack/react-query';
import {
  getCrawlSources,
  getCrawlJobs,
  getCrawledTrainers,
  getCrawledCourses,
  getCrawledTrainerDetail,
  getCrawledCourseDetail
} from './service';
import type {
  CrawlJobFilters,
  CrawledTrainerFilters,
  CrawledCourseFilters
} from './types';

export const crawlKeys = {
  all: ['crawl'] as const,
  sources: () => [...crawlKeys.all, 'sources'] as const,
  jobs: (filters: CrawlJobFilters) => [...crawlKeys.all, 'jobs', filters] as const,
  trainers: (filters: CrawledTrainerFilters) => [...crawlKeys.all, 'trainers', filters] as const,
  trainerDetail: (id: number) => [...crawlKeys.all, 'trainer-detail', id] as const,
  courses: (filters: CrawledCourseFilters) => [...crawlKeys.all, 'courses', filters] as const,
  courseDetail: (id: number) => [...crawlKeys.all, 'course-detail', id] as const
};

export function sourcesQueryOptions() {
  return queryOptions({
    queryKey: crawlKeys.sources(),
    queryFn: async () => assertApiOk(await getCrawlSources())
  });
}

export function crawlJobsQueryOptions(filters: CrawlJobFilters) {
  return queryOptions({
    queryKey: crawlKeys.jobs(filters),
    queryFn: async () => assertApiOk(await getCrawlJobs(filters))
  });
}

export function crawledTrainersQueryOptions(filters: CrawledTrainerFilters) {
  return queryOptions({
    queryKey: crawlKeys.trainers(filters),
    queryFn: async () => assertApiOk(await getCrawledTrainers(filters))
  });
}

export function crawledTrainerDetailQueryOptions(id: number) {
  return queryOptions({
    queryKey: crawlKeys.trainerDetail(id),
    queryFn: async () => assertApiOk(await getCrawledTrainerDetail(id))
  });
}

export function crawledCoursesQueryOptions(filters: CrawledCourseFilters) {
  return queryOptions({
    queryKey: crawlKeys.courses(filters),
    queryFn: async () => assertApiOk(await getCrawledCourses(filters))
  });
}

export function crawledCourseDetailQueryOptions(id: number) {
  return queryOptions({
    queryKey: crawlKeys.courseDetail(id),
    queryFn: async () => assertApiOk(await getCrawledCourseDetail(id))
  });
}
