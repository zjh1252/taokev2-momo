import { ROUTES } from '@/config/routes';
import type { SearchTab } from '@/features/search/api/types';

/** 顶部搜索栏可选分类（与主导航栏目对齐） */
export type HeaderSearchCategoryKey =
  | SearchTab
  | 'onlineCourse'
  | 'institution'
  | 'association';

export type HeaderSearchCategory = {
  key: HeaderSearchCategoryKey;
  i18nKey: string;
};

export const HEADER_SEARCH_CATEGORIES: HeaderSearchCategory[] = [
  { key: 'trainer', i18nKey: 'categoryTrainer' },
  { key: 'openCourse', i18nKey: 'categoryOpenCourse' },
  { key: 'innerCourse', i18nKey: 'categoryInnerCourse' },
  { key: 'onlineCourse', i18nKey: 'categoryOnlineCourse' },
  { key: 'institution', i18nKey: 'categoryInstitution' },
  { key: 'association', i18nKey: 'categoryAssociation' },
];

const PATH_CATEGORY_MAP: { prefix: string; key: HeaderSearchCategoryKey }[] = [
  { prefix: ROUTES.TRAINERS, key: 'trainer' },
  { prefix: ROUTES.PUBLIC_COURSES, key: 'openCourse' },
  { prefix: ROUTES.INTERNAL_COURSES, key: 'innerCourse' },
  { prefix: ROUTES.ONLINE_COURSES, key: 'onlineCourse' },
  { prefix: ROUTES.INSTITUTIONS, key: 'institution' },
  { prefix: ROUTES.ASSOCIATIONS, key: 'association' },
  { prefix: ROUTES.SEARCH, key: 'trainer' },
];

export function isHeaderSearchCategoryKey(value: string | null): value is HeaderSearchCategoryKey {
  return HEADER_SEARCH_CATEGORIES.some((c) => c.key === value);
}

/** 根据当前路径推断默认搜索分类 */
export function pathnameToSearchCategory(pathname: string): HeaderSearchCategoryKey | null {
  for (const { prefix, key } of PATH_CATEGORY_MAP) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return key;
    }
  }
  return null;
}

/** 构建搜索跳转 URL（关键词可为空，则进入对应列表/搜索页） */
export function buildSearchTarget(category: HeaderSearchCategoryKey, keyword: string): string {
  const kw = keyword.trim();
  const params = new URLSearchParams();
  if (kw) params.set('keyword', kw);

  switch (category) {
    case 'trainer':
    case 'openCourse':
    case 'innerCourse': {
      params.set('tab', category);
      const qs = params.toString();
      return qs ? `${ROUTES.SEARCH}?${qs}` : ROUTES.SEARCH;
    }
    case 'onlineCourse':
      return kw ? `${ROUTES.ONLINE_COURSES}?${params.toString()}` : ROUTES.ONLINE_COURSES;
    case 'institution':
      return kw ? `${ROUTES.INSTITUTIONS}?${params.toString()}` : ROUTES.INSTITUTIONS;
    case 'association':
      return kw ? `${ROUTES.ASSOCIATIONS}?${params.toString()}` : ROUTES.ASSOCIATIONS;
  }
}
