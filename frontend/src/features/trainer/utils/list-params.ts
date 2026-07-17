import type { CategoryTreeNode, TrainerListParams } from '../types';
import type { TrainerSlugParams } from './url';

function findCategoryId(
  tree: CategoryTreeNode[],
  parentName: string,
  childName?: string,
): number | undefined {
  for (const lvl1 of tree) {
    if (lvl1.name === parentName) {
      if (!childName) return lvl1.id;
      const child = lvl1.children?.find((c) => c.name === childName);
      if (child) return child.id;
    }
  }
  return undefined;
}

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
  const fieldParts = (slug.field || '').split('_').filter(Boolean);
  const fieldParent = fieldParts[0];
  const fieldChild = fieldParts[1];

  return {
    page: options?.page ?? 1,
    size: options?.size ?? 16,
    sort: options?.sort ?? 'default',
    cityId: options?.cityId,
    provinceId: options?.provinceId,
    expertiseCategoryId: fieldParent
      ? findCategoryId(expertiseTree, fieldParent, fieldChild)
      : undefined,
    industryCategoryId: slug.industry
      ? findCategoryIdByName(industryTree, slug.industry)
      : undefined,
  };
}
