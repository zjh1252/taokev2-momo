'use client';

import { Link } from '@/i18n/navigation';
import { SafeImage } from '@/components/safe-image';
import type { TrainerListItem } from '../../types';
import { getTrainerDisplayName } from '../../utils/displayName';
import { pickDisplayTitle } from '../../utils/displayTitle';

/** 擅长领域筛选时的领域推荐专家（运营配置 3 名 PRIMARY） */
export function TrainerCategoryExpertBar({ items }: { items: TrainerListItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4">
      <h3 className="text-sm font-bold text-amber-900 mb-3 px-1">领域推荐专家</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map((t) => {
          const displayName = getTrainerDisplayName(t);
          const subtitle = pickDisplayTitle(t.title, displayName)
            || (t.oneLineIntro?.trim() || undefined);
          return (
            <Link
              key={t.id}
              href={`/trainer/${t.id}.htm`}
              className="group flex gap-3 rounded-lg bg-white border border-amber-100 p-3 hover:shadow-md transition-shadow"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100">
                <SafeImage
                  src={t.avatar}
                  alt={displayName}
                  fill
                  useApiSrc
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">{displayName}</h4>
                {subtitle ? (
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{subtitle}</p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
