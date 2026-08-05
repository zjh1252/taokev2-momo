'use client';

import { useState } from 'react';
import { imageReferrerPolicy, resolveAssetUrl } from '@/lib/resolve-asset-url';

export function CourseCoverThumb({
  coverUrl,
  title
}: {
  coverUrl: string | null | undefined;
  title: string;
}) {
  const [broken, setBroken] = useState(false);
  const resolved = coverUrl?.trim() ? resolveAssetUrl(coverUrl) : '';

  if (!resolved || broken) {
    return <span className='text-muted-foreground text-xs'>-</span>;
  }

  return (
    <div className='relative h-10 w-16 overflow-hidden rounded bg-muted'>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolved}
        alt={title}
        referrerPolicy={imageReferrerPolicy(resolved)}
        className='h-full w-full object-cover'
        onError={() => setBroken(true)}
      />
    </div>
  );
}
