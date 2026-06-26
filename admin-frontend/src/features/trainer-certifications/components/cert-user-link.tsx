'use client';

import Link from 'next/link';
import { getAdminUserDetailUrl } from '@/lib/frontend-links';

/** 资质审核列表 — 用户名可点击跳转用户管理详情 */
export function CertUserLink({
  userId,
  label,
  phone,
}: {
  userId: number;
  label: string;
  phone?: string | null;
}) {
  return (
    <div className='flex flex-col'>
      <Link
        href={getAdminUserDetailUrl(userId)}
        className='font-medium text-primary hover:underline'
      >
        {label}
      </Link>
      {phone ? (
        <span className='text-muted-foreground text-xs'>{phone}</span>
      ) : null}
    </div>
  );
}
