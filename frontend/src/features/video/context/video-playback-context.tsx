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
import type { VideoDetail, VideoAccessInfo, VideoProgressInfo, VideoChapter } from '../api/types';
import { resolveChapterPlayback, type PlaybackMode } from '../lib/playback-mode';
import { getVideoAccess, getVideoProgress } from '../api/service';
import { useAuth } from '@/lib/auth/auth-context';

type VideoPlaybackContextValue = {
  playbackSrc: string | null;
  playbackMode: PlaybackMode | null;
  /** 切换当前播放地址（如点击章节目录） */
  setPlaybackSrc: (src: string, title?: string) => void;
  /** 选中章节（无片源时仍切换，播放器仅展示封面，对齐老站） */
  selectChapter: (chapter: VideoChapter) => void;
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
  /** 是否为课程发布者 */
  isOwner: boolean;
  /** 权限加载中 */
  accessLoading: boolean;
  /** 学习进度信息 */
  progressInfo: VideoProgressInfo | null;
};

const VideoPlaybackContext = createContext<VideoPlaybackContextValue | null>(null);

function allChapters(video: VideoDetail): VideoChapter[] {
  const fromSeries = (video.seriesList || []).flatMap((s) => s.chapters || []);
  const standalone = video.standaloneChapters || [];
  return [...fromSeries, ...standalone].sort((a, b) => a.sortOrder - b.sortOrder);
}

function findChapterForRawUrl(video: VideoDetail, raw?: string | null): VideoChapter | undefined {
  const target = raw?.trim();
  if (!target) return undefined;
  return allChapters(video).find((ch) => ch.videoUrl?.trim() === target);
}

/** 老站默认选中目录第一节，不论是否有片源 */
function findDefaultChapter(video: VideoDetail): VideoChapter | null {
  const chapters = allChapters(video);
  if (chapters.length > 0) return chapters[0];
  return null;
}

function applyChapter(
  chapter: VideoChapter,
  setPlaybackSrcState: (url: string | null) => void,
  setPlaybackModeState: (mode: PlaybackMode | null) => void,
  setCurrentChapterId: (id: number | null) => void,
  setCurrentTitle: (title: string | null) => void,
) {
  setCurrentChapterId(chapter.id);
  setCurrentTitle(chapter.title);
  const playable = resolveChapterPlayback(chapter.videoUrl);
  if (playable) {
    setPlaybackSrcState(playable.url);
    setPlaybackModeState(playable.mode);
  } else {
    setPlaybackSrcState(null);
    setPlaybackModeState(null);
  }
}

/**
 * 录播课详情页播放状态：顶栏播放器与章节目录共用。
 *
 * @author Fangxinxin
 * @date 2026-04-08 15:30
 */
export function VideoPlaybackProvider({
  video,
  children,
  preferredChapterId,
}: {
  video: VideoDetail;
  children: ReactNode;
  preferredChapterId?: number;
}) {
  const { user } = useAuth();

  const [playbackSrc, setPlaybackSrcState] = useState<string | null>(null);
  const [playbackMode, setPlaybackModeState] = useState<PlaybackMode | null>(null);
  const [currentTitle, setCurrentTitle] = useState<string | null>(null);
  const [currentChapterId, setCurrentChapterId] = useState<number | null>(null);

  const [accessible, setAccessible] = useState(video.isFree === 1);
  const [isFree] = useState(video.isFree === 1);
  const [enrolled, setEnrolled] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [accessLoading, setAccessLoading] = useState(!isFree && !!user);
  const [progressInfo, setProgressInfo] = useState<VideoProgressInfo | null>(null);

  useEffect(() => {
    if (isFree) {
      setAccessible(true);
      setAccessLoading(false);
      const chapters = allChapters(video);
      const chapter =
        (preferredChapterId
          ? chapters.find((c) => c.id === preferredChapterId)
          : null) ?? findDefaultChapter(video);
      if (chapter) {
        applyChapter(
          chapter,
          setPlaybackSrcState,
          setPlaybackModeState,
          setCurrentChapterId,
          setCurrentTitle,
        );
      }
      return;
    }
    if (!user) {
      setAccessible(false);
      setAccessLoading(false);
      return;
    }
    setAccessLoading(true);
    getVideoAccess(video.id)
      .then((info: VideoAccessInfo) => {
        setAccessible(info.accessible);
        setEnrolled(info.enrolled);
        setIsOwner(info.isOwner ?? false);
        if (info.accessible) {
          const defaultChapter = findDefaultChapter(video);
          if (defaultChapter) {
            applyChapter(
              defaultChapter,
              setPlaybackSrcState,
              setPlaybackModeState,
              setCurrentChapterId,
              setCurrentTitle,
            );
          }
        }
      })
      .catch(() => {
        setAccessible(false);
      })
      .finally(() => setAccessLoading(false));
  }, [user, video, isFree]);

  useEffect(() => {
    if (!user || !accessible) return;

    let cancelled = false;

    const pickChapter = (progress: VideoProgressInfo | null) => {
      const chapters = allChapters(video);
      if (preferredChapterId) {
        const preferred = chapters.find((c) => c.id === preferredChapterId);
        if (preferred) return preferred;
      }
      if (progress?.lastChapterId && progress.lastChapterId > 0) {
        const last = chapters.find((c) => c.id === progress.lastChapterId);
        if (last) return last;
      }
      return findDefaultChapter(video);
    };

    getVideoProgress(video.id)
      .then((info) => {
        if (cancelled) return;
        setProgressInfo(info);
        const chapter = pickChapter(info);
        if (chapter) {
          applyChapter(
            chapter,
            setPlaybackSrcState,
            setPlaybackModeState,
            setCurrentChapterId,
            setCurrentTitle,
          );
        }
      })
      .catch(() => {
        if (cancelled) return;
        const chapter = pickChapter(null);
        if (chapter) {
          applyChapter(
            chapter,
            setPlaybackSrcState,
            setPlaybackModeState,
            setCurrentChapterId,
            setCurrentTitle,
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, accessible, video, preferredChapterId]);

  const selectChapter = useCallback((chapter: VideoChapter) => {
    applyChapter(
      chapter,
      setPlaybackSrcState,
      setPlaybackModeState,
      setCurrentChapterId,
      setCurrentTitle,
    );
  }, []);

  const setPlaybackSrc = useCallback((raw: string, title?: string) => {
    const chapter = findChapterForRawUrl(video, raw);
    if (chapter) {
      selectChapter(chapter);
      return;
    }
    const playable = resolveChapterPlayback(raw);
    if (!playable) return;
    setPlaybackSrcState(playable.url);
    setPlaybackModeState(playable.mode);
    setCurrentTitle(title ?? null);
  }, [selectChapter, video]);

  const value = useMemo(
    () => ({
      playbackSrc,
      playbackMode,
      setPlaybackSrc,
      selectChapter,
      currentTitle,
      currentChapterId,
      setCurrentChapterId,
      accessible,
      isFree,
      enrolled,
      isOwner,
      accessLoading,
      progressInfo,
    }),
    [
      playbackSrc,
      playbackMode,
      setPlaybackSrc,
      selectChapter,
      currentTitle,
      currentChapterId,
      accessible,
      isFree,
      enrolled,
      isOwner,
      accessLoading,
      progressInfo,
    ],
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
