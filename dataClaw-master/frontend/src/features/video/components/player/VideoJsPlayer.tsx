'use client';

import { useEffect, useRef, useCallback } from 'react';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';
import './video-player.css';
import { inferVideoMimeType } from '../../lib/playback-sources';
import { updateVideoProgress } from '../../api/service';

type VideoJsPlayerProps = {
  src: string;
  poster?: string | null;
  className?: string;
  autoplay?: boolean;
  /** 初始播放位置（秒） */
  initialTime?: number;
  /** 录播课ID（用于上报进度） */
  videoId?: number;
  /** 章节ID（用于上报进度） */
  chapterId?: number;
};

const PROGRESS_REPORT_INTERVAL = 15;

/**
 * Video.js 封装（客户端），v8 已内置 HLS/VHS。
 * <p>采用容器 ref + 动态创建 {@code <video>} 的方式，避免 React Strict Mode
 * 下 dispose 移除 DOM 后二次挂载 ref 失效的问题。</p>
 * <p>换源时请由父组件变更 {@code key}（例如 {@code key={playbackSrc}}），
 * 整组件卸载重建。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-08 15:30
 */
export function VideoJsPlayer({
  src,
  poster,
  className,
  autoplay,
  initialTime,
  videoId,
  chapterId,
}: VideoJsPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<Player | null>(null);
  const lastReportTimeRef = useRef(0);

  const reportProgress = useCallback((currentTime: number, duration: number) => {
    if (!videoId || !chapterId || duration <= 0) return;
    const now = Date.now() / 1000;
    if (now - lastReportTimeRef.current < PROGRESS_REPORT_INTERVAL) return;
    lastReportTimeRef.current = now;
    updateVideoProgress(videoId, {
      chapterId,
      watchDuration: Math.floor(currentTime),
      chapterDuration: Math.floor(duration),
    }).catch(() => {});
  }, [videoId, chapterId]);

  useEffect(() => {
    if (playerRef.current) return;

    const container = containerRef.current;
    if (!container) return;

    const videoEl = document.createElement('video-js');
    videoEl.classList.add('video-js', 'vjs-big-play-centered', 'vjs-fill');
    videoEl.setAttribute('playsinline', '');
    container.appendChild(videoEl);

    const player = videojs(videoEl, {
      controls: true,
      fill: true,
      autoplay: autoplay ?? false,
      preload: 'metadata',
      poster: poster ?? undefined,
      sources: [{ src, type: inferVideoMimeType(src) }],
    });

    // 设置初始播放位置
    if (initialTime && initialTime > 0) {
      player.one('loadedmetadata', () => {
        player.currentTime(initialTime);
      });
    }

    // 进度上报
    player.on('timeupdate', () => {
      const ct = player.currentTime() ?? 0;
      const dur = player.duration() ?? 0;
      reportProgress(ct, dur);
    });

    // 播放结束时强制上报一次
    player.on('ended', () => {
      if (!videoId || !chapterId) return;
      const dur = player.duration() ?? 0;
      if (dur > 0) {
        lastReportTimeRef.current = 0;
        updateVideoProgress(videoId, {
          chapterId,
          watchDuration: Math.floor(dur),
          chapterDuration: Math.floor(dur),
        }).catch(() => {});
      }
    });

    playerRef.current = player;

    return () => {
      // 卸载前上报一次进度
      const p = playerRef.current;
      if (p && !p.isDisposed() && videoId && chapterId) {
        const ct = p.currentTime() ?? 0;
        const dur = p.duration() ?? 0;
        if (ct > 0 && dur > 0) {
          updateVideoProgress(videoId, {
            chapterId,
            watchDuration: Math.floor(ct),
            chapterDuration: Math.floor(dur),
          }).catch(() => {});
        }
        p.dispose();
      } else if (p && !p.isDisposed()) {
        p.dispose();
      }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} data-vjs-player className={className} />;
}
