'use client';

import { Link } from '@/i18n/navigation';
import { Flame, Star, BookOpen } from 'lucide-react';
import type { SearchResultItem } from '../api/types';

interface CourseResultCardProps {
  item: SearchResultItem;
}

export function CourseResultCard({ item }: CourseResultCardProps) {
  const isOpen = item.type === 'OPEN_OFFLINE' || item.type === 'OPEN_ONLINE';
  const detailPath = isOpen ? `/opencourses/${item.id}` : `/innercourses/${item.id}`;

  return (
    <Link
      href={detailPath}
      className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group flex gap-4"
    >
      <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
        {item.coverUrl ? (
          <img
            src={item.coverUrl}
            alt={item.title || ''}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <BookOpen className="size-6 text-slate-300" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2 gap-2">
          <h3 className="text-base font-bold text-slate-800 group-hover:text-primary transition-colors line-clamp-1">
            {item.title}
            {item.isFeatured === 1 && (
              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-primary bg-primary/10 rounded">
                推荐
              </span>
            )}
          </h3>
          <div className="flex items-center gap-4 text-xs shrink-0">
            <span className="flex items-center gap-1 text-slate-500">
              <Flame className="size-3.5 text-orange-400" />
              <span className="text-primary font-semibold">{item.viewCount ?? 0}</span>
            </span>
            {(item.score ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-slate-500">
                <span className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-3.5 ${
                        i < Math.round(item.score ?? 0)
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-none text-slate-200'
                      }`}
                    />
                  ))}
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1.5 text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-md mb-2">
          <div className="flex items-center gap-1">
            <span className="text-slate-400 min-w-[72px]">授课讲师：</span>
            <span className="text-slate-700">{item.trainerName || '-'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400 min-w-[72px]">授课天数：</span>
            <span className="text-slate-700">
              {item.durationDays ? `${item.durationDays}天` : '-'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400 min-w-[72px]">课程分类：</span>
            <span className="text-slate-700">{item.categoryName || '-'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400 min-w-[72px]">课程价格：</span>
            <span className="text-slate-700">
              {item.isFree === 1
                ? '免费'
                : item.price != null
                  ? `¥${item.price}`
                  : '-'}
            </span>
          </div>
        </div>

        {item.keywords && (
          <div className="text-xs text-slate-400 line-clamp-1">关键字：{item.keywords}</div>
        )}
      </div>
    </Link>
  );
}
