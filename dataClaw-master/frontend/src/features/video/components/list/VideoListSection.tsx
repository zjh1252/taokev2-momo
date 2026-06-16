'use client';

import { useState, useCallback, useTransition } from 'react';
import { Search, ArrowUpDown, X } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { VideoCard } from './VideoCard';
import { getVideoList } from '../../api/service';
import type { VideoListItem, PageResponse, CategoryTreeNode } from '../../api/types';
import { cn } from '@/lib/utils';

interface VideoListSectionProps {
  initialData: PageResponse<VideoListItem>;
  categoryTree: CategoryTreeNode[];
  initialInstitutionId?: number;
  initialInstitutionName?: string;
}

const SORT_OPTIONS = [
  { key: 'default', label: '默认排序', sortBy: 'default' },
  { key: 'time', label: '最新发布', sortBy: 'time' },
  { key: 'studentCount', label: '最多学员', sortBy: 'studentCount' },
  { key: 'viewCount', label: '最多浏览', sortBy: 'viewCount' },
  { key: 'price', label: '价格最低', sortBy: 'price' },
];

const PAGE_SIZE = 15;

export function VideoListSection({
  initialData,
  categoryTree,
  initialInstitutionId,
  initialInstitutionName,
}: VideoListSectionProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [institutionId, setInstitutionId] = useState<number | undefined>(initialInstitutionId);
  const [sortKey, setSortKey] = useState('default');
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const fetchData = useCallback(
    (
      page: number,
      catId?: number,
      sort?: string,
      kw?: string,
      overrideInstitutionId?: number | null,
    ) => {
      const sortByValue = SORT_OPTIONS.find((o) => o.key === (sort ?? sortKey))?.sortBy ?? 'default';
      const instId =
        overrideInstitutionId === null
          ? undefined
          : overrideInstitutionId !== undefined
            ? overrideInstitutionId
            : institutionId;
      startTransition(async () => {
        try {
          const result = await getVideoList({
            page,
            size: PAGE_SIZE,
            categoryId: catId ?? selectedCategory,
            sortBy: sortByValue === 'default' ? undefined : sortByValue,
            keyword: (kw ?? keyword) || undefined,
            institutionId: instId,
          });
          setData(result);
          setCurrentPage(page);
        } catch (e) {
          console.error('加载录播课列表失败:', e);
        }
      });
    },
    [selectedCategory, sortKey, keyword, institutionId],
  );

  const handleClearInstitution = useCallback(() => {
    setInstitutionId(undefined);
    fetchData(1, selectedCategory, sortKey, keyword, null);
    router.replace('/videos');
  }, [fetchData, router, selectedCategory, sortKey, keyword]);

  const handleCategoryChange = useCallback(
    (catId?: number) => {
      setSelectedCategory(catId);
      fetchData(1, catId);
    },
    [fetchData],
  );

  const handleSortChange = useCallback(
    (key: string) => {
      setSortKey(key);
      fetchData(1, selectedCategory, key);
    },
    [fetchData, selectedCategory],
  );

  const handleSearch = useCallback(() => {
    fetchData(1, selectedCategory, sortKey, keyword);
  }, [fetchData, selectedCategory, sortKey, keyword]);

  const handlePageChange = useCallback(
    (page: number) => {
      fetchData(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [fetchData],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* 当前过滤 chip */}
      {institutionId && initialInstitutionName && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 flex items-center gap-2 text-sm">
          <span className="text-slate-500">当前筛选：</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs">
            机构：{initialInstitutionName}
            <button
              onClick={handleClearInstitution}
              className="hover:text-primary/70 inline-flex items-center"
              aria-label="清除机构筛选"
            >
              <X className="size-3" />
            </button>
          </span>
        </div>
      )}

      {/* 分类筛选栏 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-700 mr-2">分类：</span>
          <button
            onClick={() => handleCategoryChange(undefined)}
            className={cn(
              'px-3 py-1 text-sm rounded-full transition-colors',
              !selectedCategory
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            全部
          </button>
          {categoryTree.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={cn(
                'px-3 py-1 text-sm rounded-full transition-colors',
                selectedCategory === cat.id
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* 排序 + 搜索栏 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-2 flex items-center gap-2">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => handleSortChange(opt.key)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm transition-colors inline-flex items-center gap-1',
              sortKey === opt.key
                ? 'font-bold text-primary bg-primary/5'
                : 'font-medium text-slate-600 hover:bg-slate-50',
            )}
          >
            {opt.label}
            <ArrowUpDown className="size-3.5" />
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索录播课..."
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <button
            onClick={handleSearch}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <Search className="size-4" />
          </button>
        </div>

        <span className="text-sm text-slate-500 pr-2 shrink-0">
          共 <strong className="text-slate-900">{data.total}</strong> 门课程
        </span>
      </div>

      {/* 卡片网格 */}
      <div className={cn('transition-opacity', isPending ? 'opacity-50' : '')}>
        {data.list.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {data.list.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
            暂无录播课
          </div>
        )}
      </div>

      {/* 分页 */}
      {data.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage <= 1}
              className="px-3 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-sm text-slate-400 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              首页
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            {generatePageNumbers(currentPage, data.totalPages).map((p, i) =>
              p === -1 ? (
                <span key={`dot-${i}`} className="text-slate-400 px-1">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={cn(
                    'w-8 h-8 flex items-center justify-center rounded-lg font-medium text-sm',
                    p === currentPage
                      ? 'bg-primary text-white shadow-sm'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {p}
                </button>
              ),
            )}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= data.totalPages}
              className="px-3 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
            <button
              onClick={() => handlePageChange(data.totalPages)}
              disabled={currentPage >= data.totalPages}
              className="px-3 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              尾页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function generatePageNumbers(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: number[] = [1];
  if (current > 3) pages.push(-1);
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push(-1);
  pages.push(total);
  return pages;
}
