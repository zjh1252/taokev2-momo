import { getTranslations } from 'next-intl/server';

export default async function ArticlesPage() {
  const t = await getTranslations('nav');

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold">{t('articles')}</h1>
      {/* TODO: 文章列表 */}
    </div>
  );
}
