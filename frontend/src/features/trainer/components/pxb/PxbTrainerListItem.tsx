'use client';

import { SafeImage } from '@/components/safe-image';
import { getTrainerAvatarFallback } from '@/lib/media';
import type { TrainerListItem } from '../../types';
import { getTrainerDisplayName } from '../../utils/displayName';

function StarRating({ score }: { score: number }) {
  const filled = Math.round(Math.max(0, Math.min(5, score)));
  return (
    <span className="pxb-stars" aria-label={`评分 ${score}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`pxb-star${i < filled ? ' is-filled' : ''}`}>
          ★
        </span>
      ))}
    </span>
  );
}

function formatLocation(trainer: TrainerListItem): string {
  const parts = [trainer.provinceName, trainer.cityName].filter((s) => s?.trim());
  return parts.length > 0 ? parts.join('') : '待定';
}

function formatPrice(trainer: TrainerListItem): string {
  const price = trainer.taokePrice != null ? Number(trainer.taokePrice) : 0;
  if (price > 0) return `￥${price}`;
  return '待定';
}

interface Props {
  trainer: TrainerListItem;
}

export function PxbTrainerListItem({ trainer }: Props) {
  const displayName = getTrainerDisplayName(trainer);
  const href = `/trainer/${trainer.id}.htm?origin=91pxb`;
  const expertiseNames = trainer.expertiseCategories?.map((c) => c.categoryName).filter(Boolean) ?? [];
  const industryNames = trainer.industryCategories?.map((c) => c.categoryName).filter(Boolean) ?? [];
  const courseTitles = trainer.courseTitles?.filter(Boolean) ?? [];
  const courseCount = trainer.courseCount ?? 0;
  const tags = trainer.expertiseTags?.trim() || '';

  return (
    <div className="pxb-trainer-item">
      <div className="pxb-trainer-photo">
        <a href={href}>
          <SafeImage
            src={trainer.avatar}
            fallback={getTrainerAvatarFallback(displayName)}
            alt={displayName}
            width={108}
            height={108}
            className="pxb-trainer-avatar"
          />
        </a>
      </div>
      <div className="pxb-trainer-body">
        <div className="pxb-trainer-head">
          <a className="pxb-trainer-name" href={href}>
            {displayName}
          </a>
          {trainer.isTrusted === 1 ? (
            <span className="pxb-trainer-badge" title="信得过讲师">
              信
            </span>
          ) : null}
          {trainer.oneLineIntro ? (
            <span className="pxb-trainer-intro" title={trainer.oneLineIntro}>
              {trainer.oneLineIntro}
            </span>
          ) : null}
        </div>
        <div className="pxb-trainer-grid">
          <div className="pxb-trainer-row">
            <div className="pxb-trainer-cell w50">淘课价：{formatPrice(trainer)}</div>
            <div className="pxb-trainer-cell w50">
              擅长领域：{expertiseNames.length > 0 ? expertiseNames.join(' ') : '-'}
            </div>
          </div>
          <div className="pxb-trainer-row">
            <div className="pxb-trainer-cell w50">常驻地：{formatLocation(trainer)}</div>
            <div className="pxb-trainer-cell w50">
              擅长行业：{industryNames.length > 0 ? industryNames.join(' ') : '-'}
            </div>
          </div>
          {tags ? (
            <div className="pxb-trainer-line muted">擅长方向：{tags.length > 90 ? `${tags.slice(0, 90)}…` : tags}</div>
          ) : null}
          {courseTitles.length > 0 ? (
            <div className="pxb-trainer-line muted">
              讲师课程：{courseTitles.join(' ')}
            </div>
          ) : null}
          <div className="pxb-trainer-row pxb-trainer-stats">
            <div className="pxb-trainer-cell w98 pxb-trainer-meta">
              <span>课程：<a href={`/trainer/${trainer.id}/courses.htm?origin=91pxb`} target="_blank" rel="noopener noreferrer">{courseCount}</a></span>
              <span>人气：{trainer.viewCount ?? 0}</span>
              {trainer.commentCount > 0 && trainer.score ? (
                <span className="pxb-trainer-rating">
                  评价：<StarRating score={Number(trainer.score ?? 0)} />
                </span>
              ) : (
                <span></span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
