'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import {
  isSignedChapterPlayback,
  resolveEmbedPlaybackUrl,
} from '../../lib/playback-mode';
import { getChapterPlaybackUrl } from '../../api/service';
import { resolveVideoPlaybackSrc } from '@/lib/media';

const VideoJsPlayer = dynamic(
  () =>
    import('./VideoJsPlayer').then((m) => ({
      default: m.VideoJsPlayer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[200px] w-full animate-pulse items-center justify-center bg-black text-sm text-white/70">
        正在加载播放器…
      </div>
    ),
  },
);

type VideoEmbedPlayerProps = {
  src: string;
  title?: string | null;
  className?: string;
  poster?: string | null;
  autoplay?: boolean;
  initialTime?: number;
  videoId?: number;
  chapterId?: number;
};

function needsBackendSign(src: string): boolean {
  return isSignedChapterPlayback(src);
}

/**
 * 第三方平台录播（优酷 / 土豆 / B 站 / 中欧 eceibs / 思酷 scho 等）。
 * 对齐老站：embed 类型优先在本站 iframe 内播放，不默认跳转原站。
 *
 * @author Fangxinxin
 * @date 2026-06-10 18:00
 */
export function VideoEmbedPlayer({
  src,
  title,
  className,
  poster,
  autoplay,
  initialTime,
  videoId,
  chapterId,
}: VideoEmbedPlayerProps) {
  const needsSign = useMemo(() => needsBackendSign(src), [src]);
  const staticEmbed = useMemo(() => resolveEmbedPlaybackUrl(src), [src]);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [signedMode, setSignedMode] = useState<'embed' | 'direct'>('embed');
  const [error, setError] = useState<string | null>(null);
  const missingSignContext = needsSign && (!videoId || !chapterId);
  const loading = needsSign && !missingSignContext && !signedUrl && !error;

  useEffect(() => {
    if (!needsSign) {
      return;
    }
    if (!videoId || !chapterId) {
      return;
    }

    let cancelled = false;

    getChapterPlaybackUrl(videoId, chapterId)
      .then((res) => {
        if (cancelled) return;
        setSignedUrl(resolveVideoPlaybackSrc(res.embedUrl) ?? res.embedUrl);
        setSignedMode(res.playbackMode === 'direct' ? 'direct' : 'embed');
      })
      .catch(() => {
        if (!cancelled) setError('播放地址获取失败，请确认已登录并拥有观看权限');
      });

    return () => {
      cancelled = true;
    };
  }, [needsSign, videoId, chapterId, src]);

  const playbackUrl = needsSign ? signedUrl : (staticEmbed ?? src);

  if (needsSign && loading) {
    return (
      <div
        className={
          className ??
          'flex h-full min-h-[200px] w-full items-center justify-center bg-black text-sm text-white/70'
        }
      >
        正在加载播放器…
      </div>
    );
  }

  if (missingSignContext || (needsSign && error)) {
    return (
      <div
        className={
          className ??
          'flex h-full min-h-[200px] w-full items-center justify-center bg-black px-6 text-center text-sm text-white/80'
        }
      >
        {missingSignContext ? '缺少章节信息，无法签发播放地址' : error}
      </div>
    );
  }

  if (!playbackUrl) return null;

  if (needsSign && signedMode === 'direct') {
    return (
      <VideoJsPlayer
        key={playbackUrl}
        src={playbackUrl}
        poster={poster ?? undefined}
        className={className}
        autoplay={autoplay}
        initialTime={initialTime}
        videoId={videoId}
        chapterId={chapterId}
      />
    );
  }

  return (
    <iframe
      src={playbackUrl}
      title={title ?? '视频播放'}
      className={className ?? 'h-full w-full border-0 bg-black'}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      referrerPolicy="origin"
    />
  );
}
