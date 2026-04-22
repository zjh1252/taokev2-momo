'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect, type FormEvent } from 'react';
import { ROUTES } from '@/config/routes';

const SEARCH_CATEGORIES = [
  { key: 'trainer', i18nKey: 'categoryTrainer' },
  { key: 'openCourse', i18nKey: 'categoryOpenCourse' },
  { key: 'innerCourse', i18nKey: 'categoryInnerCourse' },
] as const;

/**
 * 顶部搜索栏 — 包含分类下拉选择 + 关键词输入 + 搜索按钮
 */
export function SearchBar() {
  const t = useTranslations('nav.search');
  const router = useRouter();
  const searchParams = useSearchParams();

  // 仅当 URL 中的 tab 是搜索分类的合法值时才采纳，避免与详情页等使用的 ?tab=xxx 冲突
  const normalizeCategoryKey = (raw: string | null): string => {
    if (raw && SEARCH_CATEGORIES.some((c) => c.key === raw)) return raw;
    return 'trainer';
  };

  const [keyword, setKeyword] = useState(searchParams.get('keyword') ?? '');
  const [categoryKey, setCategoryKey] = useState<string>(() =>
    normalizeCategoryKey(searchParams.get('tab')),
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // URL 参数变化时同步回搜索框（如在搜索结果页切换 tab）
  useEffect(() => {
    setKeyword(searchParams.get('keyword') ?? '');
    setCategoryKey(normalizeCategoryKey(searchParams.get('tab')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentCategory =
    SEARCH_CATEGORIES.find((c) => c.key === categoryKey) ?? SEARCH_CATEGORIES[0];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    const params = new URLSearchParams({ keyword: keyword.trim(), tab: categoryKey });
    router.push(`${ROUTES.SEARCH}?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center bg-slate-100 rounded-md overflow-visible p-0.5 border border-slate-200 relative min-w-[360px]"
    >
      {/* 分类下拉 */}
      <div ref={dropdownRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-500 border-r border-slate-200 hover:bg-slate-200 hover:text-slate-700 transition-colors rounded-l-md"
        >
          {t(currentCategory.i18nKey)}
          <ChevronDown
            className={`size-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50 min-w-[110px]">
            {SEARCH_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => {
                  setCategoryKey(cat.key);
                  setDropdownOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  categoryKey === cat.key
                    ? 'text-primary bg-primary/5 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-primary'
                }`}
              >
                {t(cat.i18nKey)}
              </button>
            ))}
          </div>
        )}
      </div>

      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-full min-w-[180px] px-3 py-1"
        placeholder={t('placeholder')}
        type="text"
      />

      <button
        type="submit"
        className="bg-primary text-white p-2 flex items-center justify-center hover:bg-primary/90 transition-colors rounded-[3px]"
      >
        <Search className="size-[18px]" />
      </button>
    </form>
  );
}
