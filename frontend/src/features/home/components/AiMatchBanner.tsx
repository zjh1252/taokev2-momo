'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { Brain, Sparkles, Headphones } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CustomerServiceChatDialog } from '@/components/customer-service-chat-dialog';
import { useAuth } from '@/lib/auth/auth-context';

/**
 * 平台优势 Banner — 红色背景 + 图标 + 双 CTA（智能客服 / 发布需求）
 *
 * 「发布需求」与悬浮栏一致：未登录跳 /publish-demand，已登录跳 /dashboard/demands/create。
 */
export function AiMatchBanner() {
  const t = useTranslations('home');
  const router = useRouter();
  const { user, loading } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);

  const gotoPublishDemand = () => {
    if (loading) return;
    router.push(user ? ROUTES.UC_DEMANDS_CREATE : ROUTES.PUBLISH_DEMAND);
  };

  return (
    <section className="flex flex-col items-stretch justify-between gap-4 rounded-none bg-gradient-to-r from-primary via-primary/95 to-primary/45 px-4 py-5 shadow-xl shadow-red-500/10 sm:px-8 sm:py-6 md:flex-row md:items-center md:gap-6">
      <div className="flex min-w-0 items-center gap-4 sm:gap-5">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-white/20 sm:size-14">
          <Brain className="size-7 text-white sm:size-8" />
        </div>
        <div className="flex min-w-0 flex-col justify-center gap-1 text-left">
          <h2 className="text-lg font-bold leading-tight text-white sm:text-xl">
            {t('aiMatch.title')}
          </h2>
          <p className="text-sm leading-tight text-white/80">
            {t('aiMatch.description')}
          </p>
        </div>
      </div>

      <div className="grid w-full min-w-0 shrink-0 grid-cols-2 gap-2 sm:flex sm:h-14 sm:items-center sm:gap-3 md:w-auto">
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="flex h-12 min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-white px-2 text-xs font-bold text-primary shadow-md transition-all hover:bg-slate-50 sm:h-14 sm:flex-1 sm:gap-2 sm:px-6 sm:text-sm md:flex-none"
        >
          <Headphones className="size-4 shrink-0 sm:size-5" />
          <span className="truncate leading-none">{t('aiMatch.ctaService')}</span>
        </button>
        <button
          type="button"
          onClick={gotoPublishDemand}
          className="flex h-12 min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-primary px-2 text-xs font-bold text-white shadow-md shadow-black/25 transition-all hover:bg-primary/90 sm:h-14 sm:flex-1 sm:gap-2 sm:px-8 sm:text-sm md:flex-none"
        >
          <Sparkles className="size-4 shrink-0 sm:size-5" />
          <span className="truncate leading-none">{t('aiMatch.ctaPublish')}</span>
        </button>
      </div>

      <CustomerServiceChatDialog open={chatOpen} onOpenChange={setChatOpen} />
    </section>
  );
}
