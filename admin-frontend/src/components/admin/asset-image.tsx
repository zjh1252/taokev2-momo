'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { imageReferrerPolicy, resolveAssetUrl } from '@/lib/resolve-asset-url';

type AssetImageProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  fallback?: React.ReactNode;
  fill?: boolean;
  width?: number;
  height?: number;
};

/**
 * 后台通用图片组件 — 使用原生 img + resolveAssetUrl，避免 next/image 域名白名单限制。
 * PXB CDN 会拒绝 Referer=localhost，外链须 no-referrer。
 */
export function AssetImage({
  src,
  alt,
  className,
  wrapperClassName,
  fallback = null,
  fill = false,
  width,
  height
}: AssetImageProps) {
  const [broken, setBroken] = useState(false);
  const resolved = src?.trim() ? resolveAssetUrl(src) : '';
  const referrerPolicy = imageReferrerPolicy(resolved);

  useEffect(() => {
    setBroken(false);
  }, [resolved]);

  if (!resolved || broken) {
    return fallback;
  }

  if (fill) {
    return (
      <div className={cn('relative overflow-hidden', wrapperClassName)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolved}
          alt={alt}
          referrerPolicy={referrerPolicy}
          className={cn('absolute inset-0 h-full w-full object-cover', className)}
          onError={() => setBroken(true)}
        />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={alt}
      width={width}
      height={height}
      referrerPolicy={referrerPolicy}
      className={className}
      onError={() => setBroken(true)}
    />
  );
}
