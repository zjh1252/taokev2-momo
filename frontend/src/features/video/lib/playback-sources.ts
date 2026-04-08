import type { VideoDetail } from '../api/types';

/**
 * 从录播课详情中解析首个可播放地址（主视频 URL → 独立章节 → 系列内章节）
 */
export function getFirstPlayableSource(video: VideoDetail): string | null {
  const pick = (s?: string | null) => {
    const t = s?.trim();
    return t && t.length > 0 ? t : null;
  };
  if (pick(video.videoUrl)) return pick(video.videoUrl)!;
  for (const ch of video.standaloneChapters || []) {
    if (pick(ch.videoUrl)) return pick(ch.videoUrl)!;
  }
  for (const s of video.seriesList || []) {
    for (const ch of s.chapters || []) {
      if (pick(ch.videoUrl)) return pick(ch.videoUrl)!;
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
