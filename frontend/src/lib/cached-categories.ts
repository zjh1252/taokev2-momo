import { cache } from 'react';
import { serverApiGet } from '@/lib/server-api';
import type { ApiResponse, CategoryTreeNode } from '@/features/course/api/types';

async function fetchCategoryTree(type: string): Promise<CategoryTreeNode[]> {
  const res = await serverApiGet<ApiResponse<CategoryTreeNode[]>>(
    `/categories/tree?type=${type}`,
  );
  return res.data ?? [];
}

/** 同请求内 dedupe 分类树 fetch（避免列表页重复拉树） */
export const getCachedCourseCategoryTree = cache(() =>
  fetchCategoryTree('COURSE_CATEGORY').catch(() => []),
);

export const getCachedTrainerExpertiseTree = cache(() =>
  fetchCategoryTree('TRAINER_EXPERTISE').catch(() => []),
);

export const getCachedTrainerIndustryTree = cache(() =>
  fetchCategoryTree('TRAINER_INDUSTRY').catch(() => []),
);

export const getCachedVideoCategoryTree = cache(() =>
  serverApiGet<ApiResponse<CategoryTreeNode[]>>('/videos/categories')
    .then((res) => res.data ?? [])
    .catch(() => []),
);
