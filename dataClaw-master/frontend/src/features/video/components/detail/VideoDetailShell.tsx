'use client';

import type { ReactNode } from 'react';
import type { VideoDetail } from '../../api/types';
import { VideoPlaybackProvider } from '../../context/video-playback-context';

type VideoDetailShellProps = {
  video: VideoDetail;
  children: ReactNode;
};

/**
 * 录播课详情页客户端壳：提供播放上下文，子组件（Hero、目录）共享当前播放地址。
 *
 * @author Fangxinxin
 * @date 2026-04-08 15:30
 */
export function VideoDetailShell({ video, children }: VideoDetailShellProps) {
  return <VideoPlaybackProvider video={video}>{children}</VideoPlaybackProvider>;
}
