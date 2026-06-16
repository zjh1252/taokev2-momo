import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';

interface CityChannelSectionProps {
  title: string;
  emptyText?: string;
  isEmpty?: boolean;
  viewMoreHref?: string;
  viewMoreLabel?: string;
  children: React.ReactNode;
}

/**
 * 城市频道通用板块容器 — H2 标题 + 空态 + 查看更多
 */
export function CityChannelSection({
  title,
  emptyText = '暂无相关内容',
  isEmpty = false,
  viewMoreHref,
  viewMoreLabel = '查看更多',
  children,
}: CityChannelSectionProps) {
  return (
    <section className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden">
      <header className="px-5 py-3 border-b border-slate-100 bg-slate-50">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
      </header>

      {isEmpty ? (
        <div className="py-10 text-center text-sm text-slate-400">{emptyText}</div>
      ) : (
        children
      )}

      {viewMoreHref ? (
        <footer className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
          <Link
            href={viewMoreHref}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            {viewMoreLabel}
            <ArrowRight className="size-4" />
          </Link>
        </footer>
      ) : null}
    </section>
  );
}
