'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { VideoDetail } from '../api/types';
import { getFirstPlayableSource } from '../lib/playback-sources';

type VideoPlaybackContextValue = {
  playbackSrc: string | null;
  /** 切换当前播放地址（如点击章节目录） */
  setPlaybackSrc: (src: string, title?: string) => void;
  /** 当前播放章节标题（可选） */
  currentTitle: string | null;
};

const VideoPlaybackContext = createContext<VideoPlaybackContextValue | null>(null);

/**
 * 录播课详情页播放状态：顶栏播放器与章节目录共用。
 *
 * @author Fangxinxin
 * @date 2026-04-08 15:30
 */
export function VideoPlaybackProvider({
  video,
  children,
}: {
  video: VideoDetail;
  children: ReactNode;
}) {
  const [playbackSrc, setPlaybackSrcState] = useState<string | null>(() =>
    getFirstPlayableSource(video),
  );
  const [currentTitle, setCurrentTitle] = useState<string | null>(null);

  const setPlaybackSrc = useCallback((src: string, title?: string) => {
    setPlaybackSrcState(src);
    setCurrentTitle(title ?? null);
  }, []);

  const value = useMemo(
    () => ({ playbackSrc, setPlaybackSrc, currentTitle }),
    [playbackSrc, setPlaybackSrc, currentTitle],
  );

  return (
    <VideoPlaybackContext.Provider value={value}>
      {children}
    </VideoPlaybackContext.Provider>
  );
}

export function useVideoPlayback(): VideoPlaybackContextValue {
  const ctx = useContext(VideoPlaybackContext);
  if (!ctx) {
    throw new Error('useVideoPlayback 必须在 VideoPlaybackProvider 内使用');
  }
  return ctx;
}
