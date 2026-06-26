'use client';

import { User } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { SafeImage } from '@/components/safe-image';
import { resolveImageSrc } from '@/lib/media';
import { getTrainerDetailTabHref } from '@/features/trainer/utils/routes';
import type { VideoDetail } from '../../api/types';

interface VideoTeacherCardProps {
  video: VideoDetail;
}

/** 授课老师名片：平台内专家可点击头像跳转专家主页 */
export function VideoTeacherCard({ video }: VideoTeacherCardProps) {
  const displayName = video.teacherName || video.trainerName;
  if (!displayName) return null;

  const canLink = video.trainerId > 0;
  const trainerHref = canLink ? getTrainerDetailTabHref(video.trainerId) : null;

  const avatarNode = (
    <div
      className={`w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 ${
        canLink ? 'ring-1 ring-slate-200 hover:ring-primary transition-shadow' : ''
      }`}
    >
      {video.trainerAvatar ? (
        <SafeImage
          src={resolveImageSrc(video.trainerAvatar)}
          alt={displayName}
          width={48}
          height={48}
          className="w-full h-full object-cover"
        />
      ) : (
        <User className="size-6 text-slate-400" />
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="font-bold text-slate-800 mb-3">授课老师</h3>
      <div className="flex items-center gap-3">
        {canLink && trainerHref ? (
          <Link href={trainerHref} title={`查看${displayName}的专家主页`} className="shrink-0">
            {avatarNode}
          </Link>
        ) : (
          avatarNode
        )}
        <div className="min-w-0">
          <p className="font-medium text-slate-800 truncate">{displayName}</p>
          {video.trainerName && video.trainerName !== displayName ? (
            <p className="text-xs text-slate-500 truncate">{video.trainerName}</p>
          ) : null}
          {canLink && trainerHref ? (
            <Link
              href={trainerHref}
              className="text-xs text-primary hover:underline mt-0.5 inline-block"
            >
              查看专家主页
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
