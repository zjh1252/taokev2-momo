/** 培训宝讲师列表排序（默认 / 评价，支持升降序） */

export type PxbTrainerSortField = 'default' | 'score';

export type PxbTrainerSortBy = 'default' | 'default_asc' | 'score' | 'score_asc';

const FIELD_PRIMARY: Record<PxbTrainerSortField, PxbTrainerSortBy> = {
  default: 'default',
  score: 'score',
};

const FIELD_TOGGLE: Record<PxbTrainerSortField, [PxbTrainerSortBy, PxbTrainerSortBy]> = {
  default: ['default_asc', 'default'],
  score: ['score_asc', 'score'],
};

export const TRAINER_FIELD_SORT_BYS: Record<PxbTrainerSortField, PxbTrainerSortBy[]> = {
  default: ['default', 'default_asc'],
  score: ['score', 'score_asc'],
};

export function togglePxbTrainerSort(current: string, field: PxbTrainerSortField): PxbTrainerSortBy {
  const [a, b] = FIELD_TOGGLE[field];
  if (current === a) return b;
  if (current === b) return a;
  return FIELD_PRIMARY[field];
}

export function trainerSortLinkClass(sortBy: string, field: PxbTrainerSortField): string {
  const values = TRAINER_FIELD_SORT_BYS[field];
  if (!values.includes(sortBy as PxbTrainerSortBy)) return '';
  return sortBy.endsWith('_asc') ? 'sort-asc' : 'sort-desc';
}

export function mapTrainerSortByToApi(sortBy: string): string {
  if (!sortBy || sortBy === 'default') return 'default';
  return sortBy;
}

export const PXB_TRAINER_SORT_LABELS: Record<PxbTrainerSortField, string> = {
  default: '默认',
  score: '评价',
};
