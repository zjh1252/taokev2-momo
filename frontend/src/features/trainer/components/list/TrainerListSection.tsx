'use client';

import { useState, useCallback, useTransition } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TrainerFilters } from './TrainerFilters';
import { TrainerCard } from './TrainerCard';
import { getTrainerList } from '../../api/service';
import type { TrainerListItem, CategoryTreeNode, PageResponse } from '../../types';

interface TrainerListSectionProps {
  initialData: PageResponse<TrainerListItem>;
  expertiseTree: CategoryTreeNode[];
  industryTree: CategoryTreeNode[];
}

export function TrainerListSection({
  initialData,
  expertiseTree,
  industryTree,
}: TrainerListSectionProps) {
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState<{
    expertiseCategoryId?: number;
    industryCategoryId?: number;
    sort?: string;
  }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const fetchData = useCallback(
    (page: number, newFilters?: typeof filters) => {
      const f = newFilters ?? filters;
      startTransition(async () => {
        try {
          const result = await getTrainerList({
            page,
            size: 15,
            expertiseCategoryId: f.expertiseCategoryId,
            industryCategoryId: f.industryCategoryId,
            sort: f.sort,
          });
          setData(result);
          setCurrentPage(page);
        } catch (e) {
          console.error('加载专家列表失败:', e);
        }
      });
    },
    [filters],
  );

  const handleFilterChange = useCallback(
    (newFilters: typeof filters) => {
      setFilters(newFilters);
      fetchData(1, newFilters);
    },
    [fetchData],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      fetchData(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [fetchData],
  );

  return (
    <div className="space-y-6">
      {/* 筛选栏 */}
      <TrainerFilters
        expertiseTree={expertiseTree}
        industryTree={industryTree}
        onFilterChange={handleFilterChange}
      />

      {/* 结果统计 */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          共 <strong className="text-slate-900">{data.total}</strong> 位专家
        </span>
      </div>

      {/* 列表 */}
      <div className={`space-y-4 transition-opacity ${isPending ? 'opacity-50' : ''}`}>
        {data.list.length > 0 ? (
          data.list.map((trainer) => <TrainerCard key={trainer.id} trainer={trainer} />)
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
            暂无符合条件的专家
          </div>
        )}
      </div>

      {/* 分页 */}
      {data.totalPages > 1 && (
        <div className="flex justify-center pt-6 border-t border-slate-200">
          <div className="flex items-center gap-2 text-[14px]">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="size-4" />
            </button>

            {generatePageNumbers(currentPage, data.totalPages).map((p, i) =>
              p === -1 ? (
                <span key={`dot-${i}`} className="px-1 text-slate-400">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-8 h-8 rounded border flex items-center justify-center ${
                    p === currentPage
                      ? 'border-primary bg-primary text-white'
                      : 'border-slate-200 text-slate-500 hover:text-primary hover:border-primary'
                  }`}
                >
                  {p}
                </button>
              ),
            )}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= data.totalPages}
              className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** 生成分页页码数组，-1 表示省略号 */
function generatePageNumbers(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: number[] = [1];
  if (current > 3) pages.push(-1);

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push(-1);
  pages.push(total);
  return pages;
}
