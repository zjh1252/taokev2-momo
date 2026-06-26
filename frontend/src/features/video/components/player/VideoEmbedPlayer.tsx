'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import {
  getThirdPartyWatchLabel,
  isSignedChapterPlayback,
  isThirdPartyEmbedHost,
  resolveEmbedPlaybackUrl,
  resolveThirdPartyWatchUrl,
} from '../../lib/playback-mode';
import { getChapterPlaybackUrl } from '../../api/service';
import { resolveVideoPlaybackSrc } from '@/lib/media';
import { ThirdPartyWatchPanel } from './ThirdPartyWatchPanel';

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
  /** EXTERNAL 类型课程的原外链，用于补全站外观看地址 */
  externalUrl?: string | null;
};

function needsBackendSign(src: string): boolean {
  return isSignedChapterPlayback(src);
}

function resolveWatchUrl(src: string, externalUrl?: string | null): string | null {
  const sources = [src, externalUrl ?? ''].filter((s) => s?.trim());
  for (const raw of sources) {
    const url = resolveThirdPartyWatchUrl(raw);
    if (url) return url;
  }
  const embed = resolveEmbedPlaybackUrl(src) ?? src;
  if (isThirdPartyEmbedHost(embed) && /^https?:\/\//i.test(embed)) {
    return embed.replace(/^http:/i, 'https:');
  }
  return null;
}

/**
 * 第三方平台录播（优酷 / 土豆 / B 站 / 中欧 eceibs / 思酷 scho 等）。
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
  externalUrl,
}: VideoEmbedPlayerProps) {
  const needsSign = useMemo(() => needsBackendSign(src), [src]);
  const staticEmbed = useMemo(() => resolveEmbedPlaybackUrl(src), [src]);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [signedMode, setSignedMode] = useState<'embed' | 'direct'>('embed');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!needsSign) {
      setSignedUrl(null);
      setSignedMode('embed');
      setError(null);
      setLoading(false);
      return;
    }
    if (!videoId || !chapterId) {
      setError('缺少章节信息，无法签发播放地址');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getChapterPlaybackUrl(videoId, chapterId)
      .then((res) => {
        if (cancelled) return;
        setSignedUrl(resolveVideoPlaybackSrc(res.embedUrl) ?? res.embedUrl);
        setSignedMode(res.playbackMode === 'direct' ? 'direct' : 'embed');
      })
      .catch(() => {
        if (!cancelled) setError('播放地址获取失败，请确认已登录并拥有观看权限');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [needsSign, videoId, chapterId, src]);

  const playbackUrl = needsSign ? signedUrl : (staticEmbed ?? src);
  const watchUrl = useMemo(
    () => (playbackUrl ? resolveWatchUrl(playbackUrl, externalUrl) : null),
    [playbackUrl, externalUrl],
  );
  const watchLabel = getThirdPartyWatchLabel(playbackUrl ?? src);
  const useThirdPartyPanel =
    !needsSign && playbackUrl != null && isThirdPartyEmbedHost(playbackUrl) && watchUrl != null;

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

  if (needsSign && error) {
    return (
      <div
        className={
          className ??
          'flex h-full min-h-[200px] w-full items-center justify-center bg-black px-6 text-center text-sm text-white/80'
        }
      >
        {error}
      </div>
    );
  }

  if (!playbackUrl) return null;

  if (useThirdPartyPanel && watchUrl) {
    return (
      <ThirdPartyWatchPanel
        watchUrl={watchUrl}
        watchLabel={watchLabel}
        title={title}
        poster={poster}
        className={className}
      />
    );
  }

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
