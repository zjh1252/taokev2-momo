import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { InstitutionListSection } from '@/features/institution/components/list/InstitutionListSection';
import { getInstitutionList } from '@/features/institution/api/service';
import { buildInstitutionCategoryNavItems } from '@/lib/channel-category-stats';
import { getCachedTrainerExpertiseTree } from '@/lib/cached-categories';
import { institutionListMetadata, institutionListH1 } from '@/lib/seo';
import { firstStringValue, normalizeNumberIds } from '@/lib/search-params';

interface Props {
  searchParams: Promise<{
    expertiseCategoryId?: string;
    categoryName?: string;
  }>;
}

export async function generateMetadata({ searchParams }: Props) {
  const sp = await searchParams;
  return institutionListMetadata({
    category: firstStringValue(sp.categoryName),
  });
}

/**
 * 机构列表页 — SSR 首屏数据 + 左侧分类 + 客户端筛选交互
 */
export default async function InstitutionsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const expertiseCategoryId = normalizeNumberIds(
    sp.expertiseCategoryId ? [sp.expertiseCategoryId] : undefined,
  )[0];

  const expertiseTreePromise = getCachedTrainerExpertiseTree();

  const [initialData, categoryItems] = await Promise.all([
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
    expertiseTreePromise.then((tree) => buildInstitutionCategoryNavItems(tree, '/company')).catch(() => []),
  ]);

  const listH1 = institutionListH1({
    category: firstStringValue(sp.categoryName),
  });

  return (
    <main className="max-w-7xl mx-auto px-8 py-6 min-h-screen flex flex-col gap-6">
      <PageBreadcrumb items={[{ label: '培训机构' }]} />
      <h1 className="text-2xl font-bold text-slate-900">{listH1}</h1>

      <InstitutionListSection
        initialData={initialData}
        categoryItems={categoryItems}
        initialExpertiseCategoryId={expertiseCategoryId}
        categoryTitle="培训机构类别"
      />
    </main>
  );
}
