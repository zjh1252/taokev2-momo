import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
// TODO: 接入 getCurrentUser 从 session 判断登录状态

export function HeaderAuth() {
  const t = useTranslations('nav');
  // TODO: const user = await getCurrentUser();

  // 未登录状态
  return (
    <div className="flex items-center gap-3 text-sm font-medium">
      <Link href={ROUTES.LOGIN} className="hover:text-primary transition-colors">
        {t('login')}
      </Link>
      <span className="text-muted-foreground">|</span>
      <Link href={ROUTES.REGISTER} className="hover:text-primary transition-colors">
        {t('register')}
      </Link>
      <span className="text-muted-foreground">|</span>
      <Link href={ROUTES.DASHBOARD} className="hover:text-primary transition-colors">
        {t('userCenter')}
      </Link>
    </div>
  );

  // TODO: 已登录状态返回 <UserDropdown user={user} />
}
