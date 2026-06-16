'use client';

import { ChevronRight, Search } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { ChannelCategoryNavItem } from '@/components/layout/channel-category-nav';
import { InstitutionSidebarRecommendations } from './InstitutionSidebarRecommendations';

interface InstitutionSidebarProps {
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  onSearch: (keyword: string) => void;
  categoryItems: ChannelCategoryNavItem[];
  activeCategoryId?: number;
  basePath: string;
  categoryTitle?: string;
  association?: boolean;
}

export function InstitutionSidebar({
  keyword,
  onKeywordChange,
  onSearch,
  categoryItems,
  activeCategoryId,
  basePath,
  categoryTitle = '培训机构类别',
  association,
}: InstitutionSidebarProps) {
  const handleSubmit = () => {
    onSearch(keyword.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <aside className="w-[260px] shrink-0 flex flex-col gap-5">
      {/* 搜索区 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-center">
          <h3 className="font-bold text-primary text-[15px]">机构搜索</h3>
        </div>
        <div className="p-4 flex flex-col gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 w-16 shrink-0 text-right">关键字：</span>
            <input
              type="text"
              value={keyword}
              onChange={(e) => onKeywordChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="搜索机构名称..."
              className="flex-1 w-0 border-slate-200 bg-white rounded px-2 py-1.5 text-xs focus:ring-primary focus:border-primary outline-none transition-colors border"
            />
          </div>
          <div className="flex justify-center mt-2">
            <button
              onClick={handleSubmit}
              className="bg-primary hover:bg-primary/90 text-white font-bold py-1.5 px-6 rounded-full flex items-center gap-1 transition-all shadow-sm text-xs"
            >
              <Search className="size-3.5" /> 搜索
            </button>
          </div>
        </div>
      </div>

      {/* 培训机构类别 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-center">
          <h3 className="font-bold text-primary text-[15px]">{categoryTitle}</h3>
        </div>
        <div className="py-2 max-h-[520px] overflow-y-auto custom-scrollbar">
          <ul className="flex flex-col text-xs">
            {categoryItems.map((cat) => {
              const categoryId = extractCategoryId(cat.href);
              const isActive = activeCategoryId != null && categoryId === activeCategoryId;

              return (
                <li key={cat.href}>
                  <Link
                    href={cat.href}
                    className={`flex justify-between items-center px-5 py-2.5 transition-colors border-b border-slate-50 ${
                      isActive
                        ? 'bg-primary/5 text-primary font-medium'
                        : 'hover:bg-slate-50 hover:text-primary text-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-1 min-w-0">
                      <span className="text-slate-400 shrink-0">·</span>
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <span className="flex items-center gap-1 shrink-0 ml-2 text-slate-500">
                      {cat.count} 家
                      <ChevronRight className="size-3" />
                    </span>
                  </Link>
                </li>
              );
            })}
            {categoryItems.length === 0 && (
              <li className="px-5 py-4 text-slate-400 text-center">暂无分类数据</li>
            )}
            {activeCategoryId != null && (
              <li>
                <Link
                  href={basePath}
                  className="flex justify-center items-center px-5 py-2.5 text-primary hover:underline border-t border-slate-100"
                >
                  查看全部机构
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>

      <InstitutionSidebarRecommendations association={association} basePath={basePath} />
    </aside>
  );
}

function extractCategoryId(href: string): number | undefined {
  const query = href.includes('?') ? href.split('?')[1] : '';
  const id = new URLSearchParams(query).get('expertiseCategoryId');
  if (!id) return undefined;
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
