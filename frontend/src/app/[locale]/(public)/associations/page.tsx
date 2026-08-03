import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { InstitutionListSection } from '@/features/institution/components/list/InstitutionListSection';
import { getInstitutionList } from '@/features/institution/api/service';
import { getCachedTrainerExpertiseTree } from '@/lib/cached-categories';
import { buildInstitutionCategoryNavItems } from '@/lib/channel-category-stats';
import { parseListPageFromSearchParams } from '@/lib/list-page';
import { firstStringValue, normalizeNumberIds } from '@/lib/search-params';
import { buildCanonicalUrl, pickCanonicalSearchParams } from '@/lib/seo';

interface Props {
  searchParams: Promise<{
    page?: string;
    keyword?: string;
    expertiseCategoryId?: string;
    categoryName?: string;
  }>;
}

export async function generateMetadata({ searchParams }: Props) {
  const sp = await searchParams;
  const canonicalParams = pickCanonicalSearchParams(sp, ['categoryName', 'page']);
  return {
    title: '培训协会 - 淘课网',
    description:
      '淘课网培训协会频道汇总全国企业培训相关协会资源，支持按领域与行业筛选，帮助企业了解协会背景、课程资源与合作信息。',
    alternates: {
      canonical: buildCanonicalUrl('/association', canonicalParams, ['categoryName', 'page']),
    },
  };
}

/**
 * 培训协会列表页 — 复用机构列表组件，筛选 association=true
 */
export default async function AssociationsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const expertiseCategoryId = normalizeNumberIds(
    sp.expertiseCategoryId ? [sp.expertiseCategoryId] : undefined,
  )[0];
  const keyword = firstStringValue(sp.keyword);
  const page = parseListPageFromSearchParams(
    new URLSearchParams(sp.page != null ? `page=${sp.page}` : ''),
  );

  const [initialData, expertiseTree] = await Promise.all([
    getInstitutionList({
      page,
      size: 15,
      keyword: keyword || undefined,
      association: true,
      expertiseCategoryId,
    }).catch(() => ({
      list: [],
      total: 0,
      page,
      size: 15,
      totalPages: 0,
    })),
    getCachedTrainerExpertiseTree(),
  ]);

  const categoryItems = await buildInstitutionCategoryNavItems(
    expertiseTree,
    '/association',
    true,
  );

  return (
    <main className="max-w-7xl mx-auto px-8 py-6 min-h-screen flex flex-col gap-6">
      <PageBreadcrumb items={[{ label: '培训协会' }]} />

      <InstitutionListSection
        initialData={initialData}
        association={true}
        basePath="/association"
        title="培训协会"
        categoryItems={categoryItems}
        initialExpertiseCategoryId={expertiseCategoryId}
        categoryTitle="培训协会类别"
        bottomCategoryNav={{
          title: '培训协会类别',
          countUnit: '家',
          items: categoryItems,
        }}
      />
    </main>
  );
}
