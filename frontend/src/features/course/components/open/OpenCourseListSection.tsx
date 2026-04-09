'use client';

import { useState, useCallback, useTransition } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { OpenCourseCard } from './OpenCourseCard';
import { OpenCourseFilters } from './OpenCourseFilters';
import { getCourseList } from '../../api/service';
import type { CourseListItem, PageResponse, CategoryTreeNode } from '../../api/types';

interface OpenCourseListSectionProps {
  initialData: PageResponse<CourseListItem>;
  categoryTree: CategoryTreeNode[];
}

const SORT_OPTIONS = [
  { key: 'default', label: '默认', sortBy: 'default' },
  { key: 'time', label: '开课时间', sortBy: 'time' },
  { key: 'price', label: '价格', sortBy: 'price' },
  { key: 'review', label: '评价', sortBy: 'score' },
];

export function OpenCourseListSection({ initialData, categoryTree }: OpenCourseListSectionProps) {
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState<{ categoryId?: number }>({});
  const [sortKey, setSortKey] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const fetchData = useCallback(
    (page: number, newFilters?: typeof filters, overrideSortKey?: string) => {
      const f = newFilters ?? filters;
      const sort = overrideSortKey ?? sortKey;
      const sortByValue = SORT_OPTIONS.find((o) => o.key === sort)?.sortBy ?? 'default';
      startTransition(async () => {
        try {
          const result = await getCourseList({
            page,
            size: 15,
            isOpen: true,
            categoryId: f.categoryId,
            sortBy: sortByValue === 'default' ? undefined : sortByValue,
          });
          setData(result);
          setCurrentPage(page);
        } catch (e) {
          console.error('加载公开课列表失败:', e);
        }
      });
    },
    [filters, sortKey],
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
      fetchData(1, filters, key);
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
    <div className="flex gap-6 items-start">
      <OpenCourseFilters categoryTree={categoryTree} onFilterChange={handleFilterChange} />

      <div className="flex-1 flex flex-col gap-4">
        {/* 排序栏 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-2 flex items-center gap-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleSortChange(opt.key)}
              className={`px-6 py-2 rounded-lg text-sm transition-colors inline-flex items-center gap-1 ${
                sortKey === opt.key
                  ? 'font-bold text-primary bg-primary/5'
                  : 'font-medium text-slate-600 hover:bg-slate-50'
              }`}
            >
              {opt.label}
              <ArrowUpDown className="size-3.5" />
            </button>
          ))}
          <span className="ml-auto text-sm text-slate-500 pr-2">
            共 <strong className="text-slate-900">{data.total}</strong> 门课程
          </span>
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
        {data.totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="size-4" />
              </button>
              {generatePageNumbers(currentPage, data.totalPages).map((p, i) =>
                p === -1 ? (
                  <span key={`dot-${i}`} className="text-slate-400 px-1">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg font-medium text-sm ${
                      p === currentPage
                        ? 'bg-primary text-white shadow-sm'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= data.totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
