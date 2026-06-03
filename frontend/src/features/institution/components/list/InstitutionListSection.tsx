'use client';

import { Suspense, useState, useCallback, useTransition } from 'react';
import { ArrowUpDown, TrendingUp } from 'lucide-react';
import { ListPagePagination } from '@/components/list-page-pagination';
import { useListPageUrlSync } from '@/hooks/use-list-page-url';
import { InstitutionCard } from './InstitutionCard';
import { SafeImage } from '@/components/safe-image';
import { InstitutionSidebar, type InstitutionFilters } from './InstitutionSidebar';
import { getInstitutionList, type InstitutionFacets } from '../../api/service';
import type { InstitutionListItem, PageResponse } from '../../types';

interface RegionItem {
  id: number;
  code: string;
  name: string;
}

interface InstitutionListSectionProps {
  initialData: PageResponse<InstitutionListItem>;
  facets: InstitutionFacets;
  provinces: RegionItem[];
  recommended: InstitutionListItem[];
  topRated: InstitutionListItem[];
  weeklyActive: InstitutionListItem[];
  newest: InstitutionListItem[];
  association?: boolean;
  basePath?: string;
  title?: string;
}

const SORT_OPTIONS = [
  { key: 'default', label: '默认排序' },
  { key: 'popularity', label: '机构人气' },
];

export function InstitutionListSection(props: InstitutionListSectionProps) {
  return (
    <Suspense fallback={<div className="min-h-[320px] animate-pulse rounded-xl bg-slate-100" />}>
      <InstitutionListSectionInner {...props} />
    </Suspense>
  );
}

function InstitutionListSectionInner({
  initialData,
  facets,
  provinces,
  recommended,
  topRated,
  weeklyActive,
  newest,
  association,
  basePath = '/institutions',
  title = '培训机构',
}: InstitutionListSectionProps) {
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState<InstitutionFilters>({ keyword: '' });
  const [sortKey, setSortKey] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const fetchData = useCallback(
    (page: number, nextFilters?: InstitutionFilters, overrideSort?: string) => {
      const f = nextFilters ?? filters;
      const sort = overrideSort ?? sortKey;
      startTransition(async () => {
        try {
          const result = await getInstitutionList({
            page,
            size: 15,
            sort,
            association,
            keyword: f.keyword || undefined,
            specialty: f.specialty,
            industry: f.industry,
            provinceId: f.provinceId,
            cityId: f.cityId,
            minScore: f.minScore,
          });
          setData(result);
          setCurrentPage(page);
        } catch (e) {
          console.error('加载机构列表失败:', e);
        }
      });
    },
    [filters, sortKey, association],
  );

  const { commitPageChange } = useListPageUrlSync({
    currentPage,
    onPageFromUrl: (page) => fetchData(page),
  });

  const handleApplyFilters = useCallback(
    (next: InstitutionFilters) => {
      setFilters(next);
      commitPageChange(1);
      fetchData(1, next);
    },
    [fetchData, commitPageChange],
  );

  const handleSortChange = useCallback(
    (key: string) => {
      setSortKey(key);
      commitPageChange(1);
      fetchData(1, filters, key);
    },
    [fetchData, filters, commitPageChange],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      commitPageChange(page);
      fetchData(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [fetchData, commitPageChange],
  );

  return (
    <div className="flex gap-6 items-start">
      <InstitutionSidebar
        facets={facets}
        provinces={provinces}
        topRated={topRated}
        weeklyActive={weeklyActive}
        newest={newest}
        filters={filters}
        onApply={handleApplyFilters}
        basePath={basePath}
      />

      <div className="flex-1 flex flex-col gap-6">
        {/* 金牌推荐区（取后端推荐前 4 家） */}
        {currentPage === 1 && recommended.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-50 via-amber-100/50 to-white px-5 py-3 border-b border-amber-100 flex items-center gap-2">
              <span className="text-amber-500 text-lg">🏅</span>
              <h3 className="font-bold text-amber-700 text-[15px]">金牌培训机构推荐</h3>
            </div>
            <div className="p-6 bg-gradient-to-b from-white to-slate-50/30 grid grid-cols-2 sm:grid-cols-4 gap-6 md:gap-8 justify-items-center">
              {recommended.slice(0, 4).map((item) => (
                <a
                  key={item.id}
                  href={`${basePath}/${item.id}`}
                  className="group flex flex-col items-center gap-3 w-full"
                >
                  <div className="w-24 h-24 md:w-28 md:h-28 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:shadow-md group-hover:border-primary/30 transition-all flex items-center justify-center p-2">
                    <SafeImage
                      src={item.logoUrl}
                      fallback={`https://ui-avatars.com/api/?name=${encodeURIComponent(item.orgName.slice(0, 2))}&background=FEF3C7&color=78350F&size=100&font-size=0.4`}
                      alt={item.orgName}
                      width={112}
                      height={112}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors text-center w-full truncate px-2">
                    {item.orgName}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 列表区 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-6">
            <span className="text-slate-700 font-bold text-[15px] ml-2">{title}</span>
            <div className="flex items-center gap-2">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleSortChange(opt.key)}
                  className={`px-4 py-1.5 rounded-full text-xs transition-colors inline-flex items-center gap-1 ${
                    sortKey === opt.key
                      ? 'font-bold text-primary bg-primary/10'
                      : 'font-medium text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                  {opt.key === 'popularity' && <TrendingUp className="size-3" />}
                  {opt.key === 'default' && <ArrowUpDown className="size-3" />}
                </button>
              ))}
            </div>
            <span className="ml-auto text-xs text-slate-500 pr-2">
              共 <strong className="text-slate-900">{data.total}</strong> 家机构
            </span>
          </div>

          <div className={`flex flex-col transition-opacity ${isPending ? 'opacity-50' : ''}`}>
            {data.list.length > 0 ? (
              data.list.map((item) => (
                <InstitutionCard key={item.id} institution={item} basePath={basePath} />
              ))
            ) : (
              <div className="p-12 text-center text-slate-400">暂无培训机构</div>
            )}
          </div>

          <ListPagePagination
            currentPage={currentPage}
            totalPages={data.totalPages}
            onPageChange={handlePageChange}
            className="p-6"
          />
        </div>
      </div>
    </div>
  );
}
