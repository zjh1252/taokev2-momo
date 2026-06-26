/** 培训宝机构列表排序（默认 / 人气，支持升降序） */

export type PxbInstitutionSortField = 'default' | 'popularity';

export type PxbInstitutionSortBy =
  | 'default'
  | 'default_asc'
  | 'popularity'
  | 'popularity_asc';

const FIELD_PRIMARY: Record<PxbInstitutionSortField, PxbInstitutionSortBy> = {
  default: 'default',
  popularity: 'popularity',
};

const FIELD_TOGGLE: Record<PxbInstitutionSortField, [PxbInstitutionSortBy, PxbInstitutionSortBy]> = {
  default: ['default_asc', 'default'],
  popularity: ['popularity_asc', 'popularity'],
};

export const INSTITUTION_FIELD_SORT_BYS: Record<PxbInstitutionSortField, PxbInstitutionSortBy[]> = {
  default: ['default', 'default_asc'],
  popularity: ['popularity', 'popularity_asc'],
};

export function togglePxbInstitutionSort(
  current: string,
  field: PxbInstitutionSortField,
): PxbInstitutionSortBy {
  const [a, b] = FIELD_TOGGLE[field];
  if (current === a) return b;
  if (current === b) return a;
  return FIELD_PRIMARY[field];
}

export function institutionSortLinkClass(sortBy: string, field: PxbInstitutionSortField): string {
  const values = INSTITUTION_FIELD_SORT_BYS[field];
  if (!values.includes(sortBy as PxbInstitutionSortBy)) return '';
  return sortBy.endsWith('_asc') ? 'sort-asc' : 'sort-desc';
}

export function mapInstitutionSortByToApi(sortBy: string): string {
  if (!sortBy || sortBy === 'default') return 'default';
  return sortBy;
}

export const PXB_INSTITUTION_SORT_LABELS: Record<PxbInstitutionSortField, string> = {
  default: '默认排序',
  popularity: '机构人气',
};

/** embed 列表地址栏基准路径（与培训宝 iframe 入口一致） */
export const PXB_INSTITUTION_LIST_PATH = '/company/list.htm';
