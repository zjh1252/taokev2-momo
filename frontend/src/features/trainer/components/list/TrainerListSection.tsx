'use client';

import { Suspense, useState, useCallback, useTransition, useEffect, useMemo } from 'react';
import { ListPagePagination } from '@/components/list-page-pagination';
import { TrainerFilters, type TrainerFilterValue } from './TrainerFilters';
import { TrainerCard } from './TrainerCard';
import { TrainerRecommendedScroller } from './TrainerRecommendedScroller';
import { TrainerCaseScroller } from './TrainerCaseScroller';
import { TrainerCategoryExpertBar } from './TrainerCategoryExpertBar';
import { TrainerSortBar } from './TrainerSortBar';
import { getTrainerList, type RecentTrainerCase } from '../../api/service';
import { filtersToHtmPath, type TrainerSlugParams } from '../../utils/url';
import type { TrainerListItem, CategoryTreeNode, PageResponse } from '../../types';

interface TrainerListSectionProps {
  initialData: PageResponse<TrainerListItem>;
  expertiseTree: CategoryTreeNode[];
  industryTree: CategoryTreeNode[];
  recommendedTrainers: TrainerListItem[];
  recentCases: RecentTrainerCase[];
  /** 擅长领域筛选且后台已配置时的领域推荐专家 */
  categoryExpertTrainers?: TrainerListItem[];
  /** .htm URL 解析后的初始筛选参数 */
  initialSlugParams?: TrainerSlugParams;
  /** 锁定城市 ID（城市子频道列表） */
  lockedCityId?: number;
}

export function TrainerListSection(props: TrainerListSectionProps) {
  return (
    <Suspense fallback={<div className="min-h-[320px] animate-pulse rounded-xl bg-slate-100" />}>
      <TrainerListSectionInner {...props} />
    </Suspense>
  );
}

function slugToFilter(p: TrainerSlugParams): TrainerFilterValue {
  // field 值为 "一级_二级" 或 "一级"
  const fieldParts = (p.field || '').split('_');
  return {
    fieldParentName: fieldParts[0] || undefined,
    fieldChildName: fieldParts[1] || undefined,
    industryName: p.industry || undefined,
    regionName: p.region || undefined,
  };
}

function filterToFieldParam(f: TrainerFilterValue): string | undefined {
  if (f.fieldParentName && f.fieldChildName) return `${f.fieldParentName}_${f.fieldChildName}`;
  if (f.fieldParentName) return f.fieldParentName;
  return undefined;
}

/** 从分类树中按一级+二级名称查找分类ID */
function findCategoryId(
  tree: CategoryTreeNode[],
  parentName: string,
  childName?: string,
): number | undefined {
  for (const lvl1 of tree) {
    if (lvl1.name === parentName) {
      if (!childName) return lvl1.id;
      if (lvl1.children) {
        const child = lvl1.children.find((c) => c.name === childName);
        if (child) return child.id;
      }
    }
  }
  return undefined;
}

/** 从分类树中按名称查找（行业单选：先匹配一级，再搜索二级） */
function findCategoryIdByName(tree: CategoryTreeNode[], name: string): number | undefined {
  for (const lvl1 of tree) {
    if (lvl1.name === name) return lvl1.id;
    if (lvl1.children) {
      const child = lvl1.children.find((c) => c.name === name);
      if (child) return child.id;
    }
  }
  return undefined;
}

