'use client';

import { useRouter } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { Brain, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth/auth-context';

/**
 * 平台优势 Banner — 红色背景 + 图标 + H1 文案 + 发布需求 CTA
 */
export function AiMatchBanner() {
  const t = useTranslations('home');
  const router = useRouter();
  const { user, loading } = useAuth();

  const gotoPublishDemand = () => {
    if (loading) return;
    router.push(user ? ROUTES.UC_DEMANDS_CREATE : ROUTES.PUBLISH_DEMAND);
  };

  return (
    <section className="bg-primary rounded-lg p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-red-500/10">
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
          <Brain className="size-10 text-white" />
        </div>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <span className="text-white text-xl font-bold">{t('aiMatch.title')}</span>
          <h1 className="text-white text-2xl font-black tracking-wide">
            {t('aiMatch.headline')}
          </h1>
        </div>
      </div>

      <div className="flex w-full md:w-auto">
        <button
          type="button"
          onClick={gotoPublishDemand}
          className="flex-1 md:flex-none bg-primary/80 text-white font-bold px-8 py-4 rounded-lg flex items-center justify-center gap-2 border border-white/20 hover:bg-primary/70 transition-all text-sm cursor-pointer"
        >
          <Sparkles className="size-5" />
          {t('aiMatch.ctaPublish')}
        </button>
      </div>
    </section>
  );
}
