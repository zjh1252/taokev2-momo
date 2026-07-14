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
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="flex-1 md:flex-none bg-white text-primary font-bold px-8 py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-lg text-sm cursor-pointer"
        >
          <Headphones className="size-5" />
          {t('aiMatch.ctaService')}
        </button>
        <button
          type="button"
          onClick={gotoPublishDemand}
          className="flex-1 md:flex-none bg-primary/80 text-white font-bold px-8 py-4 rounded-lg flex items-center justify-center gap-2 border border-white/20 hover:bg-primary/70 transition-all text-sm cursor-pointer"
        >
          <Sparkles className="size-5" />
          {t('aiMatch.ctaPublish')}
        </button>
      </div>

      <CustomerServiceChatDialog open={chatOpen} onOpenChange={setChatOpen} />
    </section>
  );
}
