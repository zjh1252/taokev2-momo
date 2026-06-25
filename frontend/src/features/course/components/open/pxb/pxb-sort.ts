/** 培训宝 embed 排序：与老站 order 1/5、6/2、3/7、9/10 升降序切换对应 */

export type PxbSortField = 'default' | 'time' | 'price' | 'score';

/** URL/API sortBy 取值 */
export type PxbSortBy =
  | 'default'
  | 'default_asc'
  | 'time'
  | 'time_asc'
  | 'price'
  | 'price_desc'
  | 'score'
  | 'score_asc';

const FIELD_PRIMARY: Record<PxbSortField, PxbSortBy> = {
  default: 'default',
  time: 'time',
  price: 'price_desc',
  score: 'score',
};

const FIELD_TOGGLE: Record<PxbSortField, [PxbSortBy, PxbSortBy]> = {
  default: ['default_asc', 'default'],
  time: ['time_asc', 'time'],
  price: ['price_desc', 'price'],
  score: ['score_asc', 'score'],
};

export const FIELD_SORT_BYS: Record<PxbSortField, PxbSortBy[]> = {
  default: ['default', 'default_asc'],
  time: ['time', 'time_asc'],
  price: ['price', 'price_desc'],
  score: ['score', 'score_asc'],
};

export function getSortField(sortBy: string): PxbSortField | null {
  if (sortBy.startsWith('default')) return 'default';
  if (sortBy.startsWith('time')) return 'time';
  if (sortBy.startsWith('price')) return 'price';
  if (sortBy.startsWith('score')) return 'score';
  return null;
}

/** 点击排序项：同字段切换升降序，否则切到该字段默认方向 */
export function togglePxbSort(current: string, field: PxbSortField): PxbSortBy {
  const [a, b] = FIELD_TOGGLE[field];
  if (current === a) return b;
  if (current === b) return a;
  return FIELD_PRIMARY[field];
}

export function sortLinkClass(sortBy: string, field: PxbSortField): string {
  const values = FIELD_SORT_BYS[field];
  if (!values.includes(sortBy as PxbSortBy)) return '';
  const ascValues: PxbSortBy[] = ['default_asc', 'time_asc', 'price', 'score_asc'];
  return ascValues.includes(sortBy as PxbSortBy) ? 'sort-asc' : 'sort-desc';
}

export function mapSortByToApi(sortBy: string): string | undefined {
  if (!sortBy || sortBy === 'default') return undefined;
  return sortBy;
}
