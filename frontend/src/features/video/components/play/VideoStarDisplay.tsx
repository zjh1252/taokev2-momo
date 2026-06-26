'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type VideoStarDisplayProps = {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeMap = {
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-5',
};

/** 录播课星级展示（只读） */
export function VideoStarDisplay({ score, size = 'md', className }: VideoStarDisplayProps) {
  const normalized = Math.max(0, Math.min(5, score));
  const fullStars = Math.floor(normalized);
  const hasHalf = normalized - fullStars >= 0.25;

  return (
    <div className={cn('flex items-center gap-0.5 text-amber-400', className)}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < fullStars || (i === fullStars && hasHalf);
        return (
          <Star
            key={i}
            className={cn(sizeMap[size], filled ? 'fill-current' : 'fill-none opacity-35')}
          />
        );
      })}
    </div>
  );
}
