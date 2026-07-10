import { apiClient } from '@/lib/api-client';
import type {
  CrawledTrainerFilters,
  CrawledCourseFilters,
  CrawlJobFilters,
  CrawledTrainersResponse,
  CrawledTrainerDetailResponse,
  CrawledCoursesResponse,
  CrawledCourseDetailResponse,
  CrawlJobsResponse,
  CrawlSourcesResponse,
  TriggerCrawlResponse,
  SaveCrawlSourcePayload,
  CrawlSourceResponse,
  CrawledCourseEditPayload
} from './types';

// ==================== 参数构建 ====================

export function buildCrawledTrainerParams(filters: CrawledTrainerFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.size) params.set('size', String(filters.size));
  if (filters.source) params.set('source', filters.source);
  if (filters.reviewStatus) params.set('reviewStatus', filters.reviewStatus);
  if (filters.dedupStatus) params.set('dedupStatus', filters.dedupStatus);
  if (filters.keyword) params.set('keyword', filters.keyword);
  return params;
}

export function buildCrawledCourseParams(filters: CrawledCourseFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.size) params.set('size', String(filters.size));
  if (filters.source) params.set('source', filters.source);
  if (filters.reviewStatus) params.set('reviewStatus', filters.reviewStatus);
  if (filters.dedupStatus) params.set('dedupStatus', filters.dedupStatus);
  if (filters.keyword) params.set('keyword', filters.keyword);
  return params;
}

export function buildCrawlJobParams(filters: CrawlJobFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.size) params.set('size', String(filters.size));
  if (filters.source) params.set('source', filters.source);
  if (filters.dataType) params.set('dataType', filters.dataType);
  if (filters.status) params.set('status', filters.status);
  return params;
}

// ==================== 数据源 ====================

export async function getCrawlSources(): Promise<CrawlSourcesResponse> {
  return apiClient<CrawlSourcesResponse>('/crawl/sources');
}

export async function createCrawlSource(body: SaveCrawlSourcePayload): Promise<CrawlSourceResponse> {
  return apiClient<CrawlSourceResponse>('/crawl/sources', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function updateCrawlSource(
  id: number,
  body: SaveCrawlSourcePayload
): Promise<CrawlSourceResponse> {
  return apiClient<CrawlSourceResponse>(`/crawl/sources/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

export async function deleteCrawlSource(id: number) {
  return apiClient<{ code: number; message: string; data: null }>(`/crawl/sources/${id}`, {
    method: 'DELETE'
  });
}

// ==================== 爬虫任务 ====================

export async function triggerCrawl(body: {
  source: string;
  dataType: string;
  maxItems?: number;
  startUrl?: string;
}): Promise<TriggerCrawlResponse> {
  return apiClient<TriggerCrawlResponse>('/crawl/jobs', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function getCrawlJobs(filters: CrawlJobFilters): Promise<CrawlJobsResponse> {
  const params = buildCrawlJobParams(filters);
  return apiClient<CrawlJobsResponse>(`/crawl/jobs?${params.toString()}`);
}

export async function getCrawlJobDetail(id: number): Promise<TriggerCrawlResponse> {
  return apiClient<TriggerCrawlResponse>(`/crawl/jobs/${id}`);
}

export async function cancelCrawlJob(id: number) {
  return apiClient<{ code: number; message: string }>(`/crawl/jobs/${id}/cancel`, {
    method: 'PUT'
  });
}

// ==================== 爬取专家 ====================

export async function getCrawledTrainers(
  filters: CrawledTrainerFilters
): Promise<CrawledTrainersResponse> {
  const params = buildCrawledTrainerParams(filters);
  return apiClient<CrawledTrainersResponse>(`/crawl/trainers?${params.toString()}`);
}

export async function getCrawledTrainerDetail(id: number): Promise<CrawledTrainerDetailResponse> {
  return apiClient<CrawledTrainerDetailResponse>(`/crawl/trainers/${id}`);
}

export async function importCrawledTrainer(
  id: number,
  edits?: { name?: string; title?: string; bio?: string; forceImport?: boolean }
) {
  return apiClient<{ code: number; message: string; data: number }>(
    `/crawl/trainers/${id}/import`,
    {
      method: 'POST',
      body: edits ? JSON.stringify(edits) : undefined
    }
  );
}

export async function rejectCrawledTrainer(id: number, reason: string) {
  return apiClient<{ code: number; message: string }>(`/crawl/trainers/${id}/reject`, {
    method: 'PUT',
    body: JSON.stringify({ reason })
  });
}

// ==================== 爬取课程 ====================

export async function getCrawledCourses(
  filters: CrawledCourseFilters
): Promise<CrawledCoursesResponse> {
  const params = buildCrawledCourseParams(filters);
  return apiClient<CrawledCoursesResponse>(`/crawl/courses?${params.toString()}`);
}

export async function getCrawledCourseDetail(id: number): Promise<CrawledCourseDetailResponse> {
  return apiClient<CrawledCourseDetailResponse>(`/crawl/courses/${id}`);
}

export async function importCrawledCourse(id: number, edits?: CrawledCourseEditPayload) {
  return apiClient<{ code: number; message: string; data: number }>(`/crawl/courses/${id}/import`, {
    method: 'POST',
    body: edits ? JSON.stringify(edits) : undefined
  });
}

export async function updateCrawledCourse(
  id: number,
  edits: CrawledCourseEditPayload
): Promise<CrawledCourseDetailResponse> {
  return apiClient<CrawledCourseDetailResponse>(`/crawl/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(edits)
  });
}

export async function rejectCrawledCourse(id: number, reason: string) {
  return apiClient<{ code: number; message: string }>(`/crawl/courses/${id}/reject`, {
    method: 'PUT',
    body: JSON.stringify({ reason })
  });
}

export async function restoreCrawledCourse(id: number) {
  return apiClient<{ code: number; message: string }>(`/crawl/courses/${id}/restore`, {
    method: 'PUT'
  });
}
