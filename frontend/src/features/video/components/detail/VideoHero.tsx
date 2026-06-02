'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Play, Clock, Users, Eye, Lock, List } from 'lucide-react';
import { SafeImage } from '@/components/safe-image';
import { DEFAULT_COURSE_COVER } from '@/lib/media';
import type { VideoDetail } from '../../api/types';
import { useVideoPlayback } from '../../context/video-playback-context';
import { VideoChapterList } from './VideoChapterList';

const VideoJsPlayer = dynamic(
  () =>
    import('../player/VideoJsPlayer').then((m) => ({
      default: m.VideoJsPlayer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-video w-full bg-slate-950 animate-pulse rounded-lg min-h-[200px]" />
    ),
  },
);

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

export function VideoHero({ video }: VideoHeroProps) {
  const { playbackSrc, currentTitle, accessible, progressInfo, currentChapterId } = useVideoPlayback();
  const [showChapterPopover, setShowChapterPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // 当前章节的初始进度（百分比 -> 秒）
  const initialTime = (() => {
    if (!progressInfo || !currentChapterId) return undefined;
    const cp = progressInfo.chapters.find((c) => c.chapterId === currentChapterId);
    if (cp && cp.progress > 0 && cp.progress < 100 && cp.chapterDuration > 0) {
      return Math.floor(cp.chapterDuration * cp.progress / 100);
    }
    return undefined;
  })();

  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl overflow-hidden">
      <div className="flex flex-col md:flex-row gap-6 p-6">
        {/* 播放器 / 封面 */}
        <div className="relative w-full md:w-[min(100%,480px)] aspect-video rounded-lg overflow-hidden bg-slate-950 shrink-0">
          {playbackSrc && accessible ? (
            <VideoJsPlayer
              key={playbackSrc}
              src={playbackSrc}
              poster={video.coverUrl || undefined}
              className="w-full h-full"
              autoplay
              initialTime={initialTime}
              videoId={video.id}
              chapterId={currentChapterId ?? undefined}
            />
          ) : (
            <>
              {video.coverUrl ? (
                <SafeImage
                  src={video.coverUrl}
                  alt={video.title}
                  fill
                  className="object-cover"
                  fallback={DEFAULT_COURSE_COVER}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {accessible ? (
                    <Play className="size-16 text-slate-500" />
                  ) : (
                    <Lock className="size-16 text-slate-400" />
                  )}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
                <div className="text-center">
                  {!accessible ? (
                    <div className="flex flex-col items-center gap-2">
                      <Lock className="size-12 text-white/80" />
                      <p className="text-sm text-white/90 px-4">
                        购买后即可解锁观看
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-white/90 px-4">
                      暂无可播放视频地址，请在后台为课程或章节配置视频 URL
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 信息 */}
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
            {currentTitle && (
              <p className="text-sm text-emerald-200/90 mb-2 line-clamp-2">
                正在播放：{currentTitle}
              </p>
            )}
            {video.teacherName && (
              <p className="text-sm text-white/70 mb-2">授课老师：{video.teacherName}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-white/60">
            {/* 集数 — 可点击展开课程目录 */}
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
          </div>
        </div>
      </div>
    </div>
  );
}
