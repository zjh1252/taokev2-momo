'use client';

import { useState } from 'react';
import { Icons } from '@/components/icons';
import { resolveAssetUrl } from '@/lib/resolve-asset-url';

/**
 * 列表中展示一份证明文件 — 图片直接缩略图，PDF/Doc 显示「查看文件」链接。
 *
 * <p>所有 URL 都通过 {@link resolveAssetUrl} 解析；老站 attachments 走同源 /taoke-legacy 反代。</p>
 */
export function CertFileLink({
  url,
  alt = '附件'
}: {
  url: string | null | undefined;
  alt?: string;
}) {
  const [broken, setBroken] = useState(false);
  const resolved = resolveAssetUrl(url);
  if (!resolved) return <span className='text-muted-foreground'>-</span>;

  const isLegacyAttachment = /\/attachments\//i.test(resolved) || /\/u\//i.test(resolved);
  const isImage =
    !broken &&
    (/\.(png|jpe?g|gif|webp|bmp)(\?|$)/i.test(resolved) ||
      (isLegacyAttachment && !/\.pdf(\?|$)/i.test(resolved)));

  if (isImage) {
    return (
      <a href={resolved} target='_blank' rel='noopener noreferrer'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolved}
          alt={alt}
          width={48}
          height={48}
          className='h-12 w-12 rounded object-cover ring-1 ring-border hover:ring-primary'
          onError={() => setBroken(true)}
        />
      </a>
    );
  }

  if (broken) {
    return (
      <a
        href={resolved}
        target='_blank'
        rel='noopener noreferrer'
        className='inline-flex items-center gap-1 text-xs text-primary hover:underline'
      >
        <Icons.fileTypePdf className='h-3.5 w-3.5' />
        查看文件
      </a>
    );
  }

  return (
    <a
      href={resolved}
      target='_blank'
      rel='noopener noreferrer'
      className='inline-flex items-center gap-1 text-xs text-primary hover:underline'
    >
      <Icons.fileTypePdf className='h-3.5 w-3.5' />
      查看文件
    </a>
  );
}

/** 多文件列表（用于专业认证） */
export function CertFileGallery({ files }: { files: string[] | null | undefined }) {
  if (!files || files.length === 0)
    return <span className='text-muted-foreground'>-</span>;
  return (
    <div className='flex flex-wrap gap-1.5'>
      {files.map((fileUrl, idx) => (
        <CertFileLink key={`${fileUrl}-${idx}`} url={fileUrl} />
      ))}
    </div>
  );
}
