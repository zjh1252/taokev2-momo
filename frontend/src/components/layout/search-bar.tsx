'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Search, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect, type FormEvent } from 'react';
import { ROUTES } from '@/config/routes';
import { cn } from '@/lib/utils';
import {
  HEADER_SEARCH_CATEGORIES,
  buildSearchTarget,
  isHeaderSearchCategoryKey,
  pathnameToSearchCategory,
  type HeaderSearchCategoryKey,
} from '@/config/search-categories';

/**
 * 顶部搜索栏 — 分类下拉 + 关键词 + 搜索按钮
 *
 * <p>专家/公开课/内训课走 ES 全文搜索页；录播课/机构/培协跳转对应列表页并带 {@code keyword}。</p>
 */
type SearchBarProps = {
  className?: string;
};

export function SearchBar({ className }: SearchBarProps) {
  const t = useTranslations('nav.search');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const resolveCategoryKey = (): HeaderSearchCategoryKey => {
    const tabParam = searchParams.get('tab');
    const onSearchPage = pathname === ROUTES.SEARCH || pathname.endsWith('/search');
    if (onSearchPage && isHeaderSearchCategoryKey(tabParam)) {
      return tabParam;
    }
    const fromPath = pathnameToSearchCategory(pathname);
    if (fromPath) return fromPath;
    if (isHeaderSearchCategoryKey(tabParam)) return tabParam;
    return 'trainer';
  };

  const [keyword, setKeyword] = useState(() => searchParams.get('keyword') ?? '');
  const [categoryKey, setCategoryKey] = useState<HeaderSearchCategoryKey>(resolveCategoryKey);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setKeyword(searchParams.get('keyword') ?? '');
    setCategoryKey(resolveCategoryKey());
    setSuggestionOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setSuggestionOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentCategory =
    HEADER_SEARCH_CATEGORIES.find((c) => c.key === categoryKey) ?? HEADER_SEARCH_CATEGORIES[0];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSuggestionOpen(false);
    router.push(buildSearchTarget(categoryKey, keyword));
  };

  const handleSuggestionSelect = (key: HeaderSearchCategoryKey) => {
    setCategoryKey(key);
    setSuggestionOpen(false);
    router.push(buildSearchTarget(key, keyword));
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={cn(
        'flex min-w-0 items-center bg-slate-100 rounded-md overflow-visible p-0.5 border border-slate-200 relative w-full sm:min-w-[360px]',
        className,
      )}
    >
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => {
            setDropdownOpen(!dropdownOpen);
            setSuggestionOpen(false);
          }}
          className="flex items-center gap-1 px-2.5 py-2 text-xs text-slate-500 border-r border-slate-200 hover:bg-slate-200 hover:text-slate-700 transition-colors rounded-l-md sm:gap-1.5 sm:px-4 sm:text-sm"
        >
          {t(currentCategory.i18nKey)}
          <ChevronDown
            className={`size-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {dropdownOpen && (
          <SearchCategoryMenu
            categoryKey={categoryKey}
            onSelect={(key) => {
              setCategoryKey(key);
              setDropdownOpen(false);
              if (keyword.trim()) setSuggestionOpen(true);
            }}
            t={t}
          />
        )}
      </div>

      <input
        value={keyword}
        onChange={(e) => {
          setKeyword(e.target.value);
          setSuggestionOpen(Boolean(e.target.value.trim()));
          setDropdownOpen(false);
        }}
        onFocus={() => {
          setSuggestionOpen(Boolean(keyword.trim()));
          setDropdownOpen(false);
        }}
        className="min-w-0 bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-full px-2 py-1 sm:px-3"
        placeholder={t('placeholder')}
        type="search"
        enterKeyHint="search"
        aria-label={t('placeholder')}
      />

      <button
        type="submit"
        className="bg-primary text-white p-2 flex items-center justify-center hover:bg-primary/90 transition-colors rounded-[3px]"
        aria-label={t('submit')}
      >
        <Search className="size-[18px]" />
      </button>

      {suggestionOpen && keyword.trim() && (
        <SearchSuggestionMenu
          keyword={keyword.trim()}
          onSelect={handleSuggestionSelect}
          t={t}
        />
      )}
    </form>
  );
}

function SearchSuggestionMenu({
  keyword,
  onSelect,
  t,
}: {
  keyword: string;
  onSelect: (key: HeaderSearchCategoryKey) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg border border-slate-200 overflow-hidden z-50">
      {HEADER_SEARCH_CATEGORIES.map((cat) => (
        <button
          key={cat.key}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelect(cat.key)}
          className="w-full text-left px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100"
        >
          <span>搜 “{keyword}” 相关</span>
          <span className="font-bold text-[#0066cc]">{t(cat.i18nKey)}&gt;&gt;</span>
        </button>
      ))}
    </div>
  );
}

function SearchCategoryMenu({
  categoryKey,
  onSelect,
  t,
}: {
  categoryKey: HeaderSearchCategoryKey;
  onSelect: (key: HeaderSearchCategoryKey) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50 min-w-[120px]">
      {HEADER_SEARCH_CATEGORIES.map((cat) => (
        <button
          key={cat.key}
          type="button"
          onClick={() => onSelect(cat.key)}
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
  );
}
