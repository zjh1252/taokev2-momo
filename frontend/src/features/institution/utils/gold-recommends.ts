import type { InstitutionListItem } from '../types';

/** 机构页金牌推荐区固定展示 4 个机构 */
export function pickGoldInstitutionRecommends(
  list: InstitutionListItem[],
  count = 4,
): InstitutionListItem[] {
  const recommended = list.filter((item) => item.isRecommended === 1).slice(0, count);
  if (recommended.length >= count) return recommended;

  const fillers = list
    .filter((item) => item.isRecommended !== 1)
    .slice(0, count - recommended.length);

  return [...recommended, ...fillers].slice(0, count);
}
