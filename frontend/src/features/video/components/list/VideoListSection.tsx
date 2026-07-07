'use client';

import { Suspense, useState, useCallback, useTransition, useEffect, useRef, useMemo } from 'react';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const keywordBootstrappedRef = useRef(false);

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

  useEffect(() => {
    if (serverFilterKeyRef.current === serverFilterKey) {
      return;
    }
    serverFilterKeyRef.current = serverFilterKey;
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
    startTransition,
  ]);

  const syncUrl = useCallback(
    (page: number, catId?: number, catName?: string) => {
      const params = new URLSearchParams();
      if (institutionId) {
        params.set('institutionId', String(institutionId));
      }
      if (catId) {
        params.set('categoryId', String(catId));
        if (catName) {
          params.set('categoryName', catName);
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

  const handleClearInstitution = useCallback(() => {
    setInstitutionId(undefined);
    fetchData(1, selectedCategory, sortKey, keyword, null);
    navigateToSeoPath('/vedio');
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
      fetchData(1, selectedCategory, key);
    },
    [fetchData, selectedCategory],
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
        <div className="flex border-b border-slate-100 px-4 pt-2">
          {LIST_MODE_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleListModeChange(tab.key)}
              className={cn(
                'px-6 py-3 text-[15px] transition-colors border-b-2 -mb-px',
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

          <div className="ml-auto flex items-center gap-2">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索录播课..."
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
