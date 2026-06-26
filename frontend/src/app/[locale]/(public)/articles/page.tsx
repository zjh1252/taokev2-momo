import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return {
    title: `${t('articles')} - 淘课网`,
    description: '淘课网文章频道，提供企业培训、管理培训相关的专业文章和行业资讯。',
    keywords: '企业培训文章, 管理培训资讯, 培训行业动态',
  };
}

export default async function ArticlesPage() {
  const t = await getTranslations('nav');

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold">{t('articles')}</h1>
      {/* TODO: 文章列表 */}
    </div>
  );
}
