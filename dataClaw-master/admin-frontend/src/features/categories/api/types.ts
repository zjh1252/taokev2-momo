export type CategoryNode = {
  id: number;
  parentId: number;
  name: string;
  level: number;
  sortOrder: number;
  isVisible: number;
  icon: string | null;
  description: string | null;
  children: CategoryNode[] | null;
};

export type SaveCategoryPayload = {
  type: string;
  parentId?: number;
  name: string;
  sortOrder?: number;
  isVisible?: number;
  icon?: string;
  description?: string;
};

export type UpdateCategoryPayload = {
  name?: string;
  sortOrder?: number;
  isVisible?: number;
  icon?: string;
  description?: string;
};

/** URL 路由参数 → 后端 type 映射 */
export const CATEGORY_TYPE_MAP: Record<string, string> = {
  'course-category': 'COURSE_CATEGORY',
  'trainer-expertise': 'TRAINER_EXPERTISE',
  'trainer-industry': 'TRAINER_INDUSTRY'
};

export const CATEGORY_TYPE_LABELS: Record<string, string> = {
  COURSE_CATEGORY: '课程分类',
  TRAINER_EXPERTISE: '专家擅长领域',
  TRAINER_INDUSTRY: '专家擅长行业'
};
