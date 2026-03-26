import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { SectionHeader } from './SectionHeader';
import type { CaseStudy } from '../types';

interface CasesSectionProps {
  cases: CaseStudy[];
}

export function CasesSection({ cases }: CasesSectionProps) {
  const t = useTranslations('home');

  const featured = cases.find((c) => c.featured);
  const rest = cases.filter((c) => !c.featured);

  return (
    <section>
      <SectionHeader title={t('cases.sectionTitle')} />

      <div className="grid grid-cols-12 gap-6">
        {/* 精选大卡 */}
        {featured && (
          <Link
            href={`/cases/${featured.id}`}
            className="col-span-12 lg:col-span-7 row-span-2 relative rounded-lg overflow-hidden group min-h-[380px]"
          >
            <div className="absolute inset-0 bg-muted">
              {featured.image && (
                <Image
                  src={featured.image}
                  alt={featured.title}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            <div className="relative z-10 flex flex-col justify-end h-full p-8">
              <span className="text-primary-foreground/80 text-xs font-bold bg-primary px-3 py-1 rounded w-fit mb-3">
                {featured.tag}
              </span>
              <h3 className="text-xl font-bold text-white leading-snug mb-2">
                {featured.title}
              </h3>
              <p className="text-white/70 text-sm line-clamp-2 mb-4 max-w-md">
                {featured.description}
              </p>
              <span className="text-primary-foreground font-bold text-sm flex items-center gap-1 group-hover:underline">
                {t('cases.readMore')}
                <ArrowRight className="size-4" />
              </span>
            </div>
          </Link>
        )}

        {/* 右侧小卡 */}
        {rest.map((cs) => (
          <Link
            key={cs.id}
            href={`/cases/${cs.id}`}
            className="col-span-12 lg:col-span-5 bg-card rounded-lg border border-border p-6 flex flex-col justify-between hover:shadow-lg transition-shadow group"
          >
            <div>
              <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded">
                {cs.tag}
              </span>
              <h4 className="font-bold text-foreground mt-3 mb-2 leading-snug">
                {cs.title}
              </h4>
              <p className="text-muted-foreground text-sm line-clamp-2">
                {cs.description}
              </p>
            </div>

            <div className="flex items-center justify-between mt-4">
              {cs.instructorName && (
                <span className="text-xs text-muted-foreground">
                  {t('cases.serviceInstructor', { name: cs.instructorName })}
                </span>
              )}
              <span className="text-primary text-sm font-bold flex items-center gap-1 group-hover:underline ml-auto">
                {t('cases.readMore')}
                <ArrowRight className="size-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
