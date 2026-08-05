'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Star, MapPin } from 'lucide-react';
import { SafeImage } from '@/components/safe-image';
import { useBumpedViewCount } from '@/hooks/use-bumped-view-count';
import type { TrainerListItem } from '../../types';
import { pickDisplayTitle, plainIntroOrUndefined } from '../../utils/displayTitle';
import { getTrainerDisplayName } from '../../utils/displayName';
import { rememberTrainerListPath } from '../../utils/list-return';
interface TrainerCardProps {
  trainer: TrainerListItem;
  /** 首屏前若干张优先加载，避免翻页后 16 张同时请求 */
  priorityImage?: boolean;
}

function TrainerCardRating({ score }: { score: number }) {
  const normalizedScore = Number.isFinite(Number(score))
    ? Math.max(0, Math.min(5, Number(score)))
    : 0;
  // 无有效评分时默认展示 5.0，避免列表位空白
  const displayScore = normalizedScore > 0 ? normalizedScore : 5;
  const filledStars = Math.round(displayScore);

  return (
    <div className="absolute right-4 top-4 flex items-center gap-1 sm:right-5 sm:top-5">
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
        {displayScore.toFixed(1)}
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
  // 领域/行业可能同名（如「其它」），去重后再展示，避免 React key 冲突
  const displayTags = [...new Set([...expertiseNames, ...industryNames])];

  return (
    <Link
      href={`/trainer/${trainer.id}.htm`}
      onClick={() => {
        rememberTrainerListPath();
        onCardClick();
      }}
      className="relative min-h-[190px] max-w-full bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row gap-5 hover:shadow-md transition-all group"
    >
      <TrainerCardRating score={trainer.score} />

      {/* 头像：self-start 避免被卡片内容撑高；relative 盒与头像同尺寸，徽章才紧贴像框 */}
      <div className="shrink-0 self-start w-[100px] h-[120px] relative">
        <SafeImage
          src={trainer.avatar}
          fallback={trainer.avatarFallback || undefined}
          alt={displayName}
          width={100}
          height={120}
          apiResolved
          priority={priorityImage}
          className="w-full h-full object-cover object-[center_top] rounded-sm border-2 border-white shadow-sm"
        />
        {trainer.isTrusted === 1 && (
          <Image
            src="/statics/images/icons/trusted-xin.png"
            alt="信得过"
            width={36}
            height={36}
            unoptimized
            className="absolute -bottom-3.5 -right-2 w-9 h-9 object-contain drop-shadow-md pointer-events-none select-none"
          />
        )}
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div className="sm:pr-24">
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
