'use client';

import { Link } from '@/i18n/navigation';
import { Users, Eye } from 'lucide-react';
import { SafeImage } from '@/components/safe-image';
import { useBumpedViewCount } from '@/hooks/use-bumped-view-count';
import { getVideoCoverFallback } from '@/lib/media';
import type { VideoListItem } from '../../api/types';

interface VideoCardProps {
  video: VideoListItem;
}

export function VideoCard({ video }: VideoCardProps) {
  const { viewCount, onCardClick } = useBumpedViewCount(video.viewCount, 'video', video.id);

  return (
    <Link
      href={`/video/${video.id}.htm`}
      onClick={onCardClick}
      className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group flex flex-col"
    >
      {/* 封面 */}
      <div className="relative aspect-video bg-slate-100">
        <SafeImage
          src={video.coverUrl || undefined}
          alt={video.title}
          fill
          apiResolved
          className="object-cover"
          fallback={getVideoCoverFallback()}
        />
        {/* 集数角标 */}
        {video.totalEpisodes > 0 && (
          <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded">
            {video.totalEpisodes} 集
          </span>
        )}
        {/* 免费角标 */}
        {video.isFree === 1 && (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-[11px] px-2 py-0.5 rounded">
            免费
          </span>
        )}
      </div>

      {/* 信息区 */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <h3 className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
          {video.title}
        </h3>

        <p className="text-xs text-slate-500 truncate">
          {/* 专家：对齐老网站逻辑 — TRAINER 才有 teacherName → publisherName 兜底链，非 TRAINER 仅取 teacherName */}
          专家：{video.teacherName || (video.publisherType === 'TRAINER' ? video.publisherName : null) || '--'}
        </p>

        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-0.5">
              <Eye className="size-3" />
              {viewCount}
            </span>
            <span className="flex items-center gap-0.5">
              <Users className="size-3" />
              {video.studentCount}
            </span>
          </div>
          {video.isFree === 1 ? (
            <span className="text-sm font-bold text-green-600">免费</span>
          ) : video.unlocked ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-green-600">已解锁</span>
              {video.price > 0 && (
                <span className="text-sm font-bold text-primary">¥{video.price}</span>
              )}
            </div>
          ) : video.price > 0 ? (
            <span className="text-sm font-bold text-primary">¥{video.price}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
