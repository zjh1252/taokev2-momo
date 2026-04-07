'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

interface InstitutionSidebarProps {
  onSearch: (keyword: string) => void;
}

export function InstitutionSidebar({ onSearch }: InstitutionSidebarProps) {
  const [keyword, setKeyword] = useState('');

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
              onChange={(e) => setKeyword(e.target.value)}
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

      {/* 培训机构类别（静态展示） */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-center">
          <h3 className="font-bold text-primary text-[15px]">培训机构类别</h3>
        </div>
        <div className="py-2 max-h-[350px] overflow-y-auto custom-scrollbar">
          <ul className="flex flex-col text-xs">
            {CATEGORY_ITEMS.map((cat) => (
              <li key={cat.name}>
                <span className="flex justify-between items-center px-5 py-2.5 hover:bg-slate-50 hover:text-primary text-slate-700 transition-colors border-b border-slate-50 cursor-default">
                  <span className="flex items-center gap-1">
                    <span className="text-slate-400">·</span> {cat.name}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}

const CATEGORY_ITEMS = [
  { name: '经营战略' },
  { name: '市场营销' },
  { name: '财务管理' },
  { name: '采购管理' },
  { name: '生产管理' },
  { name: '物流管理' },
  { name: '客户服务' },
  { name: '人力资源' },
  { name: '培训发展' },
  { name: '质量管理' },
  { name: '项目管理' },
  { name: '领导力' },
  { name: '职业素养' },
  { name: '其它' },
];
