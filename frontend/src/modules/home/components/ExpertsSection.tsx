import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { SectionHeader } from './SectionHeader';
import type { Expert } from '../types';

interface ExpertsSectionProps {
  experts: Expert[];
}

export function ExpertsSection({ experts }: ExpertsSectionProps) {
  const t = useTranslations('home');

  return (
    <section>
      <SectionHeader
        title={t('experts.sectionTitle')}
        viewMoreHref="/experts"
        viewMoreText={t('experts.viewMore')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {experts.map((expert) => (
          <ExpertCard key={expert.id} expert={expert} />
        ))}
      </div>
    </section>
  );
}

function ExpertCard({ expert }: { expert: Expert }) {
  const t = useTranslations('home');

  const statText = t(`experts.${expert.statType}`, {
    count: expert.statCount,
  });

  return (
    <Link
      href={`/experts/${expert.id}`}
      className="group bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* 头像区域 */}
      <div className="relative h-48 bg-muted">
        <Image
          src={expert.avatar}
          alt={expert.name}
          fill
          className="object-cover"
        />
        <span className="absolute bottom-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded">
          {expert.title}
        </span>
      </div>

      {/* 信息区域 */}
      <div className="p-4">
        <h4 className="font-bold text-foreground text-base mb-1">
          {expert.name}
        </h4>
        <p className="text-muted-foreground text-xs line-clamp-2 mb-3">
          {expert.bio}
        </p>

        {/* 评分 */}
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`size-3.5 ${
                i < Math.round(expert.rating)
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-muted-foreground/30'
              }`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-1">
            {expert.rating}
          </span>
        </div>

        {/* 统计标签 */}
        <span className="text-xs text-primary font-medium">{statText}</span>
      </div>
    </Link>
  );
}
