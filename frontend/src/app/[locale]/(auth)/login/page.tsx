'use client';

import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const t = useTranslations('auth');

  return (
    <div>
      <h1 className="text-2xl font-bold text-center">{t('login.title')}</h1>
      {/* TODO: 登录表单 */}
    </div>
  );
}
