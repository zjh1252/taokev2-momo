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

function TrainerCardRating({ score }: { score: number }) {
  const normalizedScore = Number.isFinite(score) ? Math.max(0, Math.min(5, score)) : 0;
  const filledStars = Math.round(normalizedScore);

  return (
    <div className="absolute right-5 top-5 flex items-center gap-1">
      <div className="flex items-center gap-0.5 text-[#f5a623]">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className={`size-3.5 ${
              index < filledStars
                ? 'fill-current text-[#f5a623]'
                : 'fill-slate-200 text-slate-200'
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-[#f5a623]">
        {normalizedScore.toFixed(1)}
      </span>
    </div>
  );
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
      className="relative min-h-[190px] bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row gap-5 hover:shadow-md transition-all group"
    >
      <TrainerCardRating score={trainer.score} />

      {/* 头像 */}
      <div className="shrink-0 relative">
        <SafeImage
          src={trainer.avatar}
          alt={displayName}
          width={150}
          height={150}
          apiResolved
          priority={priorityImage}
          className="w-[150px] h-[150px] object-cover object-[center_top] rounded-sm border-2 border-white shadow-sm"
        />
        {trainer.isTrusted === 1 && (
          <span className="absolute -bottom-1 -right-2 text-[10px] text-primary border border-primary/60 px-1.5 py-0.5 bg-white/95 font-bold tracking-wider -rotate-12 rounded-sm" style={{ borderStyle: 'dashed' }}>
            信得过
          </span>
        )}
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div className="pr-24">
          <div className="flex items-baseline gap-3 mb-1">
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">
              {displayName}
            </h3>
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
