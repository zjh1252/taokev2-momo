import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ChevronRight } from 'lucide-react';
import { SearchResultSection } from '@/features/search/components/SearchResultSection';

export async function generateMetadata() {
  const t = await getTranslations('search');
  return { title: t('title') };
}

export default async function SearchPage() {
  const t = await getTranslations('search');

  return (
    <main className="max-w-7xl mx-auto px-8 py-6 min-h-screen flex flex-col gap-6">
      <nav className="flex text-sm text-slate-500 gap-2 items-center">
        <span>你的位置：</span>
        <Link href="/" className="hover:text-primary transition-colors">
          首页
        </Link>
        <ChevronRight className="size-4" />
        <span className="text-slate-800 font-medium">{t('breadcrumb')}</span>
      </nav>

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
