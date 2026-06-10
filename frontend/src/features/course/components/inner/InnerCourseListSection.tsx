'use client';

import { Suspense, useState, useCallback, useTransition, useMemo } from 'react';
import { ArrowUpDown, X } from 'lucide-react';
import { ListPagePagination } from '@/components/list-page-pagination';
import { useRouter } from '@/i18n/navigation';
import { useListPageUrlSync } from '@/hooks/use-list-page-url';
import { InnerCourseCard } from './InnerCourseCard';
import { InnerCourseFilters, type InnerCourseFilterValue } from './InnerCourseFilters';
import { getCourseList } from '../../api/service';
import type { CourseListItem, PageResponse, CategoryTreeNode } from '../../api/types';

interface InnerCourseListSectionProps {
  initialData: PageResponse<CourseListItem>;
  categoryTree: CategoryTreeNode[];
  industryTree: CategoryTreeNode[];
  initialInstitutionId?: number;
  initialInstitutionName?: string;
  initialCategoryId?: number;
  initialCategoryName?: string;
}

const SORT_OPTIONS = [
  { key: 'default', label: '默认', sortBy: 'default' },
  { key: 'rating', label: '评分', sortBy: 'score' },
];

function resolveSortBy(filters: InnerCourseFilterValue, sortKey: string): string | undefined {
  const sidebar = filters.sortBy;
  if (sidebar && sidebar !== 'default') return sidebar;
  const top = SORT_OPTIONS.find((o) => o.key === sortKey)?.sortBy ?? 'default';
  return top === 'default' ? undefined : top;
}

function buildListParams(
  page: number,
  filters: InnerCourseFilterValue,
  sortKey: string,
  institutionId?: number,
) {
  return {
    page,
    size: 15,
    isOpen: false as const,
    categoryIds: filters.categoryId ? [filters.categoryId] : undefined,
    sortBy: resolveSortBy(filters, sortKey),
    institutionId,
    trainerIndustryCategoryId: filters.industryCategoryId,
    trainerProvinceId: filters.trainerProvinceId,
    trainerIsTrusted: filters.trainerTrusted ? 1 : undefined,
    trainerHasCopyright: filters.trainerHasCopyright ? 1 : undefined,
  };
}

export function InnerCourseListSection(props: InnerCourseListSectionProps) {
  return (
    <Suspense fallback={<div className="min-h-[320px] animate-pulse rounded-xl bg-slate-100" />}>
      <InnerCourseListSectionInner {...props} />
    </Suspense>
  );
}

