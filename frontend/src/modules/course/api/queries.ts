// 课程查询（Server 侧数据获取）

import { apiGet } from '@/lib/http/client';
import type { Course } from '../types/course';

// TODO: 实现课程列表查询
export async function getCourseList(): Promise<Course[]> {
  // TODO: const res = await apiGet<ApiResponse<PageResponse<Course>>>('/api/courses');
  return [];
}

// TODO: 实现课程详情查询
export async function getCourseBySlug(slug: string): Promise<Course | null> {
  // TODO: const res = await apiGet<ApiResponse<Course>>(`/api/courses/${slug}`);
  return null;
}
