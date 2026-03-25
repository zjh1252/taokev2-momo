import { getTranslations } from 'next-intl/server';

export default async function MyCoursesPage() {
  const t = await getTranslations('nav');

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold">{t('myCourses')}</h1>
      {/* TODO: 我的课程列表 */}
    </div>
  );
}
