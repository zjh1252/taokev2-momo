'use client';

import { SafeImage } from '@/components/safe-image';
import { DEFAULT_COURSE_COVER } from '@/lib/media';

interface ReviewPhotoListProps {
  urls?: string[] | null;
}

/** 评价配图列表 — 兼容旧库 /attachments/comment_pic/ 等相对路径 */
export function ReviewPhotoList({ urls }: ReviewPhotoListProps) {
  if (!urls?.length) return null;

  return (
    <div className="mt-3 flex gap-2 flex-wrap">
      {urls.map((url, idx) => (
        <SafeImage
          key={`${url}-${idx}`}
          src={url}
          fallback={DEFAULT_COURSE_COVER}
          alt="评价配图"
          width={120}
          height={90}
          className="w-[120px] h-[90px] object-cover rounded border border-slate-200"
        />
      ))}
    </div>
  );
}
