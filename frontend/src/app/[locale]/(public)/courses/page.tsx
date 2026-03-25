import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('course');
  return {
    title: t('list.meta.title'),
    description: t('list.meta.description'),
  };
}

export default async function CoursesPage() {
  const t = await getTranslations('course');

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold">{t('list.title')}</h1>
      <p className="mt-2 text-muted-foreground">{t('list.subtitle')}</p>
      {/* TODO: 课程列表 */}
    </div>
  );
}
