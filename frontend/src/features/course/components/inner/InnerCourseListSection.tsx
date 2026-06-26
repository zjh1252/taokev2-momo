'use client';

import { Suspense, useState, useCallback, useTransition, useMemo, useEffect, useRef } from 'react';
import { ArrowUpDown, X } from 'lucide-react';
import { ListPagePagination } from '@/components/list-page-pagination';
import { useListPageUrlSync } from '@/hooks/use-list-page-url';
import { InnerCourseCard } from './InnerCourseCard';
import { InnerCourseFilters, type InnerCourseFilterValue } from './InnerCourseFilters';
import { getCourseList } from '../../api/service';
import type { CourseListItem, PageResponse, CategoryTreeNode } from '../../api/types';
import { ListBottomCategoryNav } from '@/components/layout/list-bottom-category-nav';
import type { ChannelCategoryNavItem } from '@/components/layout/channel-category-nav';
import { parseCourseCategoryIdFromHref } from '@/lib/parse-category-nav-href';
import { getBrowserPathname, navigateToSeoPath, replaceBrowserUrl, setPageParam } from '@/lib/sync-list-filter-url';

interface InnerCourseListSectionProps {
  initialData: PageResponse<CourseListItem>;
  categoryTree: CategoryTreeNode[];
  initialInstitutionId?: number;
  initialInstitutionName?: string;
  initialCategoryId?: number;
  initialCategoryName?: string;
  bottomCategoryNav?: {
    title: string;
    countUnit: string;
    itemsPromise: Promise<ChannelCategoryNavItem[]>;
  };
}

const SORT_OPTIONS = [
  { key: 'default', label: '默认', sortBy: 'default' },
  { key: 'viewCount', label: '人气', sortBy: 'viewCount' },
  { key: 'time', label: '发布时间', sortBy: 'time' },
  { key: 'rating', label: '评分', sortBy: 'score' },
];

function resolveSortBy(sortKey: string): string | undefined {
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
    sortBy: resolveSortBy(sortKey),
    institutionId,
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
  initialInstitutionId,
  initialInstitutionName,
  initialCategoryId,
  initialCategoryName,
  bottomCategoryNav,
}: InnerCourseListSectionProps) {
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState<InnerCourseFilterValue>(() => ({
    categoryId: initialCategoryId,
    categoryName: initialCategoryName,
  }));
  const [institutionId, setInstitutionId] = useState<number | undefined>(initialInstitutionId);
  const [sortKey, setSortKey] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const serverFilterKey = useMemo(
    () =>
      JSON.stringify({
        categoryId: initialCategoryId ?? null,
        institutionId: initialInstitutionId ?? null,
      }),
    [initialCategoryId, initialInstitutionId],
  );
  const serverFilterKeyRef = useRef(serverFilterKey);

  useEffect(() => {
    if (serverFilterKeyRef.current === serverFilterKey) {
      return;
    }
    serverFilterKeyRef.current = serverFilterKey;
    startTransition(() => {
      setData(initialData);
      setCurrentPage(initialData.page ?? 1);
      setFilters({
        categoryId: initialCategoryId,
        categoryName: initialCategoryName,
      });
      setInstitutionId(initialInstitutionId);
    });
  }, [
    serverFilterKey,
    initialData,
    initialCategoryId,
    initialCategoryName,
    initialInstitutionId,
    startTransition,
  ]);

  const syncUrl = useCallback(
    (page: number, f: InnerCourseFilterValue) => {
      const params = new URLSearchParams();
      if (institutionId) {
        params.set('institutionId', String(institutionId));
      }
      if (f.categoryId) {
        params.set('categoryIds', String(f.categoryId));
        if (f.categoryName) {
          params.set('categoryName', f.categoryName);
        }
      }
      setPageParam(params, page);
      replaceBrowserUrl(getBrowserPathname(), params);
    },
    [institutionId],
  );

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
    navigateToSeoPath('/inhousecourse');
  }, [fetchData, filters]);

  const handleFilterChange = useCallback(
    (newFilters: InnerCourseFilterValue) => {
      setFilters(newFilters);
      syncUrl(1, newFilters);
      fetchData(1, newFilters);
    },
    [fetchData, syncUrl],
  );

  const handleSortChange = useCallback(
    (key: string) => {
      setSortKey(key);
      fetchData(1, filters, key);
    },
    [fetchData, filters],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      syncUrl(page, filters);
      fetchData(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [fetchData, syncUrl, filters],
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

  const handleBottomCategoryClick = useCallback(
    (item: ChannelCategoryNavItem) => {
      const categoryId = parseCourseCategoryIdFromHref(item.href);
      if (!categoryId) return;
      handleFilterChange({
        ...filters,
        categoryId,
        categoryName: item.name,
      });
    },
    [filters, handleFilterChange],
  );

  return (
    <div className="flex flex-col gap-6">
    <div className="flex gap-6 items-start">
      <InnerCourseFilters
        categoryTree={categoryTree}
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
                sortKey === opt.key
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
      {bottomCategoryNav ? (
        <ListBottomCategoryNav
          title={bottomCategoryNav.title}
          countUnit={bottomCategoryNav.countUnit}
          itemsPromise={bottomCategoryNav.itemsPromise}
          onItemClick={handleBottomCategoryClick}
        />
      ) : null}
    </div>
  );
}
