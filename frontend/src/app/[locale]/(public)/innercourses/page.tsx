import { getTranslations } from 'next-intl/server';
import { InnerCourseListSection } from '@/features/course/components/inner/InnerCourseListSection';
import { getCourseList, getCourseCategoryTree } from '@/features/course/api/service';

export async function generateMetadata() {
  const t = await getTranslations('course');
  return {
    title: t('inner.meta.title'),
    description: t('inner.meta.description'),
  };
}

export default async function InnerCoursesPage() {
  const t = await getTranslations('course');

  const [initialData, categoryTree] = await Promise.all([
    getCourseList({ page: 1, size: 15, isOpen: false }).catch(() => ({
      list: [],
      total: 0,
      page: 1,
      size: 15,
      totalPages: 0,
    })),
    getCourseCategoryTree().catch(() => []),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">{t('inner.title')}</h1>
        <p className="text-slate-500 mt-2">{t('inner.subtitle')}</p>
      </div>
      <InnerCourseListSection initialData={initialData} categoryTree={categoryTree} />
    </div>
  );
}
