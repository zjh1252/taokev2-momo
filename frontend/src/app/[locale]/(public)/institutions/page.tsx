import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { InstitutionListSection } from '@/features/institution/components/list/InstitutionListSection';
import { PxbInstitutionListSection } from '@/features/institution/components/pxb/PxbInstitutionListSection';
import {
  parsePxbInstitutionListUrl,
  pxbInstitutionListParams,
} from '@/features/institution/components/pxb/pxb-institution-list-url';
import { getInstitutionList } from '@/features/institution/api/service';
import { loadGoldInstitutions } from '@/features/recommendation/api/loaders';
import {
  getCachedTrainerExpertiseTree,
  getCachedTrainerIndustryTree,
} from '@/lib/cached-categories';
import { buildInstitutionCategoryNavItems } from '@/lib/channel-category-stats';
import { isPxbEmbedOrigin } from '@/lib/pxb-embed';
import { institutionListMetadata, institutionListH1 } from '@/lib/seo';
import { firstStringValue, normalizeNumberIds } from '@/lib/search-params';

function embedSearchParams(
  sp: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (key === 'origin' || value == null) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else {
      params.set(key, value);
    }
  }
  return params;
}

interface Props {
  searchParams: Promise<{
    origin?: string;
    page?: string;
    keyword?: string;
    expertiseCategoryId?: string;
    industryCategoryId?: string;
    provinceId?: string;
    cityId?: string;
    sortBy?: string;
    categoryName?: string;
  }>;
}

export async function generateMetadata({ searchParams }: Props) {
  const sp = await searchParams;
  if (isPxbEmbedOrigin(sp.origin)) {
    return { title: '机构列表' };
  }
  return institutionListMetadata({
    category: firstStringValue(sp.categoryName),
  });
}

/**
 * 机构列表页 — SSR 首屏数据 + 左侧分类 + 客户端筛选交互
 */
export default async function InstitutionsPage({ searchParams }: Props) {
  const sp = await searchParams;

  if (isPxbEmbedOrigin(sp.origin)) {
    const urlState = parsePxbInstitutionListUrl(embedSearchParams(sp));
    const [initialData, expertiseTree, industryTree] = await Promise.all([
      getInstitutionList(pxbInstitutionListParams(urlState)).catch(() => ({
        list: [],
        total: 0,
        page: urlState.page,
        size: 15,
        totalPages: 0,
      })),
      getCachedTrainerExpertiseTree(),
      getCachedTrainerIndustryTree(),
    ]);

    return (
      <PxbInstitutionListSection
        initialData={initialData}
        expertiseTree={expertiseTree}
        industryTree={industryTree}
      />
    );
  }

  const expertiseCategoryId = normalizeNumberIds(
    sp.expertiseCategoryId ? [sp.expertiseCategoryId] : undefined,
  )[0];

  const [initialData, goldPool, expertiseTree] = await Promise.all([
    getInstitutionList({
      page: 1,
      size: 15,
      expertiseCategoryId,
    }).catch(() => ({
      list: [],
      total: 0,
      page: 1,
      size: 15,
      totalPages: 0,
    })),
    getInstitutionList({ page: 1, size: 50 }).catch(() => ({
      list: [],
      total: 0,
      page: 1,
      size: 50,
      totalPages: 0,
    })),
    getCachedTrainerExpertiseTree(),
  ]);

  const initialGoldRecommends = await loadGoldInstitutions(goldPool.list, 4);

  const categoryItems = await buildInstitutionCategoryNavItems(
    expertiseTree,
    '/company',
  );

  const listH1 = institutionListH1({
    category: firstStringValue(sp.categoryName),
  });

  return (
    <main className="max-w-7xl mx-auto px-8 py-6 min-h-screen flex flex-col gap-6">
      <PageBreadcrumb items={[{ label: '培训机构' }]} />
      <h1 className="sr-only">{listH1}</h1>

      <InstitutionListSection
        initialData={initialData}
        initialGoldRecommends={initialGoldRecommends}
        categoryItems={categoryItems}
        initialExpertiseCategoryId={expertiseCategoryId}
        categoryTitle="培训机构类别"
        bottomCategoryNav={{
          title: '培训机构类别',
          countUnit: '家',
          items: categoryItems,
        }}
      />
    </main>
  );
}
