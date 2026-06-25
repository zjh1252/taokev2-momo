'use client';

import { Link } from '@/i18n/navigation';
import { Star, MapPin } from 'lucide-react';
import { SafeImage } from '@/components/safe-image';
import { useBumpedViewCount } from '@/hooks/use-bumped-view-count';
import type { TrainerListItem } from '../../types';
import { pickDisplayTitle, plainIntroOrUndefined } from '../../utils/displayTitle';
import { getTrainerDisplayName } from '../../utils/displayName';
interface TrainerCardProps {
  trainer: TrainerListItem;
  /** 首屏前若干张优先加载，避免翻页后 16 张同时请求 */
  priorityImage?: boolean;
}

export function TrainerCard({ trainer, priorityImage = false }: TrainerCardProps) {
  const { viewCount, onCardClick } = useBumpedViewCount(trainer.viewCount, 'trainer', trainer.id);
  const displayName = getTrainerDisplayName(trainer);
  const displayTitle = pickDisplayTitle(trainer.title, displayName)
    || plainIntroOrUndefined(trainer.oneLineIntro);
  const expertiseNames = trainer.expertiseCategories?.map((c) => c.categoryName).filter(Boolean) ?? [];
  const industryNames = trainer.industryCategories?.map((c) => c.categoryName).filter(Boolean) ?? [];
  const displayTags = [...expertiseNames, ...industryNames];

  return (
    <Link
      href={`/trainer/${trainer.id}.htm`}
      onClick={onCardClick}
      className="bg-white rounded-xl border border-slate-200 p-5 flex gap-5 hover:shadow-md transition-all group"
    >
      {/* 头像 */}
      <div className="shrink-0 relative">
        <SafeImage
          src={trainer.avatar}
          alt={displayName}
          width={100}
          height={120}
          apiResolved
          priority={priorityImage}
          className="w-[100px] h-[120px] object-cover rounded-sm border-2 border-white shadow-sm"
        />
        {trainer.isTrusted === 1 && (
          <span className="absolute -bottom-1 -right-2 text-[10px] text-primary border border-primary/60 px-1.5 py-0.5 bg-white/95 font-bold tracking-wider -rotate-12 rounded-sm" style={{ borderStyle: 'dashed' }}>
            信得过
          </span>
        )}
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-baseline gap-3 mb-1">
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">
              {displayName}
            </h3>
            {trainer.score > 0 && (
              <div className="flex items-center gap-1">
                <Star className="size-4 fill-[#FFD700] text-[#FFD700]" />
                <span className="text-sm font-bold text-slate-800">{trainer.score.toFixed(1)}</span>
              </div>
            )}
          </div>
          {displayTitle ? (
            <p className="text-sm text-slate-500 line-clamp-1 mb-2">{displayTitle}</p>
          ) : null}

          {/* 城市 */}
          {(trainer.provinceName) && (
            <div className="flex items-center gap-1 text-xs text-slate-400 mb-3">
              <MapPin className="size-3" />
              <span>{ trainer.provinceName}</span>
            </div>
          )}

          {/* 标签 */}
          <div className="flex flex-wrap gap-2">
            {displayTags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 text-[12px] rounded-full border border-slate-200 text-slate-600 bg-slate-50"
              >
                {tag.trim()}
              </span>
            ))}
          </div>
        </div>

        {/* 底部信息 */}
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
          {trainer.commentCount > 0 && <span>{trainer.commentCount} 条评价</span>}
          {viewCount > 0 && <span>{viewCount} 次曝光</span>}
        </div>
      </div>
    </Link>
  );
}
