import { Headphones } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * AI 智能客服助手 Banner — 暗色渐变背景 + 标题 + 描述 + 按钮
 */
export function AiEngagementBanner() {
  const t = useTranslations('home');

  return (
    <section className="bg-gradient-to-r from-[#200502] via-[#0d161d] to-[#410502] rounded-lg px-10 py-6 flex items-center justify-between shadow-2xl overflow-hidden relative border border-white/5">
      {/* 左侧文案 */}
      <div className="relative z-10 max-w-2xl">
        <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-white/70 text-[10px] mb-3">
          <Headphones className="size-3.5" />
          {t('aiEngagement.badge')}
        </div>
        <h2 className="text-white text-2xl font-black mb-2 leading-tight">
          {t('aiEngagement.title')}
        </h2>
        <p className="text-white/60 text-sm leading-relaxed max-w-lg">
          {t('aiEngagement.description')}
        </p>
      </div>

      {/* 右侧按钮 */}
      <div className="relative z-10">
        <button
          type="button"
          className="bg-primary text-white font-black px-6 py-3 rounded-lg hover:scale-105 active:scale-95 transition-all shadow-xl shadow-red-500/20 text-base flex items-center gap-2"
        >
          <Headphones className="size-5" />
          {t('aiEngagement.cta')}
        </button>
      </div>

      {/* 背景装饰 */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
        <Headphones className="size-[150px] text-white" />
      </div>
    </section>
  );
}
