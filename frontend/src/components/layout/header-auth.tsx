import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
// TODO: 接入 getCurrentUser 从 session 判断登录状态

export function HeaderAuth() {
  const t = useTranslations('nav');
  // TODO: const user = await getCurrentUser();

  // 未登录状态
  return (
    <div className="flex items-center gap-3">
      <Link href="/login">{t('login')}</Link>
      <Link href="/register">{t('register')}</Link>
    </div>
  );

  // TODO: 已登录状态返回 <UserDropdown user={user} />
}
