import { Bot, Brain, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function AiEngagementBanner() {
  const t = useTranslations('home');

  const titleParts = t('aiEngagement.title').split('\n');

  return (
    <section className="bg-gradient-to-r from-[#200502] via-[#0d161d] to-[#410502] rounded-lg p-10 flex items-center justify-between shadow-2xl overflow-hidden relative border border-white/5">
      {/* 背景装饰 */}
      <Brain className="absolute right-10 top-1/2 -translate-y-1/2 size-64 text-white/[0.03]" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-8">
        <div className="max-w-xl">
          {/* 徽章 */}
          <span className="inline-flex items-center gap-1.5 bg-white/10 text-white/80 text-xs font-medium px-3 py-1 rounded-full mb-4 border border-white/10">
            <Bot className="size-3.5" />
            {t('aiEngagement.badge')}
          </span>

          {/* 标题 */}
          <h2 className="text-2xl md:text-3xl font-black text-white leading-snug mb-3">
            {titleParts.map((part, i) => (
              <span key={i}>
                {part}
                {i < titleParts.length - 1 && <br />}
              </span>
            ))}
          </h2>

          {/* 描述 */}
          <p className="text-white/60 text-sm leading-relaxed">
            {t('aiEngagement.description')}
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/ai-match"
          className="bg-primary text-primary-foreground font-bold px-8 py-3.5 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 shrink-0"
        >
          <Sparkles className="size-5" />
          {t('aiEngagement.cta')}
        </Link>
      </div>
    </section>
  );
}
