'use client';

import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';
import './video-player.css';
import { inferVideoMimeType } from '../../lib/playback-sources';

type VideoJsPlayerProps = {
  src: string;
  poster?: string | null;
  className?: string;
};

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
export function VideoJsPlayer({ src, poster, className }: VideoJsPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<Player | null>(null);

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
      preload: 'metadata',
      poster: poster ?? undefined,
      sources: [{ src, type: inferVideoMimeType(src) }],
    });

    playerRef.current = player;

    return () => {
      const p = playerRef.current;
      if (p && !p.isDisposed()) {
        p.dispose();
      }
      playerRef.current = null;
    };
    // 仅挂载时初始化；换源依赖父级 key 强制重挂载
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} data-vjs-player className={className} />;
}