function InnerCourseListSectionInner({
  initialData,
  categoryTree,
  industryTree,
  initialInstitutionId,
  initialInstitutionName,
  initialCategoryId,
  initialCategoryName,
}: InnerCourseListSectionProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState<InnerCourseFilterValue>(() => ({
    categoryId: initialCategoryId,
    categoryName: initialCategoryName,
  }));
  const [institutionId, setInstitutionId] = useState<number | undefined>(initialInstitutionId);
  const [sortKey, setSortKey] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const fetchData = useCallback(
    (
      page: number,
      newFilters?: InnerCourseFilterValue,
      overrideSortKey?: string,
      overrideInstitutionId?: number | null,
    ) => {
      const f = newFilters ?? filters;
      const sort = overrideSortKey ?? sortKey;
      const instId =
        overrideInstitutionId === null
          ? undefined
          : overrideInstitutionId !== undefined
            ? overrideInstitutionId
            : institutionId;

      startTransition(async () => {
        try {
          const result = await getCourseList(buildListParams(page, f, sort, instId));
          setData(result);
          setCurrentPage(page);
        } catch (e) {
          console.error('加载内训课列表失败:', e);
        }
      });
    },
    [filters, sortKey, institutionId],
  );

  const { commitPageChange } = useListPageUrlSync({
    currentPage,
    onPageFromUrl: (page) => fetchData(page),
  });

  const handleClearInstitution = useCallback(() => {
    setInstitutionId(undefined);
    fetchData(1, filters, undefined, null);
    router.replace('/inhousecourse');
  }, [fetchData, filters, router]);

  const handleFilterChange = useCallback(
    (newFilters: InnerCourseFilterValue) => {
      setFilters(newFilters);
      commitPageChange(1);
      fetchData(1, newFilters);
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

  const filterChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => InnerCourseFilterValue }[] = [];
    if (filters.categoryName) {
      chips.push({
        key: 'category',
        label: `分类：${filters.categoryName}`,
        onRemove: () => ({ ...filters, categoryId: undefined, categoryName: undefined }),
      });
    }
    if (filters.industryCategoryName) {
      chips.push({
        key: 'industry',
        label: `行业：${filters.industryCategoryName}`,
        onRemove: () => ({
          ...filters,
          industryCategoryId: undefined,
          industryCategoryName: undefined,
        }),
      });
    }
    if (filters.trainerProvinceName) {
      chips.push({
        key: 'province',
        label: `城市：${filters.trainerProvinceName}`,
        onRemove: () => ({
          ...filters,
          trainerProvinceId: undefined,
          trainerProvinceName: undefined,
        }),
      });
    }
    if (filters.sortLabel) {
      chips.push({
        key: 'sort',
        label: filters.sortLabel,
        onRemove: () => ({ ...filters, sortBy: undefined, sortLabel: undefined }),
      });
    }
    if (filters.trainerHasCopyright) {
      chips.push({
        key: 'copyright',
        label: '独家讲师',
        onRemove: () => ({ ...filters, trainerHasCopyright: undefined }),
      });
    }
    if (filters.trainerTrusted) {
      chips.push({
        key: 'trusted',
        label: '平台认证',
        onRemove: () => ({ ...filters, trainerTrusted: undefined }),
      });
    }
    return chips;
  }, [filters]);

  return (
    <div className="flex gap-6 items-start">
      <InnerCourseFilters
        categoryTree={categoryTree}
        industryTree={industryTree}
        value={filters}
        onChange={handleFilterChange}
      />

      <div className="flex-1 flex flex-col gap-4">
        {(institutionId && initialInstitutionName) || filterChips.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-slate-500">当前筛选：</span>
            {institutionId && initialInstitutionName && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs">
                机构：{initialInstitutionName}
                <button
                  type="button"
                  onClick={handleClearInstitution}
                  className="hover:text-primary/70 inline-flex items-center"
                  aria-label="清除机构筛选"
                >
                  <X className="size-3" />
                </button>
              </span>
            )}
            {filterChips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs"
              >
                {chip.label}
                <button
                  type="button"
                  onClick={() => handleFilterChange(chip.onRemove())}
                  className="hover:text-primary/70 inline-flex items-center"
                  aria-label={`清除${chip.label}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-2 flex items-center gap-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => handleSortChange(opt.key)}
              className={`px-6 py-2 rounded-lg text-sm transition-colors inline-flex items-center gap-1 ${
                sortKey === opt.key && !filters.sortBy
                  ? 'font-bold text-primary bg-primary/5'
                  : 'font-medium text-slate-600 hover:bg-slate-50'
              }`}
            >
              {opt.label}
              <ArrowUpDown className="size-3.5" />
            </button>
          ))}
          <span className="ml-auto text-sm text-slate-500 pr-2">
            共 <strong className="text-slate-900">{data.total}</strong> 门课程
          </span>
        </div>

        <div className={`flex flex-col gap-3 transition-opacity ${isPending ? 'opacity-50' : ''}`}>
          {data.list.length > 0 ? (
            data.list.map((course) => <InnerCourseCard key={course.id} course={course} />)
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
              暂无内训课程
            </div>
          )}
        </div>

        <ListPagePagination
          currentPage={currentPage}
          totalPages={data.totalPages}
          onPageChange={handlePageChange}
          className="mt-6"
        />
      </div>
    </div>
  );
}
