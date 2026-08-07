'use client';

import { Suspense, useState, useCallback, useTransition, useEffect, useMemo, useRef } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { ListPagePagination } from '@/components/list-page-pagination';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { replaceBrowserHistoryUrl } from '@/lib/sync-list-filter-url';
import { TrainerFilters, type TrainerFilterValue } from './TrainerFilters';
import { TrainerCard } from './TrainerCard';
import { TrainerRecommendedScroller } from './TrainerRecommendedScroller';
import { TrainerCaseScroller } from './TrainerCaseScroller';
import { TrainerCategoryExpertBar } from './TrainerCategoryExpertBar';
import { TrainerSortBar } from './TrainerSortBar';
import { getTrainerList, type RecentTrainerCase } from '../../api/service';
import { filtersToHtmPath, joinFieldValue, type TrainerSlugParams } from '../../utils/url';
import { splitFieldForFilter } from '../../utils/expertise-categories';
import {
  consumeTrainerListScroll,
  hasTrainerSlugState,
  readTrainerListSlugFromBrowser,
  rememberTrainerListPath,
} from '../../utils/list-return';
import type { TrainerListItem, CategoryTreeNode, PageResponse } from '../../types';
import { ListBottomCategoryNav } from '@/components/layout/list-bottom-category-nav';
import type { ChannelCategoryNavItem } from '@/components/layout/channel-category-nav';

function slugParamsEqual(a: TrainerSlugParams, b: TrainerSlugParams): boolean {
  return (
    (a.field || undefined) === (b.field || undefined)
    && (a.industry || undefined) === (b.industry || undefined)
    && (a.region || undefined) === (b.region || undefined)
    && (a.page || 1) === (b.page || 1)
  );
}

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

