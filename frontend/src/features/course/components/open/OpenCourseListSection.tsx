'use client';

import { useState, useCallback, useTransition } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { OpenCourseCard } from './OpenCourseCard';
import { OpenCourseFilters } from './OpenCourseFilters';
import { getCourseList } from '../../api/service';
import type { CourseListItem, PageResponse, CategoryTreeNode } from '../../api/types';

interface OpenCourseListSectionProps {
  initialData: PageResponse<CourseListItem>;
  categoryTree: CategoryTreeNode[];
}

const SORT_OPTIONS = [
  { key: 'default', label: '默认' },
  { key: 'time', label: '开课时间' },
  { key: 'price', label: '价格' },
  { key: 'review', label: '评价' },
];

export function OpenCourseListSection({ initialData, categoryTree }: OpenCourseListSectionProps) {
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState<{ categoryId?: number }>({});
  const [sortKey, setSortKey] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const fetchData = useCallback(
    (page: number, newFilters?: typeof filters) => {
      const f = newFilters ?? filters;
      startTransition(async () => {
        try {
          const result = await getCourseList({
            page,
            size: 15,
            isOpen: true,
            categoryId: f.categoryId,
          });
          setData(result);
          setCurrentPage(page);
        } catch (e) {
          console.error('加载公开课列表失败:', e);
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

  const handleSortChange = useCallback(
    (key: string) => {
      setSortKey(key);
      // TODO: 后端暂未支持排序参数，后续接入
      fetchData(1, filters);
    },
    [fetchData, filters],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      fetchData(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [fetchData],
  );

  return (
    <div className="flex gap-6">
      <OpenCourseFilters categoryTree={categoryTree} onFilterChange={handleFilterChange} />

      <div className="flex-1 space-y-4">
        {/* 排序栏 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => handleSortChange(opt.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortKey === opt.key
                    ? 'bg-primary text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className="text-sm text-slate-500">
            共 <strong className="text-slate-900">{data.total}</strong> 门课程
          </span>
        </div>

        {/* 列表 */}
        <div className={`space-y-3 transition-opacity ${isPending ? 'opacity-50' : ''}`}>
          {data.list.length > 0 ? (
            data.list.map((course) => <OpenCourseCard key={course.id} course={course} />)
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
              暂无公开课程
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
                  <span key={`dot-${i}`} className="px-1 text-slate-400">...</span>
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
    </div>
  );
}

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
