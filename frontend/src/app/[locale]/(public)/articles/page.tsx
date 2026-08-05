import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { buildCanonicalUrl } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return {
    title: `${t('articles')} - 淘课网`,
    description:
      '淘课网文章频道聚合企业培训、管理提升、课程采购与讲师机构选择相关内容，帮助培训负责人了解行业资讯并优化培训计划。',
    keywords: '企业培训文章, 管理培训资讯, 培训行业动态',
    alternates: { canonical: buildCanonicalUrl('/articles') },
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
