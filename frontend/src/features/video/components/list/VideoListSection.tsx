'use client';

import { Suspense, useState, useCallback, useTransition, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, ArrowUpDown, X } from 'lucide-react';
import { ListPagePagination } from '@/components/list-page-pagination';
import { useListPageUrlSync } from '@/hooks/use-list-page-url';
import { useListKeywordUrl } from '@/hooks/use-list-keyword-url';
import { VideoCard } from './VideoCard';
import { getVideoList } from '../../api/service';
import type { VideoListItem, PageResponse, CategoryTreeNode } from '../../api/types';
import { cn } from '@/lib/utils';
import { ListBottomCategoryNav } from '@/components/layout/list-bottom-category-nav';
import type { ChannelCategoryNavItem } from '@/components/layout/channel-category-nav';
import { parseCourseCategoryIdFromHref } from '@/lib/parse-category-nav-href';
import { getBrowserPathname, navigateToSeoPath, replaceBrowserUrl, setPageParam } from '@/lib/sync-list-filter-url';

interface VideoListSectionProps {
  initialData: PageResponse<VideoListItem>;
  categoryTree: CategoryTreeNode[];
  initialInstitutionId?: number;
  initialInstitutionName?: string;
  initialCategoryId?: number;
  initialCategoryName?: string;
  initialSortBy?: string;
  bottomCategoryNav?: {
    title: string;
    countUnit: string;
    itemsPromise: Promise<ChannelCategoryNavItem[]>;
  };
}

const SORT_OPTIONS = [
  { key: 'default', label: '默认排序', sortBy: 'default' },
  { key: 'time', label: '最新发布', sortBy: 'time' },
  { key: 'studentCount', label: '最多学员', sortBy: 'studentCount' },
  { key: 'viewCount', label: '最多浏览', sortBy: 'viewCount' },
  { key: 'price', label: '价格最低', sortBy: 'price' },
];

const PAGE_SIZE = 15;

type VideoListMode = 'all' | 'featured';

const LIST_MODE_TABS: { key: VideoListMode; label: string }[] = [
  { key: 'all', label: '全部课程' },
  { key: 'featured', label: '精品录播课' },
];

/** 解析当前选中分类对应的一级分类 ID（顶部分类栏高亮用） */
function resolveTopCategoryId(tree: CategoryTreeNode[], categoryId?: number): number | undefined {
  if (!categoryId) return undefined;
  for (const cat of tree) {
    if (cat.id === categoryId) return cat.id;
    if (cat.children?.some((child) => child.id === categoryId)) return cat.id;
  }
  return categoryId;
}

function findCategoryNameById(tree: CategoryTreeNode[], categoryId?: number): string | undefined {
  if (!categoryId) return undefined;
  for (const cat of tree) {
    if (cat.id === categoryId) return cat.name;
    const child = cat.children?.find((item) => item.id === categoryId);
    if (child) return child.name;
  }
  return undefined;
}

function parseOptionalPositiveInt(value: string | null): number | undefined {
  if (!value) return undefined;
  const next = Number(value);
  return Number.isFinite(next) && next > 0 ? next : undefined;
}

/** 从浏览器地址栏读取录播课列表筛选（replaceState 后 Next searchParams 可能不同步） */
function readVideoListFiltersFromBrowser(categoryTree: CategoryTreeNode[]) {
  if (typeof window === 'undefined') {
    return {
      categoryId: undefined as number | undefined,
      categoryName: undefined as string | undefined,
      sortBy: 'default',
      sortKey: 'default',
      keyword: '',
      page: 1,
      institutionId: undefined as number | undefined,
    };
  }
  const params = new URLSearchParams(window.location.search);
  const categoryId = parseOptionalPositiveInt(params.get('categoryId'));
  const categoryName =
    params.get('categoryName') || findCategoryNameById(categoryTree, categoryId) || undefined;
  const sortBy = params.get('sortBy') || 'default';
  const sortKey = SORT_OPTIONS.find((option) => option.sortBy === sortBy)?.key ?? 'default';
  return {
    categoryId,
    categoryName,
    sortBy,
    sortKey,
    keyword: params.get('keyword') ?? '',
    page: Math.max(1, Number(params.get('page') || 1) || 1),
    institutionId: parseOptionalPositiveInt(params.get('institutionId')),
  };
}

export function VideoListSection(props: VideoListSectionProps) {
  return (
    <Suspense fallback={<div className="min-h-[320px] animate-pulse rounded-xl bg-slate-100" />}>
      <VideoListSectionInner {...props} />
    </Suspense>
  );
}

