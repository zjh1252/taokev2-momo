import type { ChannelCategoryNavItem } from '@/components/layout/channel-category-nav';
import type { CategoryTreeNode } from '@/features/course/api/types';

export type { ChannelCategoryNavItem };

/** 从分类树生成机构侧栏链接（不含计数，计数由客户端批量接口补齐） */
export function buildInstitutionCategoryLinks(
  categories: CategoryTreeNode[],
  seoBasePath: '/company' | '/association',
): ChannelCategoryNavItem[] {
  return categories.map((cat) => {
    const params = new URLSearchParams();
    params.set('expertiseCategoryId', String(cat.id));
    params.set('categoryName', cat.name);
    return {
      name: cat.name,
      count: 0,
      href: `${seoBasePath}?${params.toString()}`,
    };
  });
}

export function extractInstitutionCategoryId(href: string): number | undefined {
  const query = href.includes('?') ? href.split('?')[1] : '';
  const id = new URLSearchParams(query).get('expertiseCategoryId');
  if (!id) return undefined;
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function mergeInstitutionCategoryCounts(
  items: ChannelCategoryNavItem[],
  counts: Record<number, number>,
): ChannelCategoryNavItem[] {
  return items
    .map((item) => ({
      ...item,
      count: counts[extractInstitutionCategoryId(item.href) ?? -1] ?? 0,
    }))
    .filter((item) => item.count > 0);
}
