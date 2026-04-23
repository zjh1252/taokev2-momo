import { Icons } from '@/components/icons';
import Image from 'next/image';

/**
 * 列表中展示一份证明文件 — 图片直接缩略图，PDF/Doc 显示「查看文件」链接。
 */
export function CertFileLink({
  url,
  alt = '附件'
}: {
  url: string | null | undefined;
  alt?: string;
}) {
  if (!url) return <span className='text-muted-foreground'>-</span>;
  const isImage = /\.(png|jpe?g|gif|webp|bmp)(\?|$)/i.test(url);
  if (isImage) {
    return (
      <a href={url} target='_blank' rel='noopener noreferrer'>
        <Image
          src={url}
          alt={alt}
          width={48}
          height={48}
          className='h-12 w-12 rounded object-cover ring-1 ring-border hover:ring-primary'
          unoptimized
        />
      </a>
    );
  }
  return (
    <a
      href={url}
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
      {files.map((url, idx) => (
        <CertFileLink key={`${url}-${idx}`} url={url} />
      ))}
    </div>
  );
}
