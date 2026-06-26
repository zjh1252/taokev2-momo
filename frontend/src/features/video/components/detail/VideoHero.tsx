'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Clock, Users, Eye, Lock, List, Star } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { toast } from 'sonner';
import { SafeImage } from '@/components/safe-image';
import { DEFAULT_VIDEO_COVER } from '@/lib/media';
import type { VideoDetail } from '../../api/types';
import { useVideoPlayback } from '../../context/video-playback-context';
import { VideoChapterList } from './VideoChapterList';
import {
  addFavorite,
  removeFavorite,
  getInteractionState,
} from '@/features/interaction/api/service';
import { useAuthGuard } from '@/lib/auth/auth-guard-context';

interface VideoHeroProps {
  video: VideoDetail;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}小时${m > 0 ? `${m}分钟` : ''}`;
  return `${m}分钟`;
}

function VideoStarRating({ score }: { score: number }) {
  const normalized = Math.max(0, Math.min(5, score));
  const fullStars = Math.floor(normalized);
  const hasHalf = normalized - fullStars >= 0.25;

  return (
    <div className="flex items-center text-sky-400">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < fullStars || (i === fullStars && hasHalf);
        return (
          <Star
            key={i}
            className={`size-4 ${filled ? 'fill-current' : 'fill-none'}`}
          />
        );
      })}
    </div>
  );
}

function VideoCoverPreview({
  video,
  accessible,
}: {
  video: VideoDetail;
  accessible: boolean;
}) {
  const playHref = ROUTES.videoPlay(video.id);

  const cover = (
    <>
      {video.coverUrl ? (
        <SafeImage
          src={video.coverUrl}
          alt={video.title}
          fill
          className="object-cover"
          fallback={DEFAULT_VIDEO_COVER}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-900">
          {accessible ? (
            <Play className="size-16 text-slate-500" />
          ) : (
            <Lock className="size-16 text-slate-400" />
          )}
        </div>
      )}
    </>
  );

  if (accessible) {
    return (
      <Link
        href={playHref}
        className="group relative block w-full h-full"
        aria-label="进入播放页观看"
      >
        {cover}
        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <span className="flex size-16 items-center justify-center rounded-full bg-primary/90 text-white shadow-lg shadow-primary/40 group-hover:scale-105 transition-transform">
            <Play className="size-8 fill-current ml-1" />
          </span>
          <span className="text-sm font-medium text-white/95">点击观看视频</span>
        </div>
      </Link>
    );
  }

  return (
    <div className="relative w-full h-full">
      {cover}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
        <div className="flex flex-col items-center gap-2">
          <Lock className="size-12 text-white/80" />
          <p className="text-sm text-white/90 px-4">购买后即可解锁观看</p>
        </div>
      </div>
    </div>
  );
}

export function VideoHero({ video }: VideoHeroProps) {
  const { requireAuth } = useAuthGuard();
  const { accessible } = useVideoPlayback();
  const [showChapterPopover, setShowChapterPopover] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(video.favoriteCount ?? 0);
  const [favLoading, setFavLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFavoriteCount(video.favoriteCount ?? 0);
  }, [video.favoriteCount]);

  useEffect(() => {
    getInteractionState('VIDEO', video.id)
      .then((s) => {
        setFavorited(s.favorited);
        setFavoriteCount(s.favoriteCount);
      })
      .catch(() => {});
  }, [video.id]);

  const toggleFavorite = useCallback(async () => {
    setFavLoading(true);
    try {
      if (favorited) {
        await removeFavorite('VIDEO', video.id);
        setFavorited(false);
        setFavoriteCount((c) => Math.max(0, c - 1));
        toast.success('已取消收藏');
      } else {
        await addFavorite('VIDEO', video.id);
        setFavorited(true);
        setFavoriteCount((c) => c + 1);
        toast.success('收藏成功');
      }
    } catch {
      // 错误提示已在 apiClient 中弹出
    } finally {
      setFavLoading(false);
    }
  }, [favorited, video.id]);

  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl overflow-hidden">
      <div className="flex flex-col md:flex-row gap-6 p-6">
        <div className="relative w-full md:w-[min(100%,480px)] aspect-video rounded-lg overflow-hidden bg-slate-950 shrink-0">
          <VideoCoverPreview video={video} accessible={accessible} />
        </div>

        <div className="flex-1 flex flex-col justify-between text-white min-w-0">
          <div>
            <div className="flex items-center gap-2 mb-3">
              {video.isFree === 1 && (
                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded">免费</span>
              )}
              {video.videoTypeLabel && (
                <span className="bg-white/10 text-white/80 text-xs px-2 py-0.5 rounded">
                  {video.videoTypeLabel}
                </span>
              )}
              {video.categoryName && (
                <span className="bg-white/10 text-white/80 text-xs px-2 py-0.5 rounded">
                  {video.categoryName}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold mb-3">{video.title}</h1>
            {accessible && (
              <Link
                href={ROUTES.videoPlay(video.id)}
                className="inline-flex items-center gap-2 mb-3 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-sm font-semibold text-white shadow-md shadow-primary/30 transition-colors"
              >
                <Play className="size-4 fill-current" />
                立即观看
              </Link>
            )}
            {video.teacherName && (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-2">
                <p className="text-sm text-white/70">授课老师：{video.teacherName}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-sky-400">视频评分</span>
                  <VideoStarRating score={video.score ?? 0} />
                </div>
              </div>
            )}
            {!video.teacherName && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-sky-400">视频评分</span>
                <VideoStarRating score={video.score ?? 0} />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-white/60">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowChapterPopover(!showChapterPopover)}
                className="flex items-center gap-1.5 hover:text-white/90 transition-colors cursor-pointer group"
              >
                <List className="size-4" />
                <span className="group-hover:underline">共 {video.totalEpisodes} 集</span>
              </button>
              {showChapterPopover && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowChapterPopover(false)}
                  />
                  <div
                    ref={popoverRef}
                    className="absolute z-50 bottom-full left-0 mb-2 w-80 max-h-96 overflow-y-auto bg-white rounded-xl shadow-2xl border border-slate-200 p-4"
                  >
                    <h3 className="text-sm font-bold text-slate-800 mb-3">课程目录</h3>
                    <VideoChapterList
                      seriesList={video.seriesList || []}
                      standaloneChapters={video.standaloneChapters || []}
                      videoId={video.id}
                    />
                  </div>
                </>
              )}
            </div>
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" />
              总时长 {formatDuration(video.duration)}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="size-4" />
              {video.studentCount} 人学习
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="size-4" />
              {video.viewCount} 次浏览
            </span>
            <button
              type="button"
              onClick={() => requireAuth(toggleFavorite)}
              disabled={favLoading}
              title={favorited ? '取消收藏' : '收藏'}
              className={`ml-auto flex flex-col items-center gap-0.5 transition-colors disabled:opacity-50 ${
                favorited ? 'text-sky-300' : 'text-sky-400 hover:text-sky-300'
              }`}
            >
              <Star
                className={`size-7 ${favorited ? 'fill-current stroke-current' : 'fill-none stroke-current'}`}
                strokeWidth={favorited ? 1 : 1.5}
              />
              <span className="text-xs leading-none text-white/70 tabular-nums">
                {favoriteCount}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
