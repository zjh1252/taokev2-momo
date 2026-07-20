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
    <section className="rounded-none bg-gradient-to-r from-primary via-primary/95 to-primary/45 px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-red-500/10">
      <div className="flex items-center gap-5 min-w-0">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-white/20">
          <Brain className="size-8 text-white" />
        </div>
        <div className="flex min-w-0 flex-col justify-center gap-1 text-left">
          <h2 className="text-xl font-bold leading-tight text-white">
            {t('aiMatch.title')}
          </h2>
          <p className="text-sm leading-tight text-white/80">
            {t('aiMatch.description')}
          </p>
        </div>
      </div>

      <div className="flex h-14 w-full shrink-0 items-center gap-3 md:w-auto">
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="flex h-14 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-bold text-primary shadow-md transition-all hover:bg-slate-50 md:flex-none"
        >
          <Headphones className="size-5 shrink-0" />
          <span className="leading-none">{t('aiMatch.ctaService')}</span>
        </button>
        <button
          type="button"
          onClick={gotoPublishDemand}
          className="flex h-14 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-bold text-white shadow-md shadow-black/25 transition-all hover:bg-primary/90 md:flex-none"
        >
          <Sparkles className="size-5 shrink-0" />
          <span className="leading-none">{t('aiMatch.ctaPublish')}</span>
        </button>
      </div>

      <CustomerServiceChatDialog open={chatOpen} onOpenChange={setChatOpen} />
    </section>
  );
}
