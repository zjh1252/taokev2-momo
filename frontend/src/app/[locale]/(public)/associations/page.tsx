import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { InstitutionListSection } from '@/features/institution/components/list/InstitutionListSection';
import { getInstitutionList } from '@/features/institution/api/service';
import { getCachedTrainerExpertiseTree } from '@/lib/cached-categories';
import { buildInstitutionCategoryNavItems } from '@/lib/channel-category-stats';
import { normalizeNumberIds } from '@/lib/search-params';

interface Props {
  searchParams: Promise<{
    expertiseCategoryId?: string;
    categoryName?: string;
  }>;
}

export async function generateMetadata() {
  return {
    title: '培训协会 - 淘课网',
    description: '发现全国优秀培训协会，按擅长领域、行业筛选，查看评分与评价。',
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

  const [initialData, expertiseTree] = await Promise.all([
    getInstitutionList({
      page: 1,
      size: 15,
      association: true,
      expertiseCategoryId,
    }).catch(() => ({
      list: [],
      total: 0,
      page: 1,
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
