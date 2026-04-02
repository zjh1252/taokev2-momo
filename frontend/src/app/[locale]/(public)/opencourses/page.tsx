import { getTranslations } from 'next-intl/server';
import { OpenCourseListSection } from '@/features/course/components/open/OpenCourseListSection';
import { getCourseList, getCourseCategoryTree } from '@/features/course/api/service';

export async function generateMetadata() {
  const t = await getTranslations('course');
  return {
    title: t('open.meta.title'),
    description: t('open.meta.description'),
  };
}

export default async function OpenCoursesPage() {
  const t = await getTranslations('course');

  const [initialData, categoryTree] = await Promise.all([
    getCourseList({ page: 1, size: 15, isOpen: true }).catch(() => ({
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
        <h1 className="text-3xl font-bold text-slate-900">{t('open.title')}</h1>
        <p className="text-slate-500 mt-2">{t('open.subtitle')}</p>
      </div>
      <OpenCourseListSection initialData={initialData} categoryTree={categoryTree} />
    </div>
  );
}
