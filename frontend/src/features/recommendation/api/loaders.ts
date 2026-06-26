import { getPublicRecommendations } from '@/features/recommendation/api/service';
import {
  mapSlotCasesToRecentCases,
  mapSlotInstitutionsToListItems,
  mapSlotTrainersToListItems
} from '@/features/recommendation/api/mappers';
import { RecommendationSlotCode } from '@/features/recommendation/api/types';
import {
  getRecentTrainerCases,
  getTopRecommendedTrainers
} from '@/features/trainer/api/service';
import type { RecentTrainerCase } from '@/features/trainer/api/service';
import type { TrainerListItem } from '@/features/trainer/types';
import type { InstitutionListItem } from '@/features/institution/types';
import { pickGoldInstitutionRecommends } from '@/features/institution/utils/gold-recommends';

/** 专家列表页推荐 scroller：slot 优先，不足回退 legacy */
export async function loadTrainerListRecommended(limit = 9): Promise<TrainerListItem[]> {
  try {
    const slotItems = await getPublicRecommendations(RecommendationSlotCode.TRAINER_LIST_TRAINER, {
      limit
    });
    if (slotItems.length >= limit) {
      return mapSlotTrainersToListItems(slotItems).slice(0, limit);
    }
  } catch {
    // 回退 legacy
  }
  return getTopRecommendedTrainers(limit).catch(() => []);
}

/** 擅长领域筛选时的领域推荐专家（3 名 PRIMARY） */
export async function loadCategoryExpertTrainers(
  categoryId: number,
  limit = 3
): Promise<TrainerListItem[]> {
  try {
    const slotItems = await getPublicRecommendations(
      RecommendationSlotCode.TRAINER_CATEGORY_EXPERT,
      { limit, categoryId }
    );
    if (slotItems.length >= limit) {
      return mapSlotTrainersToListItems(slotItems).slice(0, limit);
    }
  } catch {
    // 无配置时不展示
  }
  return [];
}

/** 专家列表页案例 scroller */
export async function loadTrainerPageCases(limit = 10): Promise<RecentTrainerCase[]> {
  try {
    const slotItems = await getPublicRecommendations(RecommendationSlotCode.TRAINER_PAGE_CASE, {
      limit
    });
    if (slotItems.length >= limit) {
      return mapSlotCasesToRecentCases(slotItems).slice(0, limit);
    }
  } catch {
    // 回退 legacy
  }
  return getRecentTrainerCases(limit).catch(() => []);
}

/** 机构页金牌推荐区 */
export async function loadGoldInstitutions(
  fallbackPool: InstitutionListItem[],
  limit = 4
): Promise<InstitutionListItem[]> {
  try {
    const slotItems = await getPublicRecommendations(RecommendationSlotCode.INSTITUTION_GOLD, {
      limit
    });
    if (slotItems.length >= limit) {
      return mapSlotInstitutionsToListItems(slotItems).slice(0, limit);
    }
  } catch {
    // 回退 legacy
  }
  return pickGoldInstitutionRecommends(fallbackPool, limit);
}
