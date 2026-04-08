'use client';

import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import '@videojs/http-streaming';
import { inferVideoMimeType } from '../../lib/playback-sources';

type VideoJsPlayerProps = {
  src: string;
  poster?: string | null;
  className?: string;
};

/**
 * Video.js 封装（客户端），已注册 VHS 以支持 HLS。
 * <p>换源时请由父组件变更 {@code key}（例如 {@code key={playbackSrc}}），整组件卸载重建，避免 dispose 后复用同一 DOM。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-08 15:30
 */
export function VideoJsPlayer({ src, poster, className }: VideoJsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const player = videojs(el, {
      controls: true,
      responsive: true,
      fluid: true,
      preload: 'metadata',
      poster: poster || undefined,
      sources: [{ src, type: inferVideoMimeType(src) }],
    });

    return () => {
      try {
        player.dispose();
      } catch {
        /* 已释放或非幂等场景忽略 */
      }
    };
    // 仅挂载时初始化；换源依赖父级 key 强制重挂载
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div data-vjs-player className={className}>
      <video
        ref={videoRef}
        className="video-js vjs-big-play-centered vjs-fluid"
        playsInline
      />
    </div>
  );
}
