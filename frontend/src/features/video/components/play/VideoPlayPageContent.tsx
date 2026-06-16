'use client';

import { useMemo } from 'react';
import { BookOpen, Eye, Lock, Share2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { SafeImage } from '@/components/safe-image';
import { resolveImageSrc, DEFAULT_VIDEO_COVER } from '@/lib/media';
import type { VideoDetail, VideoChapter } from '../../api/types';
import { useVideoPlayback } from '../../context/video-playback-context';
import { VideoPlayerShell } from '../player/VideoPlayerShell';
import { VideoPlayRatingCard } from './VideoPlayRatingCard';

type VideoPlayPageContentProps = {
  video: VideoDetail;
};

function allChapters(video: VideoDetail): VideoChapter[] {
  const fromSeries = (video.seriesList || []).flatMap((s) => s.chapters || []);
  const standalone = video.standaloneChapters || [];
  return [...fromSeries, ...standalone].sort((a, b) => a.sortOrder - b.sortOrder);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function VideoPlayPageContent({ video }: VideoPlayPageContentProps) {
  const {
    playbackSrc,
    playbackMode,
    currentTitle,
    currentChapterId,
    accessible,
    accessLoading,
    progressInfo,
  } = useVideoPlayback();

  const currentChapter = useMemo(() => {
    if (!currentChapterId) return null;
    return allChapters(video).find((c) => c.id === currentChapterId) ?? null;
  }, [video, currentChapterId]);

  const sectionIntro = useMemo(() => {
    const chapterDesc = currentChapter?.description?.trim();
    if (chapterDesc) return stripHtml(chapterDesc);
    const intro = video.intro?.trim();
    if (intro) return stripHtml(intro);
    return '暂无本节介绍';
  }, [currentChapter, video.intro]);

  const initialTime = useMemo(() => {
    if (!progressInfo || !currentChapterId) return undefined;
    const cp = progressInfo.chapters.find((c) => c.chapterId === currentChapterId);
    if (cp && cp.progress > 0 && cp.progress < 100 && cp.chapterDuration > 0) {
      return Math.floor((cp.chapterDuration * cp.progress) / 100);
    }
    if (cp?.watchDuration && cp.watchDuration > 0 && cp.chapterDuration > 0) {
      if (cp.watchDuration < cp.chapterDuration) return cp.watchDuration;
    }
    return undefined;
  }, [progressInfo, currentChapterId]);

  const categoryTags = useMemo(() => {
    const tags: { label: string; href?: string }[] = [];
    if (video.categoryName) {
      tags.push({
        label: video.categoryName,
        href: `${ROUTES.ONLINE_COURSES}?categoryId=${video.categoryId}`,
      });
    }
    if (video.subCategoryName && video.subCategoryId) {
      tags.push({
        label: video.subCategoryName,
        href: `${ROUTES.ONLINE_COURSES}?categoryId=${video.categoryId}&subCategoryId=${video.subCategoryId}`,
      });
    }
    if (video.keywords) {
      video.keywords
        .split(/[,，、\s]+/)
        .filter(Boolean)
        .slice(0, 4)
        .forEach((kw) => tags.push({ label: kw }));
    }
    return tags;
  }, [video]);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: video.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success('链接已复制，快去分享吧');
    } catch {
      toast.error('分享失败，请手动复制地址栏链接');
    }
  };

  const poster = resolveImageSrc(video.coverUrl, '') || undefined;
  const showPlayer =
    accessible &&
    playbackSrc &&
    playbackMode &&
    playbackMode !== 'unsupported';

  return (
    <div className="flex flex-col gap-8">
      {/* 播放器 + 评价卡片 */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-stretch">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-br from-slate-900/20 via-primary/10 to-slate-900/20 rounded-[1.25rem] blur-sm opacity-70 group-hover:opacity-90 transition-opacity" />
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#0f1419] shadow-2xl ring-1 ring-black/10">
            {accessLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="size-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              </div>
            ) : showPlayer ? (
              <VideoPlayerShell
                key={`${playbackSrc}-${currentChapterId ?? ''}-${initialTime ?? 0}`}
                mode={playbackMode}
                src={playbackSrc}
                title={currentTitle}
                poster={poster}
                className="h-full w-full video-play-skin"
                autoplay
                initialTime={initialTime}
                videoId={video.id}
                chapterId={currentChapterId ?? undefined}
                externalUrl={video.externalUrl}
              />
            ) : (
              <>
                <SafeImage
                  src={video.coverUrl || undefined}
                  alt={video.title}
                  fill
                  className="object-cover opacity-80"
                  fallback={DEFAULT_VIDEO_COVER}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                  <Lock className="size-14 text-white/90" />
                  <p className="text-white text-lg font-medium">
                    {accessible ? '暂无可播放片源' : '购买后即可解锁观看'}
                  </p>
                  {!accessible && (
                    <Link
                      href={`${ROUTES.VIDEOS}/${video.id}`}
                      className="mt-2 px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg"
                    >
                      前往购买
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
          {currentTitle && showPlayer ? (
            <p className="mt-3 text-sm text-slate-600 pl-1">
              正在播放：
              <span className="text-slate-900 font-medium">{currentTitle}</span>
            </p>
          ) : null}
        </div>

        <div className="hidden xl:block min-h-[280px]">
          <VideoPlayRatingCard video={video} />
        </div>
      </div>

      {/* 移动端评价卡片 */}
      <div className="xl:hidden">
        <VideoPlayRatingCard video={video} />
      </div>

      {/* 操作栏：本节介绍 / 分享 / 播放量 */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-200/80">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <span className="inline-flex items-center gap-2 text-slate-700 font-medium">
            <BookOpen className="size-4 text-primary" />
            本节介绍
          </span>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-primary transition-colors"
          >
            <Share2 className="size-4" />
            分享
          </button>
        </div>
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
          <Eye className="size-4" />
          {video.viewCount.toLocaleString()} 次播放
        </span>
      </div>

      {/* 本节介绍正文 */}
      <section className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6 md:p-8">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-primary" />
          本节介绍
        </h3>
        <p className="text-sm md:text-[15px] text-slate-600 leading-7 whitespace-pre-wrap">
          {sectionIntro}
        </p>
      </section>

      {/* 视频分类 */}
      {categoryTags.length > 0 ? (
        <section className="rounded-2xl bg-gradient-to-r from-slate-50 to-white border border-slate-200/80 p-6 md:p-8">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Tag className="size-4 text-primary" />
            视频分类
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {categoryTags.map((tag) =>
              tag.href ? (
                <Link
                  key={tag.label}
                  href={tag.href}
                  className="px-4 py-2 rounded-full text-sm bg-white border border-slate-200 text-slate-700 hover:border-primary hover:text-primary hover:shadow-sm transition-all"
                >
                  {tag.label}
                </Link>
              ) : (
                <span
                  key={tag.label}
                  className="px-4 py-2 rounded-full text-sm bg-white border border-slate-200 text-slate-600"
                >
                  {tag.label}
                </span>
              ),
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
