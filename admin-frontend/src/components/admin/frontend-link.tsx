'use client';

import { Icons } from '@/components/icons';
import Link from 'next/link';

type FrontendLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

/** 跳转 C 端前台的外部链接，新标签打开 */
export function FrontendLink({ href, children, className }: FrontendLinkProps) {
  if (!href || href.startsWith('/dashboard')) {
    return <span className={className}>{children}</span>;
  }

  return (
    <Link
      href={href}
      target='_blank'
      rel='noopener noreferrer'
      className={`inline-flex items-center gap-0.5 text-primary hover:underline ${className ?? ''}`}
    >
      {children}
      <Icons.externalLink className='h-3 w-3 shrink-0 opacity-60' />
    </Link>
  );
}
