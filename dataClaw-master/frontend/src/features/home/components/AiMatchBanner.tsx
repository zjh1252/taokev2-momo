import { Brain, Sparkles, Headphones } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

/**
 * AI 智能匹配培训资源 Banner — 红色背景 + 图标 + 两个 CTA 按钮
 */
export function AiMatchBanner() {
  const t = useTranslations('home');

  return (
    <section className="bg-primary rounded-lg p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-red-500/10">
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
          <Brain className="size-10 text-white" />
        </div>
        <div>
          <h2 className="text-white text-xl font-bold">{t('aiMatch.title')}</h2>
          <p className="text-white/80 text-sm">{t('aiMatch.description')}</p>
        </div>
      </div>

      <div className="flex gap-4 w-full md:w-auto">
        <Link
          href="/support"
          className="flex-1 md:flex-none bg-white text-primary font-bold px-8 py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-lg text-sm"
        >
          <Headphones className="size-5" />
          {t('aiMatch.ctaService')}
        </Link>
        <Link
          href="/publish"
          className="flex-1 md:flex-none bg-primary/80 text-white font-bold px-8 py-4 rounded-lg flex items-center justify-center gap-2 border border-white/20 hover:bg-primary/70 transition-all text-sm"
        >
          <Sparkles className="size-5" />
          {t('aiMatch.ctaPublish')}
        </Link>
      </div>
    </section>
  );
}
