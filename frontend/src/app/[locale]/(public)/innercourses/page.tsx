import { getTranslations } from 'next-intl/server';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { InnerCourseListSection } from '@/features/course/components/inner/InnerCourseListSection';
import { getCourseList, getCategoryTree } from '@/features/course/api/service';
import { getInstitutionDetail } from '@/features/institution/api/service';

interface Props {
  searchParams: Promise<{ institutionId?: string }>;
}

export async function generateMetadata() {
  const t = await getTranslations('course');
  return {
    title: t('inner.meta.title'),
    description: t('inner.meta.description'),
  };
}

export default async function InnerCoursesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const institutionId = sp.institutionId ? Number(sp.institutionId) : undefined;
  const validInstitutionId = institutionId && !isNaN(institutionId) ? institutionId : undefined;

  const [initialData, categoryTree, institution] = await Promise.all([
    getCourseList({
      page: 1,
      size: 15,
      isOpen: false,
      institutionId: validInstitutionId,
    }).catch(() => ({
      list: [],
      total: 0,
      page: 1,
      size: 15,
      totalPages: 0,
    })),
    getCategoryTree('COURSE_CATEGORY').catch(() => []),
    validInstitutionId
      ? getInstitutionDetail(validInstitutionId).catch(() => null)
      : Promise.resolve(null),
  ]);

  return (
    <main className="max-w-7xl mx-auto px-8 py-6 min-h-screen flex flex-col gap-6">
      {/* 面包屑导航 — 公共组件 */}
      <PageBreadcrumb items={[{ label: '内训课' }]} />

      <InnerCourseListSection
        initialData={initialData}
        categoryTree={categoryTree}
        initialInstitutionId={validInstitutionId}
        initialInstitutionName={institution?.orgName}
      />
    </main>
  );
}
