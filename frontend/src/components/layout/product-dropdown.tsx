import { useTranslations } from 'next-intl';
import { ChevronDown, Sparkles, LayoutGrid, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 「培训宝」产品下拉菜单 — 纯 CSS group-hover 实现，无需客户端 JS
 */
export function ProductDropdown() {
  const t = useTranslations('nav.product');

  const items = [
    { label: t('enterprise'), icon: Sparkles },
    { label: t('learning'), icon: LayoutGrid },
    { label: t('reports'), icon: BarChart3 },
  ] as const;

  return (
    <div className="relative group">
      <button className="bg-white text-muted-foreground text-[14px] px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition-all flex items-center gap-1">
        {t('label')}
        <ChevronDown className="size-4" />
      </button>

      <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 absolute left-0 top-full mt-1 w-40 bg-white border border-slate-100 z-[60] overflow-hidden rounded-lg shadow-lg transition-all duration-150">
        {items.map(({ label, icon: Icon }, idx) => (
          <a
            key={label}
            href="#"
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50',
              idx < items.length - 1 && 'border-b border-slate-50',
            )}
          >
            <Icon className="size-4 text-slate-400" />
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}
