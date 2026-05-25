'use client';

import { Suspense, useState, useCallback, useTransition } from 'react';
import { ListPagePagination } from '@/components/list-page-pagination';
import { useListPageUrlSync } from '@/hooks/use-list-page-url';
import { TrainerFilters, type TrainerFilterValue } from './TrainerFilters';
import { TrainerCard } from './TrainerCard';
import { TrainerRecommendedScroller } from './TrainerRecommendedScroller';
import { TrainerCaseScroller } from './TrainerCaseScroller';
import { TrainerSortBar } from './TrainerSortBar';
import { getTrainerList, type RecentTrainerCase } from '../../api/service';
import type { TrainerListItem, CategoryTreeNode, PageResponse } from '../../types';

interface TrainerListSectionProps {
  initialData: PageResponse<TrainerListItem>;
  expertiseTree: CategoryTreeNode[];
  industryTree: CategoryTreeNode[];
  recommendedTrainers: TrainerListItem[];
  recentCases: RecentTrainerCase[];
}

/**
 * 专家列表页主区块
 *
 * <p>整体布局：</p>
 * <ol>
 *   <li>左侧：hover 弹出式筛选侧栏（{@link TrainerFilters}）。</li>
 *   <li>右侧主区：</li>
 *   <ol>
 *     <li>顶部：左 3 张推荐专家头像 + 右 NEW 案例两条紧凑滚动条。</li>
 *     <li>已选筛选 chips（无筛选时隐藏）。</li>
 *     <li>排序栏（综合排序 / 好评率）+ 总数。</li>
 *     <li>专家卡片列表 + 分页。</li>
 *   </ol>
 * </ol>
 *
 * @author Fangxinxin
 * @date 2026-04-22 18:45
 */
export function TrainerListSection(props: TrainerListSectionProps) {
  return (
    <Suspense fallback={<div className="min-h-[320px] animate-pulse rounded-xl bg-slate-100" />}>
      <TrainerListSectionInner {...props} />
    </Suspense>
  );
}

function TrainerListSectionInner({
  initialData,
  expertiseTree,
  industryTree,
  recommendedTrainers,
  recentCases,
}: TrainerListSectionProps) {
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState<TrainerFilterValue>({});
  const [sort, setSort] = useState<string>('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const fetchData = useCallback(
    (page: number, newFilters?: TrainerFilterValue, newSort?: string) => {
      const f = newFilters ?? filters;
      const s = newSort ?? sort;
      startTransition(async () => {
        try {
          const result = await getTrainerList({
            page,
            size: 16,
            expertiseCategoryId: f.expertiseCategoryId,
            industryCategoryId: f.industryCategoryId,
            provinceId: f.provinceId,
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
    [filters, sort],
  );

  const { commitPageChange } = useListPageUrlSync({
    currentPage,
    onPageFromUrl: fetchData,
  });

  const handleFilterChange = useCallback(
    (next: TrainerFilterValue) => {
      setFilters(next);
      commitPageChange(1);
      fetchData(1, next);
    },
    [fetchData, commitPageChange],
  );

  const handleReset = useCallback(() => {
    setFilters({});
    commitPageChange(1);
    fetchData(1, {});
  }, [fetchData, commitPageChange]);

  const handleSortChange = useCallback(
    (s: string) => {
      setSort(s);
      commitPageChange(1);
      fetchData(1, undefined, s);
    },
    [fetchData, commitPageChange],
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
    <div className="flex flex-col gap-4">
      {/* 顶部：左过滤侧栏 + 右 3 张推荐大图 */}
      <section className="flex gap-6 items-stretch">
        <TrainerFilters
          expertiseTree={expertiseTree}
          industryTree={industryTree}
          value={filters}
          onChange={handleFilterChange}
        />
        <div className="flex-1 min-w-0">
          <TrainerRecommendedScroller initialItems={recommendedTrainers} />
        </div>
      </section>

      {/* 中部：NEW 案例条（每屏 2 条，每 8 秒向上步进） */}
      <TrainerCaseScroller initialItems={recentCases} />

      {/* 排序栏（同时承载已选筛选 chips） */}
      <TrainerSortBar
        sort={sort}
        total={data.total}
        filters={filters}
        onChange={handleSortChange}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
      />

      {/* 列表（2 列网格，与老站布局一致） */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity ${
          isPending ? 'opacity-50' : ''
        }`}
      >
        {data.list.length > 0 ? (
          data.list.map((trainer) => <TrainerCard key={trainer.id} trainer={trainer} />)
        ) : (
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
            暂无符合条件的专家
          </div>
        )}
      </div>

      {/* 分页 */}
      <ListPagePagination
        currentPage={currentPage}
        totalPages={data.totalPages}
        onPageChange={handlePageChange}
        className="pt-6 border-t border-slate-200"
      />
    </div>
  );
}
