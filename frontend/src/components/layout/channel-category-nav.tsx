import { ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export interface ChannelCategoryNavItem {
  name: string;
  count: number;
  href: string;
}

interface ChannelCategoryNavProps {
  title: string;
  items: ChannelCategoryNavItem[];
  /** 数量单位，如「门」「位」 */
  countUnit: string;
}

/**
 * 频道页底部分类导航 — 仿老站灰底分类区块
 */
export function ChannelCategoryNav({ title, items, countUnit }: ChannelCategoryNavProps) {
  if (items.length === 0) return null;

  return (
    <section className="bg-slate-100/50 rounded-xl p-8 border border-slate-100">
      <h2 className="text-xl font-bold text-slate-800 mb-6">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-4 gap-x-6 text-sm">
        {items.map((item) => (
          <Link
            key={`${item.href}-${item.name}`}
            href={item.href}
            className="text-slate-600 hover:text-primary transition-colors flex items-center justify-between gap-2 group"
          >
            <span className="truncate">
              · {item.name} {item.count} {countUnit}
            </span>
            <ChevronRight className="size-3.5 shrink-0 text-slate-400 group-hover:text-primary" />
          </Link>
        ))}
      </div>
    </section>
  );
}
