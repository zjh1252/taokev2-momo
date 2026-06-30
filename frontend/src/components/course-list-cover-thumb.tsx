'use client';

import { BookOpen } from 'lucide-react';
import { SafeImage } from '@/components/safe-image';
import { cn } from '@/lib/utils';

interface CourseListCoverThumbProps {
  /** 接口已解析封面（自定义封面或素材库默认） */
  coverUrl?: string | null;
  alt: string;
  className?: string;
}

/**
 * 课程列表左侧封面缩略图：有 coverUrl 则展示，否则 BookOpen 占位。
 */
export function CourseListCoverThumb({ coverUrl, alt, className }: CourseListCoverThumbProps) {
  const hasCover = Boolean(coverUrl?.trim());

  return (
    <div
      className={cn(
        'w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center',
        className
      )}
    >
      {hasCover ? (
        <SafeImage
          src={coverUrl}
          alt={alt}
          width={48}
          height={48}
          apiResolved
          className="w-full h-full object-cover"
        />
      ) : (
        <BookOpen className="size-6 text-slate-300" strokeWidth={1.5} />
      )}
    </div>
  );
}
