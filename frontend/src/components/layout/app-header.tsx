import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { HeaderAuth } from './header-auth';

export function AppHeader() {
  const t = useTranslations('nav');

  return (
    <header className="flex items-center justify-between px-6 h-16 border-b">
      <nav className="flex items-center gap-6">
        <Link href="/" className="font-bold text-lg">淘课网</Link>
        <Link href="/courses">{t('courses')}</Link>
        <Link href="/instructors">{t('instructors')}</Link>
        <Link href="/articles">{t('articles')}</Link>
      </nav>
      <HeaderAuth />
    </header>
  );
}
