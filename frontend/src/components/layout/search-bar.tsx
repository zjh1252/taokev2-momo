'use client';

import { useTranslations } from 'next-intl';
import { Search, ChevronDown } from 'lucide-react';
import { useState, type FormEvent } from 'react';

/**
 * 顶部搜索栏 — 包含分类选择 + 关键词输入 + 搜索按钮
 */
export function SearchBar() {
  const t = useTranslations('nav.search');
  const [keyword, setKeyword] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    // TODO: 跳转至搜索结果页
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center bg-slate-100 rounded-[4px] overflow-hidden p-0.5 border border-slate-200"
    >
      <button
        type="button"
        className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-500 border-r border-slate-200 hover:bg-slate-200 shrink-0"
      >
        {t('category')}
        <ChevronDown className="size-3.5" />
      </button>

      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        className="bg-transparent border-none focus:ring-0 focus:outline-none text-xs w-[140px] px-2"
        placeholder={t('placeholder')}
        type="text"
      />

      <button
        type="submit"
        className="bg-primary text-white p-1.5 flex items-center justify-center hover:bg-primary-container transition-colors rounded-[2px]"
      >
        <Search className="size-[18px]" />
      </button>
    </form>
  );
}
