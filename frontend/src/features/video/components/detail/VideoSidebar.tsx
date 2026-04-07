import { ShoppingCart, Zap, User } from 'lucide-react';
import type { VideoDetail } from '../../api/types';

interface VideoSidebarProps {
  video: VideoDetail;
}

export function VideoSidebar({ video }: VideoSidebarProps) {
  return (
    <div className="space-y-4">
      {/* 价格卡片 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-4">
          {video.isFree === 1 ? (
            <div className="text-3xl font-bold text-green-600">免费</div>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">¥{video.price}</span>
              {video.originalPrice > 0 && video.originalPrice > video.price && (
                <span className="text-sm text-slate-400 line-through">¥{video.originalPrice}</span>
              )}
              <span className="text-xs text-slate-400">元/人/年</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            type="button"
            className="w-full bg-primary text-white font-medium py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Zap className="size-4" />
            立即购买
          </button>
          <button
            type="button"
            className="w-full border border-primary text-primary font-medium py-3 rounded-lg hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCart className="size-4" />
            加入购物车
          </button>
        </div>
      </div>

      {/* 讲师信息 */}
      {video.teacherName && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 mb-3">授课老师</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <User className="size-6 text-slate-400" />
            </div>
            <div>
              <p className="font-medium text-slate-800">{video.teacherName}</p>
              {video.trainerName && video.trainerName !== video.teacherName && (
                <p className="text-xs text-slate-500">{video.trainerName}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 课程信息 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-3">课程信息</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">课程类型</span>
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
            <span className="text-slate-500">报名人数</span>
            <span className="text-slate-700">{video.enrollmentCount} 人</span>
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
