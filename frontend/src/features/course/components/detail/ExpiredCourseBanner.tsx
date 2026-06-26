'use client';

import { useTranslations } from 'next-intl';

interface ExpiredCourseBannerProps {
  show: boolean;
}

/** 过期线下公开课详情页顶部提示 */
export function ExpiredCourseBanner({ show }: ExpiredCourseBannerProps) {
  const t = useTranslations('course.detail');

  if (!show) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600">
      {t('expiredBanner')}
    </div>
  );
}
