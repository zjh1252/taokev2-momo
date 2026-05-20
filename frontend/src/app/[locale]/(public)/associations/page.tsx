import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { InstitutionListSection } from '@/features/institution/components/list/InstitutionListSection';
import { getInstitutionList } from '@/features/institution/api/service';

export async function generateMetadata() {
  return {
    title: '培训协会 - 淘课网',
    description: '发现全国优秀培训协会，按擅长领域、行业筛选，查看评分与评价。',
  };
}

/**
 * 培训协会列表页 — 复用机构列表组件，筛选 association=true
 */
export default async function AssociationsPage() {
  const initialData = await getInstitutionList({ page: 1, size: 15, association: true }).catch(() => ({
    list: [],
    total: 0,
    page: 1,
    size: 15,
    totalPages: 0,
  }));

  return (
    <main className="max-w-7xl mx-auto px-8 py-6 min-h-screen flex flex-col gap-6">
      {/* 面包屑导航 — 公共组件 */}
      <PageBreadcrumb items={[{ label: '培训协会' }]} />

      <InstitutionListSection
        initialData={initialData}
        association={true}
        basePath="/associations"
        title="培训协会"
      />
    </main>
  );
}
