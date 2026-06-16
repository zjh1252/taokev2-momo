import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { SectionHeader } from './SectionHeader';
import type { CaseStudy } from '../types';

interface CasesSectionProps {
  cases: CaseStudy[];
}

/**
 * 专家案例 — 4 列等宽卡片布局（带封面图 + 标签 + 标题 + 描述 + 底部标签 + 按钮）
 */
export function CasesSection({ cases }: CasesSectionProps) {
  const t = useTranslations('home');

  return (
    <section>
      <SectionHeader
        title={t('cases.sectionTitle')}
        viewMoreHref="/trainer"
        viewMoreText={t('experts.viewMore')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cases.map((cs) => (
          <CaseCard key={cs.id} caseStudy={cs} />
        ))}
      </div>
    </section>
  );
}

function CaseCard({ caseStudy }: { caseStudy: CaseStudy }) {
  const t = useTranslations('home');

  return (
    <Link
      href={`/case/${caseStudy.id}.htm`}
      className="bg-white rounded-lg overflow-hidden border border-slate-100 hover:border-primary transition-colors shadow-sm group flex flex-col h-full"
    >
      {/* 封面图 */}
      <div className="h-40 overflow-hidden relative">
        <Image
          src={caseStudy.image}
          alt={caseStudy.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
      </div>

      {/* 内容 */}
      <div className="p-6 flex flex-col flex-1">
        <span className="text-primary font-bold text-[10px] uppercase tracking-widest mb-3">
          {caseStudy.tag}
        </span>
        <h3 className="text-lg font-bold mb-3 text-slate-800 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
          {caseStudy.title}
        </h3>
        <p className="text-slate-500 text-sm mb-6 line-clamp-2 leading-relaxed">
          {caseStudy.description}
        </p>

        {/* 底部标签 + 案例时间 + 按钮 */}
        <div className="mt-auto pt-4 border-t border-slate-100">
          <div className="flex flex-wrap gap-2 mb-3">
            {caseStudy.tags.map((tag) => (
              <span
                key={tag}
                className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px]"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3">
            {caseStudy.caseDate ? (
              <span className="text-xs text-slate-400">
                {t('cases.caseDate', { date: caseStudy.caseDate })}
              </span>
            ) : (
              <span />
            )}
            <span className="bg-primary text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-primary/90 transition-colors shrink-0">
              {t('cases.readMore')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
