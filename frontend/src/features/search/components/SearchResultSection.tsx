'use client';

import { useState, useEffect, useTransition, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { searchDocuments, tabToSearchParams } from '../api/service';
import type { SearchTab, SearchResultItem, PageResponse } from '../api/types';
import { TrainerResultCard } from './TrainerResultCard';
import { CourseResultCard } from './CourseResultCard';
import { AdvancedSearchPanel, type FilterValues } from './AdvancedSearchPanel';

const TABS: { key: SearchTab; i18nKey: string }[] = [
  { key: 'trainer', i18nKey: 'tabTrainer' },
  { key: 'innerCourse', i18nKey: 'tabInnerCourse' },
  { key: 'openCourse', i18nKey: 'tabOpenCourse' },
];

const PAGE_SIZE = 20;

function generatePageNumbers(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: number[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push(-1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push(-1);
  pages.push(total);
  return pages;
}

export function SearchResultSection() {
  const t = useTranslations('search');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const keyword = searchParams.get('keyword') ?? '';
  const tab = (searchParams.get('tab') as SearchTab) || 'trainer';
  const currentPage = Number(searchParams.get('page') ?? '1');

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [data, setData] = useState<PageResponse<SearchResultItem> | null>(null);

  const [filters, setFilters] = useState<FilterValues>({});

  const prevTabRef = useRef(tab);

  useEffect(() => {
    const effectiveFilters = prevTabRef.current !== tab ? {} : filters;
    if (prevTabRef.current !== tab) {
      prevTabRef.current = tab;
      setFilters({});
    }

    const tabParams = tabToSearchParams(tab);
    const allParams = {
      keyword: keyword || undefined,
      ...tabParams,
      ...effectiveFilters,
      page: currentPage,
      size: PAGE_SIZE,
    };

    startTransition(async () => {
      try {
        const result = await searchDocuments(allParams);
        setData(result);
      } catch {
        setData({ list: [], total: 0, page: 1, size: PAGE_SIZE, totalPages: 0 });
      }
    });
  }, [keyword, tab, currentPage, filters]);

  const updateUrl = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v != null) params.set(k, v);
        else params.delete(k);
      });
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleTabChange = useCallback(
    (newTab: SearchTab) => {
      if (newTab === tab) return;
      updateUrl({ tab: newTab, page: '1' });
    },
    [tab, updateUrl]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      updateUrl({ page: String(page) });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [updateUrl]
  );

  const handleFilterChange = useCallback(
    (newFilters: FilterValues) => {
      setFilters(newFilters);
      updateUrl({ page: '1' });
    },
    [updateUrl]
  );

  return (
    <div className="space-y-4">
      {/* 关键词标题 */}
      <h1 className="text-xl font-bold text-slate-900">
        {keyword ? t('resultTitle', { keyword }) : t('resultTitleEmpty')}
      </h1>

      {/* Tab 栏 + 高级搜索按钮 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center border-b border-slate-100 px-4">
          {TABS.map((tabItem) => (
            <button
              key={tabItem.key}
              onClick={() => handleTabChange(tabItem.key)}
              className={`px-6 py-3.5 text-sm font-medium transition-colors relative ${
                tab === tabItem.key
                  ? 'text-primary'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {t(tabItem.i18nKey)}
              {tab === tabItem.key && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-1.5 ml-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
              showAdvanced
                ? 'text-primary bg-primary/5'
                : 'text-slate-500 hover:text-primary hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="size-4" />
            {t('advancedSearch')}
          </button>
        </div>

        {/* 高级搜索面板 */}
        {showAdvanced && (
          <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100">
            <AdvancedSearchPanel
              tab={tab}
              values={filters}
              onChange={handleFilterChange}
            />
          </div>
        )}

        {/* 结果统计 */}
        <div className="px-5 py-3 flex items-center justify-between text-sm">
          <span className="text-slate-500">
            {data ? t('totalResults', { total: data.total }) : ''}
          </span>
        </div>
      </div>

      {/* 搜索结果列表 */}
      <div className={`space-y-3 transition-opacity ${isPending ? 'opacity-50' : ''}`}>
        {data && data.list.length > 0 ? (
          data.list.map((item) =>
            item.docType === 'trainer' ? (
              <TrainerResultCard key={item.docId} item={item} />
            ) : (
              <CourseResultCard key={item.docId} item={item} />
            )
          )
        ) : data && !isPending ? (
          <div className="bg-white border border-slate-200 rounded-xl p-16 text-center">
            <Search className="size-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">{t('noResults')}</p>
            <p className="text-slate-300 text-sm mt-1">{t('noResultsHint')}</p>
          </div>
        ) : null}
      </div>

      {/* 分页 */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center py-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage <= 1}
              className="px-3 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {t('pagination.first')}
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="size-4" />
            </button>
            {generatePageNumbers(currentPage, data.totalPages).map((p, i) =>
              p === -1 ? (
                <span key={`dot-${i}`} className="text-slate-400 px-1">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg font-medium text-sm ${
                    p === currentPage
                      ? 'bg-primary text-white shadow-sm'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= data.totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="size-4" />
            </button>
            <button
              onClick={() => handlePageChange(data.totalPages)}
              disabled={currentPage >= data.totalPages}
              className="px-3 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {t('pagination.last')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