function VideoListSectionInner({
  initialData,
  categoryTree,
  initialInstitutionId,
  initialInstitutionName,
  initialCategoryId,
  initialCategoryName,
  initialSortBy,
  bottomCategoryNav,
}: VideoListSectionProps) {
  const searchParams = useSearchParams();
  const searchParamsText = searchParams.toString();
  const { keyword: keywordFromUrl, commitKeyword } = useListKeywordUrl();
  const [data, setData] = useState(initialData);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(initialCategoryId);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | undefined>(
    initialCategoryName,
  );
  const selectedCategoryRef = useRef<number | undefined>(initialCategoryId);
  const topCategoryId = useMemo(
    () => resolveTopCategoryId(categoryTree, selectedCategory),
    [categoryTree, selectedCategory],
  );
  const [institutionId, setInstitutionId] = useState<number | undefined>(initialInstitutionId);
  const [listMode, setListMode] = useState<VideoListMode>('all');
  const listModeRef = useRef<VideoListMode>('all');
  const initialSortKey = SORT_OPTIONS.find((option) => option.sortBy === initialSortBy)?.key ?? 'default';
  const [sortKey, setSortKey] = useState(initialSortKey);
  const [keyword, setKeyword] = useState(keywordFromUrl);
  const [currentPage, setCurrentPage] = useState(initialData.page ?? 1);
  const [isPending, startTransition] = useTransition();
  const keywordBootstrappedRef = useRef(false);
  const urlSyncBootstrappedRef = useRef(false);

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
    selectedCategoryRef.current = selectedCategory;
  }, [selectedCategory]);

  useEffect(() => {
    listModeRef.current = listMode;
  }, [listMode]);

  /**
   * SSR 入参变化时同步。
   * 详情页浏览器返回后，地址栏可能仍有筛选而 SSR 为空——交由下方 URL/popstate 恢复，此处勿强行清空。
   */
  useEffect(() => {
    if (serverFilterKeyRef.current === serverFilterKey) {
      return;
    }
    serverFilterKeyRef.current = serverFilterKey;

    const browser = readVideoListFiltersFromBrowser(categoryTree);
    const browserHasFilter =
      browser.categoryId != null
      || browser.institutionId != null
      || Boolean(browser.keyword);
    const ssrEmpty =
      initialCategoryId == null && initialInstitutionId == null;
    if (browserHasFilter && ssrEmpty) {
      return;
    }

    startTransition(() => {
      setData(initialData);
      setCurrentPage(initialData.page ?? 1);
      setSelectedCategory(initialCategoryId);
      selectedCategoryRef.current = initialCategoryId;
      setSelectedCategoryName(initialCategoryName);
      setInstitutionId(initialInstitutionId);
    });
  }, [
    serverFilterKey,
    initialData,
    initialCategoryId,
    initialCategoryName,
    initialInstitutionId,
    categoryTree,
    startTransition,
  ]);

  const syncUrl = useCallback(
    (page: number, catId?: number, catName?: string, nextSortKey = sortKey) => {
      const params = new URLSearchParams();
      const sortByValue = SORT_OPTIONS.find((option) => option.key === nextSortKey)?.sortBy;
      if (institutionId) {
        params.set('institutionId', String(institutionId));
      }
      if (catId) {
        params.set('categoryId', String(catId));
        if (catName) {
          params.set('categoryName', catName);
        }
      }
      if (sortByValue && sortByValue !== 'default') {
        params.set('sortBy', sortByValue);
      }
      if (keyword) {
        params.set('keyword', keyword);
      }
      setPageParam(params, page);
      replaceBrowserUrl(getBrowserPathname(), params);
    },
    [institutionId, sortKey, keyword],
  );

  const fetchData = useCallback(
    (
      page: number,
      catId?: number,
      sort?: string,
      kw?: string,
      overrideInstitutionId?: number | null,
      mode?: VideoListMode,
    ) => {
      const sortByValue = SORT_OPTIONS.find((o) => o.key === (sort ?? sortKey))?.sortBy ?? 'default';
      const instId =
        overrideInstitutionId === null
          ? undefined
          : overrideInstitutionId !== undefined
            ? overrideInstitutionId
            : institutionId;
      const effectiveMode = mode ?? listModeRef.current;
      startTransition(async () => {
        try {
          const result = await getVideoList({
            page,
            size: PAGE_SIZE,
            categoryId: catId ?? selectedCategoryRef.current,
            sortBy: sortByValue === 'default' ? undefined : sortByValue,
            keyword: (kw ?? keyword) || undefined,
            institutionId: instId,
            isFeatured: effectiveMode === 'featured' ? 1 : undefined,
          });
          setData(result);
          setCurrentPage(page);
        } catch (e) {
          console.error('加载录播课列表失败:', e);
        }
      });
    },
    [sortKey, keyword, institutionId],
  );

  const applyBrowserFilters = useCallback(() => {
    const browser = readVideoListFiltersFromBrowser(categoryTree);
    selectedCategoryRef.current = browser.categoryId;
    setSelectedCategory(browser.categoryId);
    setSelectedCategoryName(browser.categoryName);
    setSortKey(browser.sortKey);
    setKeyword(browser.keyword);
    setInstitutionId(browser.institutionId);
    setCurrentPage(browser.page);
    fetchData(
      browser.page,
      browser.categoryId,
      browser.sortKey,
      browser.keyword,
      browser.institutionId ?? null,
    );
  }, [categoryTree, fetchData]);

  const { commitPageChange } = useListPageUrlSync({
    currentPage,
    onPageFromUrl: (page) => fetchData(page, selectedCategoryRef.current),
  });

  useEffect(() => {
    void Promise.resolve().then(() => {
      if (!keywordBootstrappedRef.current) {
        keywordBootstrappedRef.current = true;
        if (!keywordFromUrl) return;
      }
      if (keywordFromUrl === keyword) return;
      setKeyword(keywordFromUrl);
      commitPageChange(1);
      fetchData(1, selectedCategory, sortKey, keywordFromUrl);
    });
  }, [keywordFromUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Next searchParams 变化时同步；首屏若地址栏已有筛选也要恢复（详情返回） */
  useEffect(() => {
    void Promise.resolve().then(() => {
      const browser = readVideoListFiltersFromBrowser(categoryTree);
      const params = new URLSearchParams(searchParamsText);
      const nextCategoryId =
        parseOptionalPositiveInt(params.get('categoryId')) ?? browser.categoryId;
      const nextCategoryName =
        params.get('categoryName')
        || browser.categoryName
        || findCategoryNameById(categoryTree, nextCategoryId);
      const nextSortBy = params.get('sortBy') || browser.sortBy || 'default';
      const nextSortKey =
        SORT_OPTIONS.find((option) => option.sortBy === nextSortBy)?.key ?? 'default';
      const nextKeyword = params.has('keyword')
        ? (params.get('keyword') ?? '')
        : browser.keyword;
      const nextPage = params.get('page')
        ? Math.max(1, Number(params.get('page') || 1) || 1)
        : browser.page;
      const nextInstitutionId =
        parseOptionalPositiveInt(params.get('institutionId')) ?? browser.institutionId;

      if (!urlSyncBootstrappedRef.current) {
        urlSyncBootstrappedRef.current = true;
        // 首屏：仅当地址栏比 SSR 初始值更「有筛选」时才覆盖（浏览器后退场景）
        const browserHasFilter =
          nextCategoryId != null
          || nextInstitutionId != null
          || Boolean(nextKeyword)
          || nextSortKey !== 'default'
          || nextPage > 1;
        const differsFromSsr =
          nextCategoryId !== initialCategoryId
          || nextInstitutionId !== initialInstitutionId
          || nextKeyword !== keywordFromUrl
          || nextSortKey !== initialSortKey
          || nextPage !== (initialData.page ?? 1);
        if (!(browserHasFilter && differsFromSsr)) {
          return;
        }
      }

      const categorySame = selectedCategory === nextCategoryId;
      const categoryNameSame = (selectedCategoryName ?? '') === (nextCategoryName ?? '');
      const sortSame = sortKey === nextSortKey;
      const keywordSame = keyword === nextKeyword;
      const pageSame = currentPage === nextPage;
      const institutionSame = institutionId === nextInstitutionId;
      if (categorySame && categoryNameSame && sortSame && keywordSame && pageSame && institutionSame) {
        return;
      }

      selectedCategoryRef.current = nextCategoryId;
      setSelectedCategory(nextCategoryId);
      setSelectedCategoryName(nextCategoryName);
      setSortKey(nextSortKey);
      setKeyword(nextKeyword);
      setInstitutionId(nextInstitutionId);
      fetchData(
        nextPage,
        nextCategoryId,
        nextSortKey,
        nextKeyword,
        nextInstitutionId ?? null,
      );
    });
  }, [searchParamsText]); // eslint-disable-line react-hooks/exhaustive-deps

  /** 浏览器前进/后退：直接读地址栏恢复分类等筛选 */
  useEffect(() => {
    const onPopState = () => {
      applyBrowserFilters();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [applyBrowserFilters]);

  const handleClearInstitution = useCallback(() => {
    setInstitutionId(undefined);
    fetchData(1, selectedCategory, sortKey, keyword, null);
    navigateToSeoPath('/video');
  }, [fetchData, selectedCategory, sortKey, keyword]);

  const handleListModeChange = useCallback(
    (mode: VideoListMode) => {
      listModeRef.current = mode;
      setListMode(mode);
      commitPageChange(1);
      fetchData(1, selectedCategory, sortKey, keyword, undefined, mode);
    },
    [fetchData, selectedCategory, sortKey, keyword, commitPageChange],
  );

  const handleCategoryChange = useCallback(
    (catId?: number, catName?: string) => {
      selectedCategoryRef.current = catId;
      setSelectedCategory(catId);
      setSelectedCategoryName(catName);
      syncUrl(1, catId, catName);
      commitPageChange(1);
      fetchData(1, catId);
    },
    [fetchData, syncUrl, commitPageChange],
  );

  const handleSortChange = useCallback(
    (key: string) => {
      setSortKey(key);
      syncUrl(1, selectedCategory, selectedCategoryName, key);
      fetchData(1, selectedCategory, key);
    },
    [fetchData, selectedCategory, selectedCategoryName, syncUrl],
  );

  const handleSearch = useCallback(() => {
    commitKeyword(keyword);
    commitPageChange(1);
    fetchData(1, selectedCategory, sortKey, keyword);
  }, [fetchData, selectedCategory, sortKey, keyword, commitPageChange, commitKeyword]);

  const handlePageChange = useCallback(
    (page: number) => {
      syncUrl(page, selectedCategory, selectedCategoryName);
      fetchData(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [fetchData, syncUrl, selectedCategory, selectedCategoryName],
  );

  const handleBottomCategoryClick = useCallback(
    (item: ChannelCategoryNavItem) => {
      const categoryId = parseCourseCategoryIdFromHref(item.href);
      if (!categoryId) return;
      handleCategoryChange(categoryId, item.name);
    },
    [handleCategoryChange],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* 当前过滤 chip */}
      {institutionId && initialInstitutionName && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 flex items-center gap-2 text-sm">
          <span className="text-slate-500">当前筛选：</span>
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
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        {/* 默认 / 精品录播课 */}
        <div className="flex overflow-x-auto border-b border-slate-100 px-2 pt-2 sm:px-4">
          {LIST_MODE_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleListModeChange(tab.key)}
              className={cn(
                'shrink-0 px-4 py-3 text-[15px] transition-colors border-b-2 -mb-px sm:px-6',
                listMode === tab.key
                  ? 'font-bold text-primary border-primary'
                  : 'font-medium text-slate-600 border-transparent hover:text-primary',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 分类筛选栏 */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-700 mr-2">分类：</span>
            <button
              type="button"
              onClick={() => handleCategoryChange(undefined)}
              className={cn(
                'px-3 py-1 text-sm rounded-full transition-colors',
                !topCategoryId
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
            >
              全部
            </button>
            {categoryTree.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id, cat.name)}
                className={cn(
                  'px-3 py-1 text-sm rounded-full transition-colors',
                  topCategoryId === cat.id
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* 排序 + 搜索栏 */}
        <div className="p-2 flex items-center gap-2 flex-wrap">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => handleSortChange(opt.key)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm transition-colors inline-flex items-center gap-1',
                sortKey === opt.key
                  ? 'font-bold text-primary bg-primary/5'
                  : 'font-medium text-slate-600 hover:bg-slate-50',
              )}
            >
              {opt.label}
              <ArrowUpDown className="size-3.5" />
            </button>
          ))}

          <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索录播课..."
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:w-44"
            />
            <button
              type="button"
              onClick={handleSearch}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <Search className="size-4" />
            </button>
          </div>

          <span className="text-sm text-slate-500 pr-2 shrink-0">
            共 <strong className="text-slate-900">{data.total}</strong> 门课程
          </span>
        </div>
      </div>

      {/* 卡片网格 */}
      <div className={cn('transition-opacity', isPending ? 'opacity-50' : '')}>
        {data.list.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {data.list.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
            暂无录播课
          </div>
        )}
      </div>

      <ListPagePagination
        className="mt-6"
        currentPage={currentPage}
        totalPages={data.totalPages}
        onPageChange={handlePageChange}
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
