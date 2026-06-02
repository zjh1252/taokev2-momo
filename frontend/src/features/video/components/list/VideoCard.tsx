import { Link } from '@/i18n/navigation';
import { Play, Users, Eye } from 'lucide-react';
import { SafeImage } from '@/components/safe-image';
import { DEFAULT_COURSE_COVER } from '@/lib/media';
import type { VideoListItem } from '../../api/types';

interface VideoCardProps {
  video: VideoListItem;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}小时${m > 0 ? `${m}分` : ''}`;
  return `${m}分钟`;
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <Link
      href={`/videos/${video.id}`}
      className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group flex flex-col"
    >
      {/* 封面 */}
      <div className="relative aspect-video bg-slate-100">
        {video.coverUrl ? (
          <SafeImage
            src={video.coverUrl}
            alt={video.title}
            fill
            className="object-cover"
            fallback={DEFAULT_COURSE_COVER}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="size-10 text-slate-300" />
          </div>
        )}
        {/* 集数角标 */}
        {video.totalEpisodes > 0 && (
          <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded">
            {video.totalEpisodes} 集
          </span>
        )}
        {/* 免费角标 */}
        {video.isFree === 1 && (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-[11px] px-2 py-0.5 rounded">
            免费
          </span>
        )}
      </div>

      {/* 信息区 */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <h3 className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
          {video.title}
        </h3>

        {video.teacherName && (
          <p className="text-xs text-slate-500 truncate">讲师：{video.teacherName}</p>
        )}

        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-0.5">
              <Eye className="size-3" />
              {video.viewCount}
            </span>
            <span className="flex items-center gap-0.5">
              <Users className="size-3" />
              {video.studentCount}
            </span>
          </div>
          {video.isFree === 1 ? (
            <span className="text-sm font-bold text-green-600">免费</span>
          ) : video.price > 0 ? (
            <span className="text-sm font-bold text-primary">¥{video.price}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
