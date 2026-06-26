import http from '@/utils/request';

/** 分类完整树（TRAINER_EXPERTISE / TRAINER_INDUSTRY / COURSE_CATEGORY 等） */
export const getCategoryTree = (type) => http.get('/categories/tree', { type });

/** 分类直接子级 */
export const getCategoryChildren = (type, parentId = 0) =>
  http.get('/categories/children', { type, parentId });
