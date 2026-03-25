import { getTranslations } from 'next-intl/server';

export default async function InstructorsPage() {
  const t = await getTranslations('nav');

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold">{t('instructors')}</h1>
      {/* TODO: 讲师列表 */}
    </div>
  );
}
