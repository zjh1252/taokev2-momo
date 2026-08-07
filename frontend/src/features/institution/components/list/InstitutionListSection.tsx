'use client';

import { Suspense, useState, useCallback, useTransition, useEffect, useRef } from 'react';
import { ArrowUpDown, TrendingUp, SlidersHorizontal } from 'lucide-react';
import { ListPagePagination } from '@/components/list-page-pagination';
import { useListPageUrlSync } from '@/hooks/use-list-page-url';
import { useListKeywordUrl } from '@/hooks/use-list-keyword-url';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { InstitutionCard } from './InstitutionCard';
import { SafeImage } from '@/components/safe-image';
import { getInstitutionLogoFallback } from '../../utils/logo';
import { InstitutionSidebar } from './InstitutionSidebar';
import { getInstitutionExpertiseCategoryCounts, getInstitutionList } from '../../api/service';
import {
  mergeInstitutionCategoryCounts,
  type ChannelCategoryNavItem,
} from '@/lib/institution-category-nav';
import { pickGoldInstitutionRecommends } from '../../utils/gold-recommends';
import type { InstitutionListItem, PageResponse } from '../../types';
import { ListBottomCategoryNav } from '@/components/layout/list-bottom-category-nav';
import { parseInstitutionCategoryIdFromHref } from '@/lib/parse-category-nav-href';

