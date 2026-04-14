'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Star, Eye } from 'lucide-react';
import type { SearchResultItem } from '../api/types';

interface TrainerResultCardProps {
  item: SearchResultItem;
}

export function TrainerResultCard({ item }: TrainerResultCardProps) {
  const hl = item._highlight;
  const tags = item.expertiseTags?.split(',').filter(Boolean) ?? [];

  return (
    <Link
      href={`/trainers/${item.id}`}
      className="bg-white rounded-xl border border-slate-200 p-5 flex gap-5 hover:shadow-md transition-all group"
    >
      <div className="shrink-0 relative">
        <Image
          src={item.avatar || '/statics/images/expert-main.jpg'}
          alt={item.name || ''}
          width={100}
          height={120}
          className="w-[100px] h-[120px] object-cover rounded-sm border-2 border-white shadow-sm"
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-baseline gap-3 mb-1">
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">
              {hl?.name
                ? <span className="search-highlight" dangerouslySetInnerHTML={{ __html: hl.name }} />
                : item.name}
            </h3>
            {(item.score ?? 0) > 0 && (
              <div className="flex items-center gap-1">
                <Star className="size-4 fill-[#FFD700] text-[#FFD700]" />
                <span className="text-sm font-bold text-slate-800">{item.score!.toFixed(1)}</span>
              </div>
            )}
          </div>
          {item.title && (
            <p className="text-sm text-slate-500 line-clamp-1 mb-2">{item.title}</p>
          )}
          {(item.provinceName || item.cityName) && (
            <p className="text-xs text-slate-400 mb-2">
              {[item.provinceName, item.cityName].filter(Boolean).join(' · ')}
              {item.experienceYears ? ` · ${item.experienceYears}年教学经验` : ''}
            </p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.slice(0, 5).map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 text-[12px] rounded-full border border-slate-200 text-slate-600 bg-slate-50"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
          {(hl?.bio || hl?.intro || item.bio || item.intro) && (
            <p className="search-highlight text-xs text-slate-400 line-clamp-2 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: hl?.bio || hl?.intro || item.bio || item.intro || '' }}
            />
          )}
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Eye className="size-3.5" />
            {item.viewCount ?? 0} 次浏览
          </span>
        </div>
      </div>
    </Link>
  );
}
