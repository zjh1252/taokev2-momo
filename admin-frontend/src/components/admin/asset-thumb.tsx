'use client';

import { Icons } from '@/components/icons';
import { AssetImage } from '@/components/admin/asset-image';

type AssetThumbProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  icon?: React.ReactNode;
};

/** 列表缩略图：有图展示，无图或加载失败显示占位 */
export function AssetThumb({
  src,
  alt,
  className = 'h-10 w-16',
  icon
}: AssetThumbProps) {
  return (
    <AssetImage
      src={src}
      alt={alt}
      fill
      wrapperClassName={className}
      fallback={
        <div
          className={`flex items-center justify-center rounded bg-muted ${className}`}
        >
          {icon ?? <Icons.media className='h-4 w-4 text-muted-foreground' />}
        </div>
      }
    />
  );
}
