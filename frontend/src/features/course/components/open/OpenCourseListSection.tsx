'use client';

import { useState, useCallback, useTransition, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpDown, X, RotateCcw } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { OpenCourseCard } from './OpenCourseCard';
import { OpenCourseFilters, type OpenCourseFilterValue } from './OpenCourseFilters';
import { getCourseList } from '../../api/service';
import type { CourseListItem, PageResponse, CategoryTreeNode } from '../../api/types';

interface OpenCourseListSectionProps {
  initialData: PageResponse<CourseListItem>;
  categoryTree: CategoryTreeNode[];
  initialInstitutionId?: number;
  initialInstitutionName?: string;
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

export function OpenCourseListSection({
  initialData,
  categoryTree,
  initialInstitutionId,
  initialInstitutionName,
}: OpenCourseListSectionProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState<OpenCourseFilterValue>({});
  const [institutionId, setInstitutionId] = useState<number | undefined>(initialInstitutionId);
  // 顶部排序栏的选择仅控制 sortBy；与 OpenCourseFilters 中的"综合筛选"共用 filters.sortBy
  const [sortKey, setSortKey] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const fetchData = useCallback(
    (
      page: number,
      newFilters?: OpenCourseFilterValue,
      overrideSortKey?: string,
      overrideInstitutionId?: number | null,
    ) => {
      const f = newFilters ?? filters;
      const sort = overrideSortKey ?? sortKey;
      const instId =
        overrideInstitutionId === null
          ? undefined
          : overrideInstitutionId !== undefined
            ? overrideInstitutionId
            : institutionId;
      const sortByValue = SORT_OPTIONS.find((o) => o.key === sort)?.sortBy ?? 'default';
      // 顶部排序栏优先级高于综合筛选；只有顶部用 default 时才让综合筛选 sortBy 生效
      const effectiveSortBy =
        sortByValue !== 'default' ? sortByValue : f.sortBy ? f.sortBy : undefined;

      startTransition(async () => {
        try {
          const result = await getCourseList({
            page,
            size: 15,
            isOpen: true,
            categoryId: f.categoryId,
            sortBy: effectiveSortBy,
            institutionId: instId,
            provinceId: f.provinceId,
            timeQuick: f.timeQuick,
            startTimeFrom: f.startTimeFrom,
            startTimeTo: f.startTimeTo,
            priceMin: f.priceMin,
            priceMax: f.priceMax,
            isFree: f.isFree,
            enrollStatus: f.enrollStatus,
          });
          setData(result);
          setCurrentPage(page);
        } catch (e) {
          console.error('加载公开课列表失败:', e);
        }
      });
    },
    [filters, sortKey, institutionId],
  );

  const handleClearInstitution = useCallback(() => {
    setInstitutionId(undefined);
    fetchData(1, undefined, undefined, null);
    router.replace('/opencourses');
  }, [fetchData, router]);

  const handleFilterChange = useCallback(
    (newFilters: OpenCourseFilterValue) => {
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

  const handleResetAll = useCallback(() => {
    setFilters({});
    setSortKey('default');
    fetchData(1, {}, 'default');
  }, [fetchData]);

  // 当前已激活的过滤 chips（机构、分类、综合、省、时间、价格、报名状态）
  const activeChips = useMemo<ActiveChip[]>(() => {
    const chips: ActiveChip[] = [];
    if (institutionId && initialInstitutionName) {
      chips.push({
        key: 'institution',
        label: `机构：${initialInstitutionName}`,
        onRemove: () => filters,
      });
    }
    if (filters.categoryId && filters.categoryName) {
      chips.push({
        key: 'category',
        label: `分类：${filters.categoryName}`,
        onRemove: () => ({ ...filters, categoryId: undefined, categoryName: undefined }),
      });
    }
    if (filters.sortBy && filters.sortLabel) {
      chips.push({
        key: 'sortBy',
        label: `综合：${filters.sortLabel}`,
        onRemove: () => ({ ...filters, sortBy: undefined, sortLabel: undefined }),
      });
    }
    if (filters.provinceId && filters.provinceName) {
      chips.push({
        key: 'province',
        label: `开课省市：${filters.provinceName}`,
        onRemove: () => ({ ...filters, provinceId: undefined, provinceName: undefined }),
      });
    }
    if (filters.timeQuick && filters.timeQuickLabel) {
      chips.push({
        key: 'timeQuick',
        label: `开课时间：${filters.timeQuickLabel}`,
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
      const label = filters.priceLabel
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
    if (filters.enrollStatus && filters.enrollStatusLabel) {
      chips.push({
        key: 'enrollStatus',
        label: `报名状态：${filters.enrollStatusLabel}`,
        onRemove: () => ({ ...filters, enrollStatus: undefined, enrollStatusLabel: undefined }),
      });
    }
    return chips;
  }, [filters, institutionId, initialInstitutionName]);

  const handleRemoveChip = (chip: ActiveChip) => {
    if (chip.key === 'institution') {
      handleClearInstitution();
      return;
    }
    const next = chip.onRemove();
    handleFilterChange(next);
  };

  return (
    <div className="flex gap-6 items-start">
      <OpenCourseFilters
        categoryTree={categoryTree}
        value={filters}
        onChange={handleFilterChange}
      />

      <div className="flex-1 flex flex-col gap-4">
        {/* 排序栏 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-2 flex items-center gap-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleSortChange(opt.key)}
              className={`px-6 py-2 rounded-lg text-sm transition-colors inline-flex items-center gap-1 cursor-pointer ${
                sortKey === opt.key
                  ? 'font-bold text-primary bg-primary/5'
                  : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-primary'
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
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
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
                    className={`w-8 h-8 flex items-center justify-center rounded-lg font-medium text-sm cursor-pointer transition-colors ${
                      p === currentPage
                        ? 'bg-primary text-white shadow-sm'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-primary'
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= data.totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
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
