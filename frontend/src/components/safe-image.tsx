'use client';

import { useState } from 'react';
import Image, { type ImageProps } from 'next/image';
import { resolveImageSrc, DEFAULT_TRAINER_AVATAR } from '@/lib/media';

type SafeImageProps = Omit<ImageProps, 'src' | 'onError'> & {
  src?: string | null;
  fallback?: string;
};

/**
 * 带加载失败回退的 Image — 用于专家头像等可能 404 的远程/旧库路径
 */
function isRemoteSrc(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

export function SafeImage({
  src,
  fallback = DEFAULT_TRAINER_AVATAR,
  alt,
  ...props
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(() => resolveImageSrc(src, fallback));
  // 旧站 www.taoke.com 头像：浏览器直连可用，但走 _next/image 优化会 400，需 unoptimized
  const unoptimized = isRemoteSrc(imgSrc);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt ?? ''}
      unoptimized={unoptimized}
      referrerPolicy={unoptimized ? 'no-referrer' : undefined}
      onError={() => {
        if (imgSrc !== fallback) setImgSrc(fallback);
      }}
    />
  );
}
