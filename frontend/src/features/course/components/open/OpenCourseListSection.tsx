'use client';

import { Suspense, useState, useCallback, useTransition, useMemo, useEffect, useRef } from 'react';
import { ArrowUpDown, X, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { ListPagePagination } from '@/components/list-page-pagination';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useListPageUrlSync } from '@/hooks/use-list-page-url';
import { OpenCourseCard } from './OpenCourseCard';
import { OpenCourseFilters, type OpenCourseFilterValue } from './OpenCourseFilters';
import { CourseListPromoSidebar } from '../CourseListPromoSidebar';
import { getCourseList } from '../../api/service';
import type { CourseListItem, PageResponse, CategoryTreeNode } from '../../api/types';
import { ListBottomCategoryNav } from '@/components/layout/list-bottom-category-nav';
import type { ChannelCategoryNavItem } from '@/components/layout/channel-category-nav';
import { parseCourseCategoryIdFromHref } from '@/lib/parse-category-nav-href';
import { getBrowserPathname, navigateToSeoPath, replaceBrowserUrl, setPageParam } from '@/lib/sync-list-filter-url';
import {
  appendOpenCourseTimePriceParams,
  hasOpenCourseBrowserFilter,
  openCourseBrowserDiffersFromSsr,
  readOpenCourseFiltersFromBrowser,
} from './open-course-list-url';

const TIME_QUICK_LABELS: Record<string, string> = {
  thisWeek: '本周内',
  thisMonth: '本月内',
  nextThreeMonths: '近三个月',
};

interface OpenCourseListSectionProps {
  initialData: PageResponse<CourseListItem>;
  categoryTree: CategoryTreeNode[];
  initialInstitutionId?: number;
  initialInstitutionName?: string;
  /**
   * 锁定的城市 ID 集合（来自 /cities/[pinyin] 跳转），不在左侧筛选器里出现，
   * 与 institutionId 类似：作为「上下文」固定参与查询；点 chip 上的 X 后跳回 /opencourse 清除。
   */
  initialCityIds?: number[];
  /** 锁定城市的展示名集合，与 initialCityIds 一一对应（chip 文本「开课城市：南通」） */
  initialCityNames?: string[];
  /** 来自底部分类导航或 URL 的初始分类筛选 */
  initialCategoryIds?: number[];
  initialCategoryNames?: string[];
  /** 来自 URL 的初始开课省份筛选 */
  initialProvinceIds?: number[];
  initialProvinceNames?: string[];
  /** 来自 URL 的开课时间 / 价格筛选 */
  initialTimeQuick?: string;
  initialTimeQuickLabel?: string;
  initialStartTimeFrom?: string;
  initialStartTimeTo?: string;
  initialPriceLabel?: string;
  initialPriceMin?: number;
  initialPriceMax?: number;
  initialIsFree?: number;
  bottomCategoryNav?: {
    title: string;
    countUnit: string;
    itemsPromise: Promise<ChannelCategoryNavItem[]>;
  };
}

const SORT_OPTIONS = [
  { key: 'default', label: '默认', sortBy: 'default' },
  { key: 'time', label: '开课时间', sortBy: 'time' },
  { key: 'price', label: '价格', sortBy: 'price' },
  { key: 'review', label: '评价', sortBy: 'score' },
];

/** 已选 chip 单项 */
interface ActiveChip {
  /** 唯一 key 用于 react map */
  key: string;
  /** 展示文字（如 "分类：管理培训"） */
  label: string;
  /** 点击 X 时调用：返回需要 patch 的 filter 字段（多个字段一起重置） */
  onRemove: () => OpenCourseFilterValue;
}

export function OpenCourseListSection(props: OpenCourseListSectionProps) {
  return (
    <Suspense fallback={<div className="min-h-[320px] animate-pulse rounded-xl bg-slate-100" />}>
      <OpenCourseListSectionInner {...props} />
    </Suspense>
  );
}

