'use client';

/**
 * 专家列表底部排序栏 — 综合排序 / 好评率
 *
 * <p>从筛选区拆出的独立条带，紧贴列表上方，与老网站布局一致。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-22 15:10
 */
export function TrainerSortBar({
  sort,
  total,
  onChange,
}: {
  sort: string;
  total: number;
  onChange: (sort: string) => void;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 flex items-center justify-between">
      <div className="flex items-center gap-1 text-[14px]">
        <span className="text-slate-500 mr-2">排序：</span>
        <SortPill active={sort === 'default'} onClick={() => onChange('default')}>
          综合排序
        </SortPill>
        <SortPill active={sort === 'score'} onClick={() => onChange('score')}>
          好评率
        </SortPill>
      </div>
      <div className="text-sm text-slate-500">
        共 <strong className="text-slate-900 mx-1">{total}</strong> 位专家
      </div>
    </div>
  );
}

function SortPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-[13px] cursor-pointer transition-colors ${
        active
          ? 'bg-primary text-white font-semibold shadow-sm hover:bg-primary/90'
          : 'text-slate-600 hover:text-primary hover:bg-primary/5'
      }`}
    >
      {children}
    </button>
  );
}
