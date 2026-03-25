import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
  const t = await getTranslations('common');
  return { title: t('site.title') };
}

export default async function HomePage() {
  const t = await getTranslations('common');

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold">{t('site.title')}</h1>
      <p className="mt-4 text-muted-foreground">{t('site.description')}</p>
      {/* TODO: 首页内容 */}
    </div>
  );
}
