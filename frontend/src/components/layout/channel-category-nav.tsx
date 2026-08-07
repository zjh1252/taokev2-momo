'use client';

import { ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export interface ChannelCategoryNavItem {
  name: string;
  count: number;
  href: string;
  /** 分类 ID（页内筛选时直接使用，避免名称解析偏差） */
  categoryId?: number;
}

interface ChannelCategoryNavProps {
  title: string;
  items: ChannelCategoryNavItem[];
  /** 数量单位，如「门」「位」 */
  countUnit: string;
  /** 页内筛选：与左侧分类栏同款，不整页跳转 */
  onItemClick?: (item: ChannelCategoryNavItem) => void;
}

/**
 * 频道页底部分类导航 — 仿老站灰底分类区块
 */
export function ChannelCategoryNav({
  title,
  items,
  countUnit,
  onItemClick
}: ChannelCategoryNavProps) {
  if (items.length === 0) return null;

  const itemClassName =
    'text-slate-600 hover:text-primary transition-colors flex items-center justify-between gap-2 group w-full text-left';

  return (
    <section className="max-w-full overflow-x-clip rounded-xl border border-slate-100 bg-slate-100/50 p-4 sm:p-8">
      <h2 className="mb-4 text-lg font-bold text-slate-800 sm:mb-6 sm:text-xl">{title}</h2>
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2 sm:gap-x-6 sm:gap-y-4 md:grid-cols-3 lg:grid-cols-5">
        {items.map((item) =>
          onItemClick ? (
            <button
              key={`${item.href}-${item.name}`}
              type="button"
              onClick={() => {
                onItemClick(item);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={itemClassName}
            >
              <span className="truncate">
                · {item.name} {item.count} {countUnit}
              </span>
              <ChevronRight className="size-3.5 shrink-0 text-slate-400 group-hover:text-primary" />
            </button>
          ) : (
            <Link
              key={`${item.href}-${item.name}`}
              href={item.href}
              scroll
              onClick={() => window.scrollTo({ top: 0 })}
              className={itemClassName}
            >
              <span className="truncate">
                · {item.name} {item.count} {countUnit}
              </span>
              <ChevronRight className="size-3.5 shrink-0 text-slate-400 group-hover:text-primary" />
            </Link>
          ),
        )}
      </div>
    </section>
  );
}
