'use client';

import dynamic from 'next/dynamic';
import type { PlaybackMode } from '../../lib/playback-mode';
import { VideoEmbedPlayer } from './VideoEmbedPlayer';

const VideoJsPlayer = dynamic(
  () =>
    import('./VideoJsPlayer').then((m) => ({
      default: m.VideoJsPlayer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-video h-full w-full min-h-[200px] animate-pulse rounded-lg bg-slate-950" />
    ),
  },
);

type VideoPlayerShellProps = {
  mode: PlaybackMode;
  src: string;
  poster?: string | null;
  className?: string;
  autoplay?: boolean;
  initialTime?: number;
  videoId?: number;
  chapterId?: number;
  title?: string | null;
};

/**
 * 按播放模式分发：直链 mp4/HLS → Video.js；第三方页面 → iframe。
 */
export function VideoPlayerShell({
  mode,
  src,
  poster,
  className,
  autoplay,
  initialTime,
  videoId,
  chapterId,
  title,
}: VideoPlayerShellProps) {
  if (mode === 'embed') {
    return (
      <VideoEmbedPlayer
        key={`${src}-${chapterId ?? ''}`}
        src={src}
        title={title}
        poster={poster}
        autoplay={autoplay}
        initialTime={initialTime}
        className={className ?? 'h-full w-full'}
        videoId={videoId}
        chapterId={chapterId}
      />
    );
  }

  return (
    <VideoJsPlayer
      key={src}
      src={src}
      poster={poster}
      className={className}
      autoplay={autoplay}
      initialTime={initialTime}
      videoId={videoId}
      chapterId={chapterId}
    />
  );
}
