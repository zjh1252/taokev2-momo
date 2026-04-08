'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { VideoDetail, VideoAccessInfo, VideoProgressInfo } from '../api/types';
import { getFirstPlayableSource } from '../lib/playback-sources';
import { getVideoAccess, getVideoProgress } from '../api/service';
import { useAuth } from '@/lib/auth/auth-context';

type VideoPlaybackContextValue = {
  playbackSrc: string | null;
  /** 切换当前播放地址（如点击章节目录） */
  setPlaybackSrc: (src: string, title?: string) => void;
  /** 当前播放章节标题（可选） */
  currentTitle: string | null;
  /** 当前播放章节ID */
  currentChapterId: number | null;
  setCurrentChapterId: (id: number | null) => void;
  /** 是否有权播放（免费或已购买） */
  accessible: boolean;
  /** 是否免费课程 */
  isFree: boolean;
  /** 是否已购买 */
  enrolled: boolean;
  /** 权限加载中 */
  accessLoading: boolean;
  /** 学习进度信息 */
  progressInfo: VideoProgressInfo | null;
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
  const { user } = useAuth();

  const [playbackSrc, setPlaybackSrcState] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState<string | null>(null);
  const [currentChapterId, setCurrentChapterId] = useState<number | null>(null);

  // 访问权限
  const [accessible, setAccessible] = useState(video.isFree === 1);
  const [isFree] = useState(video.isFree === 1);
  const [enrolled, setEnrolled] = useState(false);
  const [accessLoading, setAccessLoading] = useState(!isFree && !!user);
  const [progressInfo, setProgressInfo] = useState<VideoProgressInfo | null>(null);

  useEffect(() => {
    if (isFree) {
      setAccessible(true);
      setAccessLoading(false);
      // 免费课直接加载首个播放源
      const src = getFirstPlayableSource(video);
      if (src) setPlaybackSrcState(src);
      return;
    }
    if (!user) {
      setAccessible(false);
      setAccessLoading(false);
      return;
    }
    // 检查权限
    setAccessLoading(true);
    getVideoAccess(video.id)
      .then((info: VideoAccessInfo) => {
        setAccessible(info.accessible);
        setEnrolled(info.enrolled);
        if (info.accessible) {
          const src = getFirstPlayableSource(video);
          if (src) setPlaybackSrcState(src);
        }
      })
      .catch(() => {
        setAccessible(false);
      })
      .finally(() => setAccessLoading(false));
  }, [user, video, isFree]);

  // 获取学习进度
  useEffect(() => {
    if (!user || !accessible) return;
    getVideoProgress(video.id)
      .then((info) => {
        setProgressInfo(info);
        // 恢复到上次观看的章节
        if (info.lastChapterId && info.lastChapterId > 0) {
          const allChapters = [
            ...(video.standaloneChapters || []),
            ...(video.seriesList || []).flatMap((s) => s.chapters || []),
          ];
          const lastChapter = allChapters.find((c) => c.id === info.lastChapterId);
          if (lastChapter?.videoUrl) {
            setPlaybackSrcState(lastChapter.videoUrl);
            setCurrentTitle(lastChapter.title);
            setCurrentChapterId(lastChapter.id);
          }
        }
      })
      .catch(() => {});
  }, [user, accessible, video]);

  const setPlaybackSrc = useCallback((src: string, title?: string) => {
    setPlaybackSrcState(src);
    setCurrentTitle(title ?? null);
  }, []);

  const value = useMemo(
    () => ({
      playbackSrc,
      setPlaybackSrc,
      currentTitle,
      currentChapterId,
      setCurrentChapterId,
      accessible,
      isFree,
      enrolled,
      accessLoading,
      progressInfo,
    }),
    [playbackSrc, setPlaybackSrc, currentTitle, currentChapterId, accessible, isFree, enrolled, accessLoading, progressInfo],
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
