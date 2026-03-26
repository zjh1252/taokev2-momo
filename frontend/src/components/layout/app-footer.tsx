import { Globe, MessageCircle, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';

const footerLinkClass =
  'text-sm text-muted-foreground transition-colors hover:text-primary';

export function AppFooter() {
  const t = useTranslations('home');

  const socialBtnClass =
    'flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-muted-foreground transition-colors hover:border-primary hover:text-primary';

  return (
    <footer className="mt-20 w-full border-t border-slate-200 bg-slate-50 px-8 py-16">
      <div className="mx-auto grid max-w-7xl grid-cols-2 items-start gap-8 md:grid-cols-4 lg:flex lg:justify-between">
        <div className="col-span-2 lg:w-1/3">
          <div className="mb-4 text-2xl font-bold text-primary">淘课网</div>
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
            {t('footer.companyIntro')}
          </p>
          <div className="flex gap-4">
            <a
              href="#"
              className={socialBtnClass}
              aria-label="官网"
            >
              <Globe className="h-5 w-5" aria-hidden />
            </a>
            <a
              href="#"
              className={socialBtnClass}
              aria-label="在线客服"
            >
              <MessageCircle className="h-5 w-5" aria-hidden />
            </a>
            <a
              href="#"
              className={socialBtnClass}
              aria-label="联系电话"
            >
              <Phone className="h-5 w-5" aria-hidden />
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <span className="font-bold">{t('footer.aboutUs')}</span>
          <Link href={ROUTES.ARTICLES} className={footerLinkClass}>
            {t('footer.aboutCompany')}
          </Link>
          <Link href={ROUTES.ARTICLES} className={footerLinkClass}>
            {t('footer.joinUs')}
          </Link>
          <Link href={ROUTES.ARTICLES} className={footerLinkClass}>
            {t('footer.contactUs')}
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          <span className="font-bold">{t('footer.business')}</span>
          <Link href={ROUTES.INSTRUCTORS} className={footerLinkClass}>
            {t('footer.instructorJoin')}
          </Link>
          <Link href={ROUTES.INSTITUTIONS} className={footerLinkClass}>
            {t('footer.institutionJoin')}
          </Link>
          <Link href={ROUTES.INSTITUTIONS} className={footerLinkClass}>
            {t('footer.partners')}
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          <span className="font-bold">{t('footer.helpCenter')}</span>
          <Link href={ROUTES.ARTICLES} className={footerLinkClass}>
            {t('footer.terms')}
          </Link>
          <Link href={ROUTES.ARTICLES} className={footerLinkClass}>
            {t('footer.privacy')}
          </Link>
          <Link href={ROUTES.ARTICLES} className={footerLinkClass}>
            {t('footer.faq')}
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-16 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 md:flex-row">
        <p className="text-xs text-slate-400">{t('footer.copyright')}</p>
        <div className="flex gap-6 text-[10px] text-slate-400">
          <span>{t('footer.icp')}</span>
          <span>{t('footer.license')}</span>
        </div>
      </div>
    </footer>
  );
}
