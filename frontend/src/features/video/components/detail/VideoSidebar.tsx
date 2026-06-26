'use client';

import type { VideoDetail } from '../../api/types';
import { VideoPurchaseSection } from './VideoPurchaseSection';
import { VideoTeacherCard } from './VideoTeacherCard';

interface VideoSidebarProps {
  video: VideoDetail;
}

export function VideoSidebar({ video }: VideoSidebarProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <VideoPurchaseSection video={video} />
      </div>

      <VideoTeacherCard video={video} />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-3">视频信息</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">视频类型</span>
            <span className="text-slate-700">{video.videoTypeLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">章节数量</span>
            <span className="text-slate-700">{video.totalEpisodes} 集</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">学习人数</span>
            <span className="text-slate-700">{video.studentCount} 人</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">浏览量</span>
            <span className="text-slate-700">{video.viewCount} 次</span>
          </div>
          {video.keywords && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-slate-500">关键词：</span>
              <span className="text-slate-600">{video.keywords}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
