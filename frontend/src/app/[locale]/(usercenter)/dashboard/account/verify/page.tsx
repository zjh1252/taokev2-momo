'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';

/**
 * 账号认证页 — 重定向至专家实名认证页（原 stub 已废弃）。
 */
export default function AccountVerifyPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROUTES.UC_ACCOUNT_CERT_REAL_NAME);
  }, [router]);

  return (
    <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
      正在跳转至实名认证...
    </div>
  );
}
