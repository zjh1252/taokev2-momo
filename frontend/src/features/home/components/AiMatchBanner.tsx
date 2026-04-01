import { Brain, Sparkles, Headphones } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function AiMatchBanner() {
  const t = useTranslations('home');

  return (
    <section className="bg-primary rounded-lg p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-red-500/10">
      <div className="flex items-center gap-5">
        <div className="bg-white/15 rounded-xl p-4 shrink-0">
          <Brain className="size-10 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-primary-foreground mb-1">
            {t('aiMatch.title')}
          </h3>
          <p className="text-primary-foreground/80 text-sm">
            {t('aiMatch.description')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/publish"
          className="bg-white text-primary font-bold px-6 py-3 rounded-lg hover:bg-white/90 transition-colors flex items-center gap-2 text-sm"
        >
          <Sparkles className="size-4" />
          {t('aiMatch.ctaPublish')}
        </Link>
        <Link
          href="/support"
          className="border border-white/40 text-primary-foreground font-bold px-6 py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 text-sm"
        >
          <Headphones className="size-4" />
          {t('aiMatch.ctaService')}
        </Link>
      </div>
    </section>
  );
}
