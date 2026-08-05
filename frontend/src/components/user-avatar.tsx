'use client';

import { SafeImage } from '@/components/safe-image';
import { cn } from '@/lib/utils';

type UserAvatarProps = {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
};

/** 从昵称中提取最多 2 个字符作为头像 initials */
export function getUserInitials(name: string): string {
  if (!name) return '?';
  const upper = name.toUpperCase();
  if (/^[A-Z]/.test(upper)) {
    return upper.slice(0, 2);
  }
  return name.slice(0, 1);
}

/**
 * 用户头像 — 图片加载失败时显示红底 initials，使用 SafeImage 重试旧站 middle 路径。
 */
export function UserAvatar({ src, name, size = 22, className }: UserAvatarProps) {
  const resolvedSrc = src?.trim() || '';
  const initials = getUserInitials(name);

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full bg-primary flex items-center justify-center text-white font-bold',
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.36)) }}
    >
      <span aria-hidden={Boolean(resolvedSrc)}>{initials}</span>
      {resolvedSrc ? (
        <SafeImage
          src={resolvedSrc}
          alt={name}
          fallback=""
          width={size}
          height={size}
          className="absolute inset-0 z-10 size-full object-cover"
        />
      ) : null}
    </div>
  );
}
