import type { VideoDetail } from '../api/types';
import { resolveChapterPlayback } from './playback-mode';

export type PlayableSource = {
  url: string;
  mode: 'direct' | 'embed';
};

/**
 * 从录播课详情中解析首个可播放地址（主视频 URL → 独立章节 → 系列内章节）
 */
export function getFirstPlayableSource(video: VideoDetail): PlayableSource | null {
  const candidates = [
    video.videoUrl,
    ...(video.standaloneChapters || []).map((ch) => ch.videoUrl),
    ...(video.seriesList || []).flatMap((s) =>
      (s.chapters || []).map((ch) => ch.videoUrl),
    ),
  ];

  for (const raw of candidates) {
    const playable = resolveChapterPlayback(raw);
    if (playable) {
      return { url: playable.url, mode: playable.mode };
    }
  }
  return null;
}
/**
 * 根据 URL 推断 Video.js source type（支持 HLS / DASH / MP4 等）
 */
export function inferVideoMimeType(url: string): string {
  const path = url.toLowerCase().split('?')[0];
  if (path.includes('.m3u8')) return 'application/x-mpegURL';
  if (path.includes('.mpd')) return 'application/dash+xml';
  return 'video/mp4';
}