function OpenCourseListSectionInner({
  initialData,
  categoryTree,
  initialInstitutionId,
  initialInstitutionName,
  initialCityIds,
  initialCityNames,
  initialCategoryIds,
  initialCategoryNames,
  initialProvinceIds,
  initialProvinceNames,
  initialTimeQuick,
  initialTimeQuickLabel,
  initialStartTimeFrom,
  initialStartTimeTo,
  initialPriceLabel,
  initialPriceMin,
  initialPriceMax,
  initialIsFree,
  bottomCategoryNav,
}: OpenCourseListSectionProps) {
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState<OpenCourseFilterValue>(() => ({
    categoryIds: initialCategoryIds,
    categoryNames: initialCategoryNames,
    provinceIds: initialProvinceIds,
    provinceNames: initialProvinceNames,
    timeQuick: initialTimeQuick,
    timeQuickLabel: initialTimeQuickLabel
      ?? (initialTimeQuick ? TIME_QUICK_LABELS[initialTimeQuick] : undefined),
    startTimeFrom: initialStartTimeFrom,
    startTimeTo: initialStartTimeTo,
    priceLabel: initialPriceLabel,
    priceMin: initialPriceMin,
    priceMax: initialPriceMax,
    isFree: initialIsFree,
  }));
  const [institutionId, setInstitutionId] = useState<number | undefined>(initialInstitutionId);
  /** 锁定城市 IDs：来自城市频道页跳转，存在时随每次查询一起送给后端 */
  const [lockedCityIds, setLockedCityIds] = useState<number[] | undefined>(
    initialCityIds && initialCityIds.length > 0 ? initialCityIds : undefined,
  );
  const [lockedCityNames, setLockedCityNames] = useState<string[] | undefined>(
    initialCityNames && initialCityNames.length > 0 ? initialCityNames : undefined,
  );
  // 排序由顶部排序栏唯一控制
  const [sortKey, setSortKey] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const restoredFromBrowserRef = useRef(false);

  const serverFilterKey = useMemo(
    () =>
      JSON.stringify({
        categoryIds: initialCategoryIds ?? [],
        provinceIds: initialProvinceIds ?? [],
        institutionId: initialInstitutionId ?? null,
        cityIds: initialCityIds ?? [],
        timeQuick: initialTimeQuick ?? null,
        startTimeFrom: initialStartTimeFrom ?? null,
        startTimeTo: initialStartTimeTo ?? null,
        priceMin: initialPriceMin ?? null,
        priceMax: initialPriceMax ?? null,
        isFree: initialIsFree ?? null,
      }),
    [
      initialCategoryIds,
      initialProvinceIds,
      initialInstitutionId,
      initialCityIds,
      initialTimeQuick,
      initialStartTimeFrom,
      initialStartTimeTo,
      initialPriceMin,
      initialPriceMax,
      initialIsFree,
    ],
  );
  const serverFilterKeyRef = useRef(serverFilterKey);

  /**
   * SSR 导航（带 categoryIds 等查询参数）时同步列表与筛选。
   * 详情页浏览器返回后：地址栏可能仍有筛选而 SSR 为空——交由下方 URL/popstate 恢复，勿用空 SSR 覆盖。
   */
  useEffect(() => {
    if (serverFilterKeyRef.current === serverFilterKey) {
      return;
    }

    const browser = readOpenCourseFiltersFromBrowser();
    const ssrEmpty =
      !(initialCategoryIds?.length)
      && !(initialProvinceIds?.length)
      && initialInstitutionId == null
      && !(initialCityIds?.length)
      && !initialTimeQuick
      && !initialStartTimeFrom
      && !initialStartTimeTo
      && initialPriceMin == null
      && initialPriceMax == null
      && initialIsFree == null;
    if (hasOpenCourseBrowserFilter(browser) && ssrEmpty) {
      serverFilterKeyRef.current = serverFilterKey;
      return;
    }

    serverFilterKeyRef.current = serverFilterKey;
    restoredFromBrowserRef.current = false;
    startTransition(() => {
      setData(initialData);
      setCurrentPage(initialData.page ?? 1);
      setFilters({
        categoryIds: initialCategoryIds,
        categoryNames: initialCategoryNames,
        provinceIds: initialProvinceIds,
        provinceNames: initialProvinceNames,
        timeQuick: initialTimeQuick,
        timeQuickLabel: initialTimeQuickLabel
          ?? (initialTimeQuick ? TIME_QUICK_LABELS[initialTimeQuick] : undefined),
        startTimeFrom: initialStartTimeFrom,
        startTimeTo: initialStartTimeTo,
        priceLabel: initialPriceLabel,
        priceMin: initialPriceMin,
        priceMax: initialPriceMax,
        isFree: initialIsFree,
      });
      setInstitutionId(initialInstitutionId);
      setLockedCityIds(
        initialCityIds && initialCityIds.length > 0 ? initialCityIds : undefined,
      );
      setLockedCityNames(
        initialCityNames && initialCityNames.length > 0 ? initialCityNames : undefined,
      );
    });
  }, [
    serverFilterKey,
    initialData,
    initialCategoryIds,
    initialCategoryNames,
    initialProvinceIds,
    initialProvinceNames,
    initialTimeQuick,
    initialTimeQuickLabel,
    initialStartTimeFrom,
    initialStartTimeTo,
    initialPriceLabel,
    initialPriceMin,
    initialPriceMax,
    initialIsFree,
    initialInstitutionId,
    initialCityIds,
    initialCityNames,
    startTransition,
  ]);

  const syncUrl = useCallback(
    (
      page: number,
      f: OpenCourseFilterValue,
      nextInstitutionId = institutionId,
      nextLockedCityIds = lockedCityIds,
      nextLockedCityNames = lockedCityNames,
    ) => {
      const params = new URLSearchParams();
      if (nextInstitutionId) {
        params.set('institutionId', String(nextInstitutionId));
      }
      if (nextLockedCityIds?.length) {
        nextLockedCityIds.forEach((id, idx) => {
          params.append('cityIds', String(id));
          const name = nextLockedCityNames?.[idx];
          if (name) params.append('cityName', name);
        });
      }
      f.categoryIds?.forEach((id, idx) => {
        params.append('categoryIds', String(id));
        const name = f.categoryNames?.[idx];
        if (name) params.append('categoryName', name);
      });
      f.provinceIds?.forEach((id, idx) => {
        params.append('provinceIds', String(id));
        const name = f.provinceNames?.[idx];
        if (name) params.append('provinceName', name);
      });
      appendOpenCourseTimePriceParams(params, f);
      setPageParam(params, page);
      replaceBrowserUrl(getBrowserPathname(), params);
    },
    [institutionId, lockedCityIds, lockedCityNames],
  );

  const fetchData = useCallback(
    (
      page: number,
      newFilters?: OpenCourseFilterValue,
      overrideSortKey?: string,
      overrideInstitutionId?: number | null,
      overrideLockedCityIds?: number[] | null,
    ) => {
      const f = newFilters ?? filters;
      const sort = overrideSortKey ?? sortKey;
      const instId =
        overrideInstitutionId === null
          ? undefined
          : overrideInstitutionId !== undefined
            ? overrideInstitutionId
            : institutionId;
      const cityIds =
        overrideLockedCityIds === null
          ? undefined
          : overrideLockedCityIds !== undefined
            ? overrideLockedCityIds
            : lockedCityIds;
      const sortByValue = SORT_OPTIONS.find((o) => o.key === sort)?.sortBy ?? 'default';
      const effectiveSortBy = sortByValue !== 'default' ? sortByValue : undefined;

      startTransition(async () => {
        try {
          const result = await getCourseList({
            page,
            size: 15,
            isOpen: true,
            categoryIds: f.categoryIds,
            sortBy: effectiveSortBy,
            institutionId: instId,
            provinceIds: f.provinceIds,
            cityIds,
            timeQuick: f.timeQuick,
            startTimeFrom: f.startTimeFrom,
            startTimeTo: f.startTimeTo,
            priceMin: f.priceMin,
            priceMax: f.priceMax,
            isFree: f.isFree,
          });
          setData(result);
          setCurrentPage(page);
        } catch (e) {
          console.error('加载公开课列表失败:', e);
        }
      });
    },
    [filters, sortKey, institutionId, lockedCityIds],
  );

  const applyBrowserFilters = useCallback(() => {
    const browser = readOpenCourseFiltersFromBrowser();
    restoredFromBrowserRef.current = hasOpenCourseBrowserFilter(browser);
    setFilters(browser.filters);
    setInstitutionId(browser.institutionId);
    setLockedCityIds(browser.lockedCityIds);
    setLockedCityNames(browser.lockedCityNames);
    setCurrentPage(browser.page);
    fetchData(
      browser.page,
      browser.filters,
      undefined,
      browser.institutionId ?? null,
      browser.lockedCityIds ?? null,
    );
  }, [fetchData]);

  /** 挂载 / 浏览器后退：以地址栏为准恢复筛选（详情返回后 SSR 常为空） */
  useEffect(() => {
    const browser = readOpenCourseFiltersFromBrowser();
    if (
      hasOpenCourseBrowserFilter(browser)
      && openCourseBrowserDiffersFromSsr(browser, {
        categoryIds: initialCategoryIds,
        provinceIds: initialProvinceIds,
        institutionId: initialInstitutionId,
        cityIds: initialCityIds,
        page: initialData.page ?? 1,
        timeQuick: initialTimeQuick,
        startTimeFrom: initialStartTimeFrom,
        startTimeTo: initialStartTimeTo,
        priceMin: initialPriceMin,
        priceMax: initialPriceMax,
        isFree: initialIsFree,
      })
    ) {
      restoredFromBrowserRef.current = true;
      applyBrowserFilters();
    }

    const onPopState = () => {
      applyBrowserFilters();
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) applyBrowserFilters();
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

  useListPageUrlSync({
    currentPage,
    onPageFromUrl: (page) => fetchData(page),
  });

  const handleClearInstitution = useCallback(() => {
    setInstitutionId(undefined);
    fetchData(1, undefined, undefined, null);
    navigateToSeoPath('/opencourse');
  }, [fetchData]);

  /** 清除锁定城市，跳回不带 cityIds 的 /opencourse */
  const handleClearCity = useCallback(() => {
    setLockedCityIds(undefined);
    setLockedCityNames(undefined);
    navigateToSeoPath('/opencourse');
  }, []);

  const handleFilterChange = useCallback(
    (newFilters: OpenCourseFilterValue) => {
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

  const handleResetAll = useCallback(() => {
    const cleared: OpenCourseFilterValue = {};
    setFilters(cleared);
    setSortKey('default');
    syncUrl(1, cleared);
    fetchData(1, cleared, 'default');
  }, [fetchData, syncUrl]);

  // 当前已激活的过滤 chips（城市、机构、分类、省、时间、价格、报名状态）
  const activeChips = useMemo<ActiveChip[]>(() => {
    const chips: ActiveChip[] = [];
    // 锁定城市 chips（从城市频道页跳转而来）
    if (lockedCityIds && lockedCityIds.length > 0) {
      lockedCityIds.forEach((id, idx) => {
        const name = lockedCityNames?.[idx] ?? `#${id}`;
        chips.push({
          key: `locked-city-${id}`,
          label: `开课城市：${name}`,
          onRemove: () => filters,
        });
      });
    }
    if (institutionId && initialInstitutionName) {
      chips.push({
        key: 'institution',
        label: `机构：${initialInstitutionName}`,
        onRemove: () => filters,
      });
    }
    // 多选分类：每个 id 一个 chip，独立移除
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      filters.categoryIds.forEach((id, idx) => {
        const name = filters.categoryNames?.[idx] ?? `#${id}`;
        chips.push({
          key: `category-${id}`,
          label: `分类：${name}`,
          onRemove: () => {
            const ids = (filters.categoryIds ?? []).filter((x) => x !== id);
            const names = (filters.categoryNames ?? []).filter((_, i) => i !== idx);
            return {
              ...filters,
              categoryIds: ids.length > 0 ? ids : undefined,
              categoryNames: names.length > 0 ? names : undefined,
            };
          },
        });
      });
    }
    // 多选省份：每个 id 一个 chip
    if (filters.provinceIds && filters.provinceIds.length > 0) {
      filters.provinceIds.forEach((id, idx) => {
        const name = filters.provinceNames?.[idx] ?? `#${id}`;
        chips.push({
          key: `province-${id}`,
          label: `开课省市：${name}`,
          onRemove: () => {
            const ids = (filters.provinceIds ?? []).filter((x) => x !== id);
            const names = (filters.provinceNames ?? []).filter((_, i) => i !== idx);
            return {
              ...filters,
              provinceIds: ids.length > 0 ? ids : undefined,
              provinceNames: names.length > 0 ? names : undefined,
            };
          },
        });
      });
    }
    if (filters.timeQuick) {
      chips.push({
        key: 'timeQuick',
        label: `开课时间：${filters.timeQuickLabel ?? TIME_QUICK_LABELS[filters.timeQuick] ?? filters.timeQuick}`,
        onRemove: () => ({ ...filters, timeQuick: undefined, timeQuickLabel: undefined }),
      });
    }
    if (filters.startTimeFrom || filters.startTimeTo) {
      const range = `${filters.startTimeFrom ?? '不限'} ~ ${filters.startTimeTo ?? '不限'}`;
      chips.push({
        key: 'timeRange',
        label: `开课时间：${range}`,
        onRemove: () => ({ ...filters, startTimeFrom: undefined, startTimeTo: undefined }),
      });
    }
    if (filters.priceLabel || filters.priceMin !== undefined || filters.priceMax !== undefined || filters.isFree) {
      const label = filters.isFree === 1
        ? '免费'
        : filters.priceLabel
          ? filters.priceLabel
          : `${filters.priceMin ?? '不限'} - ${filters.priceMax ?? '不限'}`;
      chips.push({
        key: 'price',
        label: `价格：${label}`,
        onRemove: () => ({
          ...filters,
          priceLabel: undefined,
          priceMin: undefined,
          priceMax: undefined,
          isFree: undefined,
        }),
      });
    }
    return chips;
  }, [filters, institutionId, initialInstitutionName, lockedCityIds, lockedCityNames]);

  const handleRemoveChip = (chip: ActiveChip) => {
    if (chip.key === 'institution') {
      handleClearInstitution();
      return;
    }
    if (chip.key.startsWith('locked-city-')) {
      handleClearCity();
      return;
    }
    const next = chip.onRemove();
    handleFilterChange(next);
  };

  const handleBottomCategoryClick = useCallback(
    (item: ChannelCategoryNavItem) => {
      const categoryId = parseCourseCategoryIdFromHref(item.href);
      if (!categoryId) return;
      handleFilterChange({
        ...filters,
        categoryIds: [categoryId],
        categoryNames: [item.name],
      });
    },
    [filters, handleFilterChange],
  );

  return (
    <div className="flex max-w-full flex-col gap-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6 lg:items-start">
      <div className="lg:hidden">
        <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm"
          >
            <SlidersHorizontal className="size-4" />
            筛选课程
          </button>
          <SheetContent side="bottom" className="max-h-[82vh] gap-0 overflow-y-auto rounded-t-xl p-0">
            <SheetHeader className="border-b border-slate-100 px-4 py-3">
              <SheetTitle>筛选课程</SheetTitle>
            </SheetHeader>
            <div className="p-4">
              <OpenCourseFilters
                categoryTree={categoryTree}
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

      <div className="hidden w-[300px] shrink-0 sticky top-[120px] self-start z-30 flex-col gap-10 lg:flex">
        <OpenCourseFilters
          categoryTree={categoryTree}
          value={filters}
          onChange={handleFilterChange}
        />
        <CourseListPromoSidebar variant="open" />
      </div>

      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* 排序栏 + 已选条件（滚动时冻结） */}
        <div className="sticky top-[120px] z-20 space-y-4 pb-1">
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto rounded-xl border border-slate-100 bg-white p-2 shadow-sm">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleSortChange(opt.key)}
              className={`inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg px-4 py-2 text-sm transition-colors sm:px-6 ${
                sortKey === opt.key
                  ? 'bg-primary/5 font-bold text-primary'
                  : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-primary'
              }`}
            >
              {opt.label}
              <ArrowUpDown className="size-3.5" />
            </button>
          ))}
          <span className="ml-auto shrink-0 pr-1 text-sm text-slate-500 sm:pr-2">
            共 <strong className="text-slate-900">{data.total}</strong> 门课程
          </span>
        </div>

        {/* 已选过滤条件 chips 行 */}
        {activeChips.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-3 py-2.5 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 shrink-0">已选条件：</span>
            {activeChips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs"
              >
                {chip.label}
                <button
                  type="button"
                  onClick={() => handleRemoveChip(chip)}
                  className="hover:text-primary/70 inline-flex items-center cursor-pointer"
                  aria-label={`移除 ${chip.label}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={handleResetAll}
              className="ml-auto inline-flex items-center gap-1 text-xs text-slate-500 hover:text-primary transition-colors cursor-pointer"
            >
              <RotateCcw className="size-3" />
              重置
            </button>
          </div>
        )}
        </div>

        {/* 列表 */}
        <div className={`flex flex-col gap-3 transition-opacity ${isPending ? 'opacity-50' : ''}`}>
          {data.list.length > 0 ? (
            data.list.map((course) => <OpenCourseCard key={course.id} course={course} />)
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
              暂无公开课程
            </div>
          )}
        </div>

        {/* 分页 */}
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

