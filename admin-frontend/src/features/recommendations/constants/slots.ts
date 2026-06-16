import type { RecommendationSlotMeta } from '../api/types';

/** 与后端 RecommendationSlot 枚举保持一致，API 不可用时的静态回退 */
export const RECOMMENDATION_SLOTS: RecommendationSlotMeta[] = [
  { code: 'HOME_TRAINER', label: '首页-推荐专家', resourceType: 'TRAINER' },
  { code: 'TRAINER_LIST_TRAINER', label: '专家页-推荐专家', resourceType: 'TRAINER' },
  { code: 'TRAINER_CATEGORY_EXPERT', label: '专家页-擅长领域专家', resourceType: 'TRAINER' },
  { code: 'HOME_INNER_COURSE', label: '首页-热门内训课', resourceType: 'COURSE' },
  { code: 'HOME_OPEN_COURSE', label: '首页-线下公开课', resourceType: 'COURSE' },
  { code: 'HOME_CASE', label: '首页-专家案例', resourceType: 'CASE' },
  { code: 'TRAINER_PAGE_CASE', label: '专家页-推荐案例', resourceType: 'CASE' },
  { code: 'INSTITUTION_GOLD', label: '机构页-金牌机构推荐', resourceType: 'INSTITUTION' }
];

export function getStaticRecommendationSlots(resourceType?: string): RecommendationSlotMeta[] {
  if (!resourceType) return RECOMMENDATION_SLOTS;
  return RECOMMENDATION_SLOTS.filter((s) => s.resourceType === resourceType);
}
