'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/** 生成分页页码（-1 表示省略号） */
export function generatePageNumbers(current: number, total: number): number[] {
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

interface ListPagePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** compact：仅上下页箭头；full：含首页/尾页文字按钮 */
  variant?: 'compact' | 'full';
  className?: string;
}

/**
 * 列表页底部分页（页码 + 跳转指定页）
 */
export function ListPagePagination({
  currentPage,
  totalPages,
  onPageChange,
  variant = 'full',
  className,
}: ListPagePaginationProps) {
  const [jumpValue, setJumpValue] = useState(String(currentPage));

  useEffect(() => {
    setJumpValue(String(currentPage));
  }, [currentPage]);

  if (totalPages <= 1) return null;

  const handleJump = () => {
    const parsed = Number.parseInt(jumpValue, 10);
    if (Number.isNaN(parsed)) return;
    const page = Math.min(Math.max(1, parsed), totalPages);
    onPageChange(page);
    setJumpValue(String(page));
  };

  const pageBtnBase =
    'h-8 flex items-center justify-center rounded-lg border text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  const pageBtnDefault = `${pageBtnBase} border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-primary`;
  const pageBtnActive = 'w-8 h-8 flex items-center justify-center rounded-lg font-medium text-sm bg-primary text-white shadow-sm';

  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-2', className)}>
      {variant === 'full' && (
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className={cn(pageBtnBase, 'px-3 border-slate-200 text-slate-400 hover:bg-slate-50 disabled:hover:bg-transparent')}
        >
          首页
        </button>
      )}

      {variant === 'full' ? (
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={cn(pageBtnBase, 'px-3 border-slate-200 text-slate-600 hover:bg-slate-50')}
        >
          上一页
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={cn(
            pageBtnBase,
            'w-8 border-slate-200 text-slate-500 hover:text-primary hover:border-primary disabled:hover:text-slate-500 disabled:hover:border-slate-200',
          )}
        >
          <ChevronLeft className="size-4" />
        </button>
      )}

      {generatePageNumbers(currentPage, totalPages).map((p, i) =>
        p === -1 ? (
          <span key={`dot-${i}`} className="px-1 text-slate-400">
            ...
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={p === currentPage ? pageBtnActive : cn(pageBtnDefault, 'w-8 font-medium')}
          >
            {p}
          </button>
        ),
      )}

      {variant === 'full' ? (
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={cn(pageBtnBase, 'px-3 border-slate-200 text-slate-600 hover:bg-slate-50')}
        >
          下一页
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={cn(
            pageBtnBase,
            'w-8 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-primary disabled:hover:text-slate-600',
          )}
        >
          <ChevronRight className="size-4" />
        </button>
      )}

      {variant === 'full' && (
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className={cn(pageBtnBase, 'px-3 border-slate-200 text-slate-600 hover:bg-slate-50')}
        >
          尾页
        </button>
      )}

      <div className="flex items-center gap-1.5 ml-1 text-sm text-slate-500">
        <span className="whitespace-nowrap">跳至</span>
        <input
          type="text"
          inputMode="numeric"
          aria-label="跳转页码"
          value={jumpValue}
          onChange={(e) => setJumpValue(e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleJump();
          }}
          className="w-14 h-8 rounded-lg border border-slate-200 px-2 text-center text-slate-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
        />
        <span className="whitespace-nowrap">页</span>
        <button
          type="button"
          onClick={handleJump}
          className="px-3 h-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors cursor-pointer"
        >
          确定
        </button>
      </div>
    </div>
  );
}
