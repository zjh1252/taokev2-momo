import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { SearchResultSection } from '@/features/search/components/SearchResultSection';

export async function generateMetadata() {
  const t = await getTranslations('search');
  return {
    title: `${t('title')} - 淘课网`,
    description: '搜索淘课网培训课程、专家讲师、培训机构，快速找到适合您企业需求的培训资源。',
    keywords: '培训课程搜索, 专家讲师搜索, 企业培训资源',
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage() {
  const t = await getTranslations('search');

  return (
    <main className="max-w-7xl mx-auto px-8 py-6 min-h-screen flex flex-col gap-6">
      {/* 面包屑导航 — 公共组件 */}
      <PageBreadcrumb items={[{ label: t('breadcrumb') }]} />

      <Suspense fallback={<SearchSkeleton />}>
        <SearchResultSection />
      </Suspense>
    </main>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-64" />
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="h-10 bg-slate-100 rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
