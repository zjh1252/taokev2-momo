import { getCourseCategoryCounts } from '@/features/course/api/service';
import { getInstitutionExpertiseCategoryCounts } from '@/features/institution/api/service';
import { getTrainerExpertiseCategoryCounts } from '@/features/trainer/api/service';
import { getVideoCategoryCounts } from '@/features/video/api/service';
import type { CategoryTreeNode } from '@/features/course/api/types';
import { filtersToHtmPath } from '@/features/trainer/utils/url';
import type { ChannelCategoryNavItem } from '@/components/layout/channel-category-nav';

export interface CourseCategoryNavOptions {
  cityIds?: number[];
  cityName?: string;
}

function sortByTreeOrder(
  categories: CategoryTreeNode[],
  items: ChannelCategoryNavItem[],
): ChannelCategoryNavItem[] {
  const order = new Map(categories.map((c, i) => [c.name, i]));
  return items.toSorted((a, b) => (order.get(a.name) ?? 0) - (order.get(b.name) ?? 0));
}

function buildCourseHref(
  cat: CategoryTreeNode,
  seoBasePath: '/opencourse' | '/inhousecourse',
  options?: CourseCategoryNavOptions,
): string {
  const params = new URLSearchParams();
  params.set('categoryIds', String(cat.id));
  params.set('categoryName', cat.name);
  if (options?.cityIds?.length) {
    options.cityIds.forEach((id) => params.append('cityIds', String(id)));
  }
  if (options?.cityName) {
    params.set('cityName', options.cityName);
  }
  return `${seoBasePath}?${params.toString()}`;
}

/** 公开课 / 内训课底部分类导航（单次批量计数 API） */
export async function buildCourseCategoryNavItems(
  categories: CategoryTreeNode[],
  isOpen: boolean,
  seoBasePath: '/opencourse' | '/inhousecourse',
  options?: CourseCategoryNavOptions,
): Promise<ChannelCategoryNavItem[]> {
  if (categories.length === 0) return [];

  const counts = await getCourseCategoryCounts({
    isOpen,
    cityIds: options?.cityIds,
  }).catch(() => ({} as Record<number, number>));

  const items = categories.map((cat) => ({
    name: cat.name,
    count: counts[cat.id] ?? 0,
    href: buildCourseHref(cat, seoBasePath, options),
  }));

  return sortByTreeOrder(
    categories,
    items.filter((item) => item.count > 0),
  );
}

/** 专家频道底部分类导航（27 个一级全展示，单次批量计数 API） */
export async function buildTrainerCategoryNavItems(
  l1Categories: CategoryTreeNode[],
): Promise<ChannelCategoryNavItem[]> {
  if (l1Categories.length === 0) return [];

  const counts = await getTrainerExpertiseCategoryCounts().catch(() => ({} as Record<number, number>));

  const items = l1Categories.map((cat) => ({
    name: cat.name,
    count: counts[cat.id] ?? 0,
    href: filtersToHtmPath({ field: cat.name }),
  }));

  return sortByTreeOrder(l1Categories, items);
}

/** 录播课频道底部分类导航（单次批量计数 API） */
export async function buildVideoCategoryNavItems(
  categories: CategoryTreeNode[],
): Promise<ChannelCategoryNavItem[]> {
  if (categories.length === 0) return [];

  const counts = await getVideoCategoryCounts().catch(() => ({} as Record<number, number>));

  const items = categories.map((cat) => {
    const params = new URLSearchParams();
    params.set('categoryId', String(cat.id));
    params.set('categoryName', cat.name);
    return {
      name: cat.name,
      count: counts[cat.id] ?? 0,
      href: `/videos?${params.toString()}`,
    };
  });

  return sortByTreeOrder(
    categories,
    items.filter((item) => item.count > 0),
  );
}

/** 机构 / 协会左侧分类导航（单次批量计数 API） */
export async function buildInstitutionCategoryNavItems(
  categories: CategoryTreeNode[],
  seoBasePath: '/company' | '/association',
  association?: boolean,
): Promise<ChannelCategoryNavItem[]> {
  if (categories.length === 0) return [];

  const counts = await getInstitutionExpertiseCategoryCounts(association).catch(
    () => ({} as Record<number, number>),
  );

  const items = categories.map((cat) => {
    const params = new URLSearchParams();
    params.set('expertiseCategoryId', String(cat.id));
    params.set('categoryName', cat.name);
    return {
      name: cat.name,
      count: counts[cat.id] ?? 0,
      href: `${seoBasePath}?${params.toString()}`,
    };
  });

  return sortByTreeOrder(
    categories,
    items.filter((item) => item.count > 0),
  );
}
