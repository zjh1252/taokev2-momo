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
import { rememberTrainerListPath } from '../../utils/list-return';
import type { TrainerListItem, CategoryTreeNode, PageResponse } from '../../types';
import { ListBottomCategoryNav } from '@/components/layout/list-bottom-category-nav';
import type { ChannelCategoryNavItem } from '@/components/layout/channel-category-nav';

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
  /** 底部分类导航（页内筛选，与侧栏同款） */
  bottomCategoryNav?: {
    title: string;
    countUnit: string;
    itemsPromise: Promise<ChannelCategoryNavItem[]>;
  };
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

/** 从 slug 名称补全分类 ID，避免仅靠名称匹配产生偏差 */
function enrichFilterFromTree(
  f: TrainerFilterValue,
  expertiseTree: CategoryTreeNode[],
  industryTree: CategoryTreeNode[],
): TrainerFilterValue {
  const expertiseCategoryId = f.expertiseCategoryId ?? (
    f.fieldParentName
      ? findCategoryId(expertiseTree, f.fieldParentName, f.fieldChildName)
      : undefined
  );
  const industryCategoryId = f.industryCategoryId ?? (
    f.industryName ? findCategoryIdByName(industryTree, f.industryName) : undefined
  );
  return { ...f, expertiseCategoryId, industryCategoryId };
}

function resolveExpertiseCategoryId(
  f: TrainerFilterValue,
  expertiseTree: CategoryTreeNode[],
): number | undefined {
  if (f.expertiseCategoryId) return f.expertiseCategoryId;
  if (!f.fieldParentName) return undefined;
  const id = findCategoryId(expertiseTree, f.fieldParentName, f.fieldChildName);
  // 名称无法解析时不传 undefined（会误展示全量），用无效 ID 使结果为空
  return id ?? -1;
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
  bottomCategoryNav,
}: TrainerListSectionProps) {
  const initialFilters = useMemo(
    () => enrichFilterFromTree(slugToFilter(initialSlugParams || {}), expertiseTree, industryTree),
    [initialSlugParams, expertiseTree, industryTree],
  );

  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState<TrainerFilterValue>(initialFilters);
  const [sort, setSort] = useState<string>('default');
  const [currentPage, setCurrentPage] = useState(initialData.page ?? 1);
  const [isPending, startTransition] = useTransition();

  /** SSR 刷新/软导航时同步数据与筛选（底部分类栏跳转、浏览器前进后退等） */
  useEffect(() => {
    const nextFilters = enrichFilterFromTree(
      slugToFilter(initialSlugParams || {}),
      expertiseTree,
      industryTree,
    );
    startTransition(() => {
      setData(initialData);
      setCurrentPage(initialData.page ?? 1);
      setFilters(nextFilters);
    });
  }, [initialData, initialSlugParams, expertiseTree, industryTree, startTransition]);

  /** 首次加载时，若 URL 带了 slug 查询参数（proxy 重定向），替换地址栏为 .htm SEO URL */
  useEffect(() => {
    if (initialSlugParams && Object.keys(initialSlugParams).length > 0) {
      syncUrl(initialData.page ?? 1, initialFilters);
    } else {
      rememberTrainerListPath();
    }
    // 评分回填等后端变更后，客户端再拉一次避免 SSR/软导航残留旧分
    fetchData(initialData.page ?? 1, initialFilters, 'default');
    // 仅执行一次（mount 时）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 拉取数据 */
  const fetchData = useCallback(
    (page: number, f: TrainerFilterValue, s: string) => {
      startTransition(() => {
        void (async () => {
          try {
            const result = await getTrainerList(
              {
                page,
                size: 16,
                expertiseCategoryId: resolveExpertiseCategoryId(f, expertiseTree),
                industryCategoryId: f.industryCategoryId ?? (
                  f.industryName ? findCategoryIdByName(industryTree, f.industryName) : undefined
                ),
                provinceId: f.provinceId,
                cityId: lockedCityId,
                sort: s,
                isTrusted: f.trustedOnly ? 1 : undefined,
              },
              { silent: true },
            );
            setData(result);
            setCurrentPage(page);
          } catch (e) {
            console.error('加载专家列表失败:', e);
          }
        })();
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
      rememberTrainerListPath(url);
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

  const handleBottomCategoryClick = useCallback(
    (item: ChannelCategoryNavItem) => {
      handleFilterChange({
        ...filters,
        fieldParentName: item.name,
        fieldChildName: undefined,
        expertiseCategoryId: item.categoryId,
      });
    },
    [filters, handleFilterChange],
  );

  return (
    <div className="flex flex-col gap-4">
      {categoryExpertTrainers.length > 0 ? (
        <TrainerCategoryExpertBar items={categoryExpertTrainers} />
      ) : null}

      <section className="flex gap-5 items-start">
        <div className="shrink-0">
          <TrainerFilters
            expertiseTree={expertiseTree}
            industryTree={industryTree}
            value={filters}
            onChange={handleFilterChange}
          />
        </div>
        <div className="flex-1 min-w-0 min-h-0">
          <h2 className="sr-only">热门培训领域</h2>
          <TrainerRecommendedScroller initialItems={recommendedTrainers} />
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