function TrainerListSectionInner({
  initialData,
  expertiseTree,
  industryTree,
  recommendedTrainers,
  recentCases,
  categoryExpertTrainers = [],
  initialSlugParams,
  lockedCityId,
}: TrainerListSectionProps) {
  const initialFilters = useMemo(() => slugToFilter(initialSlugParams || {}), [initialSlugParams]);

  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState<TrainerFilterValue>(initialFilters);
  const [sort, setSort] = useState<string>('default');
  const [currentPage, setCurrentPage] = useState(initialData.page ?? 1);
  const [isPending, startTransition] = useTransition();

  /** SSR 刷新/软导航时同步数据（浏览器前进后退等场景） */
  useEffect(() => {
    startTransition(() => {
      setData(initialData);
      setCurrentPage(initialData.page ?? 1);
    });
  }, [initialData, startTransition]);

  /** 首次加载时，若 URL 带了 slug 查询参数（proxy 重定向），替换地址栏为 .htm SEO URL */
  useEffect(() => {
    if (initialSlugParams && Object.keys(initialSlugParams).length > 0) {
      syncUrl(initialData.page ?? 1, initialFilters);
    }
    // 仅执行一次（mount 时）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 拉取数据 */
  const fetchData = useCallback(
    (page: number, f: TrainerFilterValue, s: string) => {
      startTransition(async () => {
        try {
          const result = await getTrainerList({
            page,
            size: 16,
            expertiseCategoryId: f.fieldParentName
              ? findCategoryId(expertiseTree, f.fieldParentName, f.fieldChildName)
              : undefined,
            industryCategoryId: f.industryName
              ? findCategoryIdByName(industryTree, f.industryName)
              : undefined,
            provinceId: f.provinceId,
            cityId: lockedCityId,
            sort: s,
            isTrusted: f.trustedOnly ? 1 : undefined,
          });
          setData(result);
          setCurrentPage(page);
        } catch (e) {
          console.error('加载专家列表失败:', e);
        }
      });
    },
    [expertiseTree, industryTree, lockedCityId],
  );

  /** 更新浏览器地址栏（不触发 SSR 导航） */
  const syncUrl = useCallback(
    (page: number, f: TrainerFilterValue) => {
      const slugParams: TrainerSlugParams = {
        field: filterToFieldParam(f),
        industry: f.industryName,
        region: f.regionName,
        page: page > 1 ? page : undefined,
      };
      const url = filtersToHtmPath(slugParams);
      window.history.replaceState(null, '', url);
    },
    [],
  );

  const handleFilterChange = useCallback(
    (next: TrainerFilterValue) => {
      setFilters(next);
      syncUrl(1, next);
      fetchData(1, next, sort);
    },
    [fetchData, syncUrl, sort],
  );

  const handleReset = useCallback(() => {
    const empty: TrainerFilterValue = {};
    setFilters(empty);
    syncUrl(1, empty);
    fetchData(1, empty, sort);
  }, [fetchData, syncUrl, sort]);

  const handleSortChange = useCallback(
    (s: string) => {
      setSort(s);
      syncUrl(1, filters);
      fetchData(1, filters, s);
    },
    [fetchData, syncUrl, filters],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      syncUrl(page, filters);
      fetchData(page, filters, sort);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [fetchData, syncUrl, filters, sort],
  );

  return (
    <div className="flex flex-col gap-4">
      {categoryExpertTrainers.length > 0 ? (
        <TrainerCategoryExpertBar items={categoryExpertTrainers} />
      ) : null}

      <section className="flex gap-6 items-stretch">
        <TrainerFilters
          expertiseTree={expertiseTree}
          industryTree={industryTree}
          value={filters}
          onChange={handleFilterChange}
        />
        <div className="flex-1 min-w-0 flex flex-col gap-2 min-h-0">
          <h2 className="text-sm font-bold text-slate-700 px-1">热门培训领域</h2>
          <div className="flex-1 min-h-0">
            <TrainerRecommendedScroller initialItems={recommendedTrainers} />
          </div>
        </div>
      </section>

      <TrainerCaseScroller initialItems={recentCases} />

      <TrainerSortBar
        sort={sort}
        total={data.total}
        filters={filters}
        onChange={handleSortChange}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
      />

      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity ${isPending ? 'opacity-50' : ''}`}>
        {data.list.length > 0 ? (
          data.list.map((trainer, index) => (
            <TrainerCard
              key={`${currentPage}-${trainer.id}`}
              trainer={trainer}
              priorityImage={index < 6}
            />
          ))
        ) : (
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
            暂无符合条件的专家
          </div>
        )}
      </div>

      <ListPagePagination
        currentPage={currentPage}
        totalPages={data.totalPages}
        onPageChange={handlePageChange}
        className="pt-6 border-t border-slate-200"
      />
    </div>
  );
}
