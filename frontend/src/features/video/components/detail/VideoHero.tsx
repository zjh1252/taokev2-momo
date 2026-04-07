import Image from 'next/image';
import { Play, Clock, Users, Eye } from 'lucide-react';
import type { VideoDetail } from '../../api/types';

interface VideoHeroProps {
  video: VideoDetail;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}小时${m > 0 ? `${m}分钟` : ''}`;
  return `${m}分钟`;
}

export function VideoHero({ video }: VideoHeroProps) {
  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl overflow-hidden">
      <div className="flex flex-col md:flex-row gap-6 p-6">
        {/* 封面 */}
        <div className="relative w-full md:w-[400px] aspect-video rounded-lg overflow-hidden bg-slate-700 shrink-0">
          {video.coverUrl ? (
            <Image
              src={video.coverUrl}
              alt={video.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="size-16 text-slate-500" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <Play className="size-7 text-white fill-white ml-1" />
            </div>
          </div>
        </div>

        {/* 信息 */}
        <div className="flex-1 flex flex-col justify-between text-white">
          <div>
            <div className="flex items-center gap-2 mb-3">
              {video.isFree === 1 && (
                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded">免费</span>
              )}
              {video.videoTypeLabel && (
                <span className="bg-white/10 text-white/80 text-xs px-2 py-0.5 rounded">
                  {video.videoTypeLabel}
                </span>
              )}
              {video.categoryName && (
                <span className="bg-white/10 text-white/80 text-xs px-2 py-0.5 rounded">
                  {video.categoryName}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold mb-3">{video.title}</h1>
            {video.teacherName && (
              <p className="text-sm text-white/70 mb-2">授课老师：{video.teacherName}</p>
            )}
          </div>

          <div className="flex items-center gap-6 text-sm text-white/60">
            <span className="flex items-center gap-1.5">
              <Play className="size-4" />
              共 {video.totalEpisodes} 集
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" />
              总时长 {formatDuration(video.duration)}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="size-4" />
              {video.studentCount} 人学习
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="size-4" />
              {video.viewCount} 次浏览
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
