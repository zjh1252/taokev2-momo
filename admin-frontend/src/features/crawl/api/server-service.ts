import 'server-only';
import { serverFetch } from '@/lib/server-fetch';
import type {
  CrawlJob,
  CrawlSource,
  CrawledTrainersResponse,
  CrawledTrainerDetailResponse,
  CrawledCoursesResponse,
  CrawledCourseDetailResponse,
  CrawlJobsResponse,
  CrawlSourcesResponse,
  CrawledCourseDetail,
  CrawledTrainer,
  CrawledTrainerDetail,
  CrawledCourse,
  CrawledTrainerFilters,
  CrawledCourseFilters,
  CrawlJobFilters
} from './types';
import {
  buildCrawledTrainerParams,
  buildCrawledCourseParams,
  buildCrawlJobParams
} from './service';

export async function getCrawlSourcesFromServer(): Promise<CrawlSourcesResponse> {
  return serverFetch<CrawlSource[]>('/admin/crawl/sources');
}

export async function getCrawledTrainersFromServer(
  filters: CrawledTrainerFilters
): Promise<CrawledTrainersResponse> {
  const params = buildCrawledTrainerParams(filters);
  return serverFetch<{
    total: number;
    page: number;
    size: number;
    list: CrawledTrainer[];
  }>(`/admin/crawl/trainers?${params.toString()}`);
}

export async function getCrawledTrainerDetailFromServer(
  id: number
): Promise<CrawledTrainerDetailResponse> {
  return serverFetch<CrawledTrainerDetail>(`/admin/crawl/trainers/${id}`);
}

export async function getCrawledCoursesFromServer(
  filters: CrawledCourseFilters
): Promise<CrawledCoursesResponse> {
  const params = buildCrawledCourseParams(filters);
  return serverFetch<{
    total: number;
    page: number;
    size: number;
    list: CrawledCourse[];
  }>(`/admin/crawl/courses?${params.toString()}`);
}

export async function getCrawledCourseDetailFromServer(
  id: number
): Promise<CrawledCourseDetailResponse> {
  return serverFetch<CrawledCourseDetail>(`/admin/crawl/courses/${id}`);
}

export async function getCrawlJobsFromServer(
  filters: CrawlJobFilters
): Promise<CrawlJobsResponse> {
  const params = buildCrawlJobParams(filters);
  return serverFetch<{
    total: number;
    page: number;
    size: number;
    list: CrawlJob[];
  }>(`/admin/crawl/jobs?${params.toString()}`);
}
