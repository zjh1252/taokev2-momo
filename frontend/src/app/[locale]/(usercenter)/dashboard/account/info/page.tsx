'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/config/routes';

/**
 * 身份信息页 — 功能已合并至「修改身份」页，自动跳转
 *
 * @author Fangxinxin
 * @date 2026-04-16 15:00
 */
export default function AccountInfoPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROUTES.UC_ACCOUNT_BASE);
  }, [router]);

  return null;
}
