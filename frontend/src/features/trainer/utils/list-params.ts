import type { CategoryTreeNode, TrainerListParams } from '../types';
import type { TrainerSlugParams } from './url';
import { resolveExpertiseCategoryId } from './expertise-categories';

function findCategoryIdByName(tree: CategoryTreeNode[], name: string): number | undefined {
  for (const lvl1 of tree) {
    if (lvl1.name === name) return lvl1.id;
    const child = lvl1.children?.find((c) => c.name === name);
    if (child) return child.id;
  }
  return undefined;
}

/** 将 SEO slug / 名称筛选参数解析为后端列表 API 所需的 ID 参数 */
export function slugParamsToTrainerListParams(
  slug: TrainerSlugParams,
  expertiseTree: CategoryTreeNode[],
  industryTree: CategoryTreeNode[],
  options?: {
    cityId?: number;
    page?: number;
    size?: number;
    sort?: string;
    provinceId?: number;
  },
): TrainerListParams {
  return {
    page: options?.page ?? 1,
    size: options?.size ?? 16,
    sort: options?.sort ?? 'default',
    cityId: options?.cityId,
    provinceId: options?.provinceId,
    expertiseCategoryId: resolveExpertiseCategoryId(expertiseTree, slug.field),
    industryCategoryId: slug.industry
      ? findCategoryIdByName(industryTree, slug.industry)
      : undefined,
  };
}
