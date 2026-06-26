'use client';

import { useState, useCallback, useTransition } from 'react';
import { ArrowUpDown, X } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { InnerCourseCard } from './InnerCourseCard';
import { InnerCourseFilters } from './InnerCourseFilters';
import { getCourseList } from '../../api/service';
import type { CourseListItem, PageResponse, CategoryTreeNode } from '../../api/types';

interface InnerCourseListSectionProps {
  initialData: PageResponse<CourseListItem>;
  categoryTree: CategoryTreeNode[];
  initialInstitutionId?: number;
  initialInstitutionName?: string;
}

const SORT_OPTIONS = [
  { key: 'default', label: '默认', sortBy: 'default' },
  { key: 'rating', label: '评分', sortBy: 'score' },
];

export function InnerCourseListSection({
  initialData,
  categoryTree,
  initialInstitutionId,
  initialInstitutionName,
}: InnerCourseListSectionProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState<{ categoryId?: number }>({});
  const [institutionId, setInstitutionId] = useState<number | undefined>(initialInstitutionId);
  const [sortKey, setSortKey] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const fetchData = useCallback(
    (page: number, newFilters?: typeof filters, overrideSortKey?: string, overrideInstitutionId?: number | null) => {
      const f = newFilters ?? filters;
      const sort = overrideSortKey ?? sortKey;
      const instId =
        overrideInstitutionId === null
          ? undefined
          : overrideInstitutionId !== undefined
            ? overrideInstitutionId
            : institutionId;
      const sortByValue = SORT_OPTIONS.find((o) => o.key === sort)?.sortBy ?? 'default';
      startTransition(async () => {
        try {
          const result = await getCourseList({
            page,
            size: 15,
            isOpen: false,
            categoryIds: f.categoryId ? [f.categoryId] : undefined,
            sortBy: sortByValue === 'default' ? undefined : sortByValue,
            institutionId: instId,
          });
          setData(result);
          setCurrentPage(page);
        } catch (e) {
          console.error('加载内训课列表失败:', e);
        }
      });
    },
    [filters, sortKey, institutionId],
  );

  const handleClearInstitution = useCallback(() => {
    setInstitutionId(undefined);
    fetchData(1, undefined, undefined, null);
    router.replace('/innercourses');
  }, [fetchData, router]);

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
      <InnerCourseFilters categoryTree={categoryTree} onFilterChange={handleFilterChange} />

      <div className="flex-1 flex flex-col gap-4">
        {/* 当前过滤 chip */}
        {institutionId && initialInstitutionName && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 flex items-center gap-2 text-sm">
            <span className="text-slate-500">当前筛选：</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs">
              机构：{initialInstitutionName}
              <button
                onClick={handleClearInstitution}
                className="hover:text-primary/70 inline-flex items-center"
                aria-label="清除机构筛选"
              >
                <X className="size-3" />
              </button>
            </span>
          </div>
        )}

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
            data.list.map((course) => <InnerCourseCard key={course.id} course={course} />)
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
              暂无内训课程
            </div>
          )}
        </div>

        {/* 分页 */}
        {data.totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage <= 1}
                className="px-3 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-sm text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                首页
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
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
                className="px-3 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
              <button
                onClick={() => handlePageChange(data.totalPages)}
                disabled={currentPage >= data.totalPages}
                className="px-3 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                尾页
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