function slugToFilter(p: TrainerSlugParams, expertiseTree: CategoryTreeNode[]): TrainerFilterValue {
  const fieldParts = splitFieldForFilter(expertiseTree, p.field);
  return {
    fieldParentName: fieldParts.fieldParentName,
    fieldChildName: fieldParts.fieldChildName,
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

function filterToFieldParam(f: TrainerFilterValue, expertiseTree: CategoryTreeNode[]): string | undefined {
  const joined = joinFieldValue(
    f.fieldParentName ?? null,
    f.fieldChildName ?? null,
    expertiseTree,
  );
  return joined || undefined;
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
    () =>
      enrichFilterFromTree(
        slugToFilter(initialSlugParams || {}, expertiseTree),
        expertiseTree,
        industryTree,
      ),
    [initialSlugParams, expertiseTree, industryTree],
  );

  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState<TrainerFilterValue>(initialFilters);
  const [sort, setSort] = useState<string>('default');
  const [currentPage, setCurrentPage] = useState(initialSlugParams?.page ?? initialData.page ?? 1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const sortRef = useRef(sort);
  const pendingScrollRef = useRef<number | null>(null);
  const serverSlugKeyRef = useRef(JSON.stringify(initialSlugParams || {}));
  const restoredFromBrowserRef = useRef(false);

  useEffect(() => {
    sortRef.current = sort;
  }, [sort]);

  /** 当前列表 SEO 路径（供卡片点击写入返回地址） */
  const listReturnPath = useMemo(() => {
    const slugParams: TrainerSlugParams = {
      field: filterToFieldParam(filters, expertiseTree),
      industry: filters.industryName,
      region: filters.regionName,
      page: currentPage > 1 ? currentPage : undefined,
    };
    return filtersToHtmPath(slugParams);
  }, [filters, expertiseTree, currentPage]);

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

  /** 更新浏览器地址栏（保留 history.state，避免详情返回后丢页码/筛选） */
  const syncUrl = useCallback(
    (page: number, f: TrainerFilterValue) => {
      const slugParams: TrainerSlugParams = {
        field: filterToFieldParam(f, expertiseTree),
        industry: f.industryName,
        region: f.regionName,
        page: page > 1 ? page : undefined,
      };
      const url = filtersToHtmPath(slugParams);
      try {
        replaceBrowserHistoryUrl(url);
      } catch (err) {
        // history.state 偶发不可 clone 时，降级为 null state，仍必须写入 URL
        console.warn('[trainer-list] replaceState with history.state failed, fallback', err);
        const current = `${window.location.pathname}${window.location.search}`;
        if (current !== url) {
          window.history.replaceState(null, '', url);
        }
      }
      // 若仍未写入（极端环境），最后再试一次
      if (`${window.location.pathname}${window.location.search}` !== url) {
        window.history.replaceState(null, '', url);
      }
      rememberTrainerListPath(url);
    },
    [expertiseTree],
  );

  /** 按 URL slug 恢复筛选（浏览器后退 / 详情返回后 remount） */
  const applySlugParams = useCallback(
    (slugParams: TrainerSlugParams, opts?: { fetch?: boolean; replaceData?: PageResponse<TrainerListItem> }) => {
      const nextFilters = enrichFilterFromTree(
        slugToFilter(slugParams, expertiseTree),
        expertiseTree,
        industryTree,
      );
      const page = slugParams.page && slugParams.page > 0 ? slugParams.page : 1;
      setFilters(nextFilters);
      setCurrentPage(page);
      rememberTrainerListPath(filtersToHtmPath(slugParams));
      if (opts?.replaceData) {
        setData(opts.replaceData);
      } else if (opts?.fetch !== false) {
        fetchData(page, nextFilters, sortRef.current);
      }
    },
    [expertiseTree, industryTree, fetchData],
  );

  /**
   * SSR 导航（带 slug）时同步列表。
   * 详情页浏览器返回后：地址栏/session 可能仍有筛选而 SSR 为空——以浏览器为准，勿用空 SSR 覆盖。
   */
  useEffect(() => {
    const serverKey = JSON.stringify(initialSlugParams || {});
    const browserSlug = readTrainerListSlugFromBrowser();
    const ssrSlug = initialSlugParams || {};

    if (hasTrainerSlugState(browserSlug) && !slugParamsEqual(browserSlug, ssrSlug)) {
      restoredFromBrowserRef.current = true;
      applySlugParams(browserSlug);
      serverSlugKeyRef.current = serverKey;
      return;
    }

    if (serverSlugKeyRef.current === serverKey && restoredFromBrowserRef.current) {
      return;
    }
    serverSlugKeyRef.current = serverKey;
    restoredFromBrowserRef.current = false;

    startTransition(() => {
      setData(initialData);
      setCurrentPage(ssrSlug.page ?? initialData.page ?? 1);
      setFilters(
        enrichFilterFromTree(
          slugToFilter(ssrSlug, expertiseTree),
          expertiseTree,
          industryTree,
        ),
      );
    });
  }, [initialData, initialSlugParams, expertiseTree, industryTree, applySlugParams, startTransition]);

  /** 首次加载：规范化 SEO URL，恢复滚动，并监听浏览器前进/后退 */
  useEffect(() => {
    const browserSlug = readTrainerListSlugFromBrowser();
    const ssrSlug = initialSlugParams || {};
    pendingScrollRef.current = consumeTrainerListScroll();

    if (hasTrainerSlugState(browserSlug)) {
      syncUrl(browserSlug.page ?? 1, enrichFilterFromTree(
        slugToFilter(browserSlug, expertiseTree),
        expertiseTree,
        industryTree,
      ));
      if (!slugParamsEqual(browserSlug, ssrSlug)) {
        restoredFromBrowserRef.current = true;
        applySlugParams(browserSlug);
      } else {
        rememberTrainerListPath(filtersToHtmPath(browserSlug));
        // SSR 已按 URL 出数时仍对齐一次，避免 hydration 后状态漂移
        if ((browserSlug.page ?? 1) !== (initialData.page ?? 1)) {
          applySlugParams(browserSlug);
        }
      }
    } else if (hasTrainerSlugState(ssrSlug)) {
      syncUrl(ssrSlug.page ?? initialData.page ?? 1, initialFilters);
    } else {
      rememberTrainerListPath('/trainer');
    }

    const restoreFromLocation = () => {
      const next = readTrainerListSlugFromBrowser();
      restoredFromBrowserRef.current = hasTrainerSlugState(next);
      applySlugParams(next);
    };

    const onPopState = () => {
      restoreFromLocation();
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) restoreFromLocation();
    };

    window.addEventListener('popstate', onPopState);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('pageshow', onPageShow);
    };
    // 仅挂载时绑定
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 详情返回：列表页码对齐且加载结束后再恢复滚动位置 */
  useEffect(() => {
    const y = pendingScrollRef.current;
    if (y == null || isPending) return;
    const expectedPage = readTrainerListSlugFromBrowser().page ?? 1;
    if (currentPage !== expectedPage) return;
    pendingScrollRef.current = null;
    const id = window.requestAnimationFrame(() => {
      window.scrollTo({ top: y, behavior: 'auto' });
    });
    return () => window.cancelAnimationFrame(id);
  }, [data, currentPage, isPending]);

  const handleFilterChange = useCallback(
    (next: TrainerFilterValue) => {
      setFilters(next);
      syncUrl(1, next);
      fetchData(1, next, sort);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [fetchData, syncUrl, sort],
  );

  const handleReset = useCallback(() => {
    const empty: TrainerFilterValue = {};
    setFilters(empty);
    syncUrl(1, empty);
    fetchData(1, empty, sort);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchData, syncUrl, sort]);

  const handleSortChange = useCallback(
    (s: string) => {
      setSort(s);
      syncUrl(1, filters);
      fetchData(1, filters, s);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className="flex w-full min-w-0 max-w-full flex-col gap-4 overflow-x-clip">
      {categoryExpertTrainers.length > 0 ? (
        <TrainerCategoryExpertBar items={categoryExpertTrainers} />
      ) : null}

      <section className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:gap-5">
        <div className="lg:hidden">
          <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm"
            >
              <SlidersHorizontal className="size-4" />
              筛选讲师
            </button>
            <SheetContent side="bottom" className="max-h-[82vh] gap-0 overflow-y-auto rounded-t-xl p-0">
              <SheetHeader className="border-b border-slate-100 px-4 py-3">
                <SheetTitle>筛选讲师</SheetTitle>
              </SheetHeader>
              <div className="p-4">
                <TrainerFilters
                  expertiseTree={expertiseTree}
                  industryTree={industryTree}
                  value={filters}
                  onChange={(next) => {
                    handleFilterChange(next);
                    setMobileFilterOpen(false);
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="hidden shrink-0 lg:block">
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
              listReturnPath={listReturnPath}
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
