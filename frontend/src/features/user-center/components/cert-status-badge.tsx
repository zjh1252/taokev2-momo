import { cn } from '@/lib/utils';

const MAP: Record<number, { label: string; className: string }> = {
  1: { label: '待审核', className: 'bg-amber-50 text-amber-600 border-amber-200' },
  2: { label: '已通过', className: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  3: { label: '已驳回', className: 'bg-red-50 text-red-600 border-red-200' },
};

/** 资质审核状态徽章（学历/工作列表用） */
export function CertStatusBadge({ status }: { status?: number | null }) {
  const cfg = (status && MAP[status]) || {
    label: '未提交',
    className: 'bg-slate-50 text-slate-500 border-slate-200',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium',
        cfg.className,
      )}
    >
      {cfg.label}
    </span>
  );
}