interface InstitutionListSectionProps {
  initialData: PageResponse<InstitutionListItem>;
  /** SSR 预取的金牌推荐（固定 4 个），避免仅依赖当前列表页数据 */
  initialGoldRecommends?: InstitutionListItem[];
  association?: boolean;
  basePath?: string;
  title?: string;
  categoryItems?: ChannelCategoryNavItem[];
  initialExpertiseCategoryId?: number;
  categoryTitle?: string;
  /** 锁定城市 ID（城市子频道列表页分页时保持筛选） */
  lockedCityId?: number;
  bottomCategoryNav?: {
    title: string;
    countUnit: string;
    items: ChannelCategoryNavItem[];
  };
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
  initialGoldRecommends,
  association,
  basePath = '/company',
  title = '培训机构',
  categoryItems: initialCategoryItems = [],
  initialExpertiseCategoryId,
  categoryTitle,
  lockedCityId,
  bottomCategoryNav,
}: InstitutionListSectionProps) {
  const { keyword: keywordFromUrl, commitKeyword } = useListKeywordUrl();
  const [data, setData] = useState(initialData);
  const [categoryItems, setCategoryItems] = useState(initialCategoryItems);
  const [keyword, setKeyword] = useState(keywordFromUrl);
  const [expertiseCategoryId, setExpertiseCategoryId] = useState<number | undefined>(
    initialExpertiseCategoryId,
  );
  const [sortKey, setSortKey] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const keywordBootstrappedRef = useRef(false);

  const fetchData = useCallback(
    (
      page: number,
      overrideKeyword?: string,
      overrideSort?: string,
      overrideCategoryId?: number | null,
    ) => {
      const kw = overrideKeyword ?? keyword;
      const sort = overrideSort ?? sortKey;
      const categoryId =
        overrideCategoryId === null
          ? undefined
          : overrideCategoryId !== undefined
            ? overrideCategoryId
            : expertiseCategoryId;
      startTransition(async () => {
        try {
          const result = await getInstitutionList({
            page,
            size: 15,
            keyword: kw || undefined,
            sort,
            association,
            expertiseCategoryId: categoryId,
            cityId: lockedCityId,
          });
          setData(result);
          setCurrentPage(page);
        } catch (e) {
          console.error('加载机构列表失败:', e);
        }
      });
    },
    [keyword, sortKey, association, expertiseCategoryId, lockedCityId],
  );

  const { commitPageChange } = useListPageUrlSync({
    currentPage,
    onPageFromUrl: fetchData,
  });

  useEffect(() => {
    if (initialCategoryItems.length === 0) return;
    getInstitutionExpertiseCategoryCounts(association)
      .then((counts) => {
        setCategoryItems(mergeInstitutionCategoryCounts(initialCategoryItems, counts));
      })
      .catch(() => {});
  }, [association, initialCategoryItems]);

  /** SSR 刷新/左侧分类跳转时同步列表与分类筛选 */
  useEffect(() => {
    startTransition(() => {
      setData(initialData);
      setCurrentPage(initialData.page ?? 1);
      setExpertiseCategoryId(initialExpertiseCategoryId);
    });
  }, [initialData, initialExpertiseCategoryId, startTransition]);

  useEffect(() => {
    if (!keywordBootstrappedRef.current) {
      keywordBootstrappedRef.current = true;
      if (!keywordFromUrl) return;
    }
    if (keywordFromUrl === keyword) return;
    setKeyword(keywordFromUrl);
    commitPageChange(1);
    fetchData(1, keywordFromUrl);
  }, [keywordFromUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback(
    (kw: string) => {
      setKeyword(kw);
      commitKeyword(kw);
      commitPageChange(1);
      fetchData(1, kw);
    },
    [fetchData, commitPageChange, commitKeyword],
  );

  const handleSortChange = useCallback(
    (key: string) => {
      setSortKey(key);
      commitPageChange(1);
      fetchData(1, keyword, key);
    },
    [fetchData, keyword, commitPageChange],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      commitPageChange(page);
      fetchData(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [fetchData, commitPageChange],
  );

  const handleBottomCategoryClick = useCallback(
    (item: ChannelCategoryNavItem) => {
      const categoryId = parseInstitutionCategoryIdFromHref(item.href);
      if (!categoryId) return;
      setExpertiseCategoryId(categoryId);
      commitPageChange(1);
      fetchData(1, keyword, sortKey, categoryId);
    },
    [fetchData, keyword, sortKey, commitPageChange],
  );

  const displayRecommends =
    currentPage === 1
      ? pickGoldInstitutionRecommends(
          initialGoldRecommends?.length
            ? initialGoldRecommends
            : data.list,
          4,
        )
      : [];

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-6 overflow-x-clip">
    <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
      <div className="lg:hidden">
        <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm"
          >
            <SlidersHorizontal className="size-4" />
            筛选机构
          </button>
          <SheetContent side="bottom" className="max-h-[82vh] gap-0 overflow-y-auto rounded-t-xl p-0">
            <SheetHeader className="border-b border-slate-100 px-4 py-3">
              <SheetTitle>筛选机构</SheetTitle>
            </SheetHeader>
            <div className="p-4">
              <InstitutionSidebar
                keyword={keyword}
                onKeywordChange={setKeyword}
                onSearch={(kw) => {
                  handleSearch(kw);
                  setMobileFilterOpen(false);
                }}
                categoryItems={categoryItems}
                activeCategoryId={expertiseCategoryId}
                basePath={basePath}
                categoryTitle={categoryTitle}
                association={association}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden shrink-0 lg:block">
        <InstitutionSidebar
          keyword={keyword}
          onKeywordChange={setKeyword}
          onSearch={handleSearch}
          categoryItems={categoryItems}
          activeCategoryId={expertiseCategoryId}
          basePath={basePath}
          categoryTitle={categoryTitle}
          association={association}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {/* 金牌推荐区（仅首页且有推荐时展示） */}
        {currentPage === 1 && displayRecommends.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-50 via-amber-100/50 to-white px-5 py-3 border-b border-amber-100 flex items-center gap-2">
              <span className="text-amber-500 text-lg">🏅</span>
              <h2 className="font-bold text-amber-700 text-[15px]">热门机构推荐</h2>
            </div>
            <div className="p-6 bg-gradient-to-b from-white to-slate-50/30 grid grid-cols-2 sm:grid-cols-4 gap-6 md:gap-8 justify-items-center">
              {displayRecommends.map((item) => (
                  <a
                  key={item.id}
                  href={`${basePath}/${item.id}.htm`}
                  className="group flex flex-col items-center gap-3 w-full"
                >
                  <div className="w-24 h-24 md:w-28 md:h-28 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:shadow-md group-hover:border-primary/30 transition-all flex items-center justify-center p-2">
                    <SafeImage
                      src={item.logoUrl}
                      alt={item.orgName}
                      width={112}
                      height={112}
                      apiResolved
                      className="max-w-full max-h-full object-contain"
                      fallback={getInstitutionLogoFallback(item.orgName)}
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
          {/* 排序栏 */}
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

          {/* 卡片列表 */}
          <div className={`flex flex-col transition-opacity ${isPending ? 'opacity-50' : ''}`}>
            {data.list.length > 0 ? (
              data.list.map((item) => <InstitutionCard key={item.id} institution={item} basePath={basePath} />)
            ) : (
              <div className="p-12 text-center text-slate-400">暂无培训机构</div>
            )}
          </div>

          {/* 分页 */}
        <ListPagePagination
          currentPage={currentPage}
          totalPages={data.totalPages}
          onPageChange={handlePageChange}
          className="p-6"
          />

        </div>
      </div>
    </div>
      {bottomCategoryNav && categoryItems.length > 0 ? (
        <ListBottomCategoryNav
          title={bottomCategoryNav.title}
          countUnit={bottomCategoryNav.countUnit}
          itemsPromise={Promise.resolve(categoryItems)}
          onItemClick={handleBottomCategoryClick}
        />
      ) : null}
    </div>
  );
}

