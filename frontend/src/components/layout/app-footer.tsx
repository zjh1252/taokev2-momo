import { useTranslations } from 'next-intl';

export function AppFooter() {
  const t = useTranslations('common');

  return (
    <footer className="border-t px-6 py-8 text-sm text-muted-foreground">
      <p>{t('footer.copyright')}</p>
      {/* TODO: 底部链接 */}
    </footer>
  );
}
