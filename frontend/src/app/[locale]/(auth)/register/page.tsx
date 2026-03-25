'use client';

import { useTranslations } from 'next-intl';

export default function RegisterPage() {
  const t = useTranslations('auth');

  return (
    <div>
      <h1 className="text-2xl font-bold text-center">{t('register.title')}</h1>
      {/* TODO: 注册表单 */}
    </div>
  );
}
