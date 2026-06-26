'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { SafeImage } from '@/components/safe-image';
import { getInstitutionLogoFallback } from '../../utils/logo';
import {
  getInstitutionRecommendations,
  type InstitutionRecommendationType,
} from '../../api/service';
import type { InstitutionListItem } from '../../types';

const BLOCKS: { type: InstitutionRecommendationType; title: string }[] = [
  { type: 'high_score', title: '高分机构推荐' },
  { type: 'weekly_active', title: '本周活跃机构' },
  { type: 'newly_joined', title: '最新加入机构' },
];

interface InstitutionSidebarRecommendationsProps {
  association?: boolean;
  basePath?: string;
}

export function InstitutionSidebarRecommendations({
  association,
  basePath = '/company',
}: InstitutionSidebarRecommendationsProps) {
  const [data, setData] = useState<Record<InstitutionRecommendationType, InstitutionListItem[]>>({
    high_score: [],
    weekly_active: [],
    newly_joined: [],
  });

  useEffect(() => {
    let mounted = true;
    Promise.all(
      BLOCKS.map(async (block) => {
        try {
          const list = await getInstitutionRecommendations(block.type, association, 5);
          return [block.type, list] as const;
        } catch {
          return [block.type, []] as const;
        }
      }),
    ).then((entries) => {
      if (!mounted) return;
      setData(Object.fromEntries(entries) as Record<InstitutionRecommendationType, InstitutionListItem[]>);
    });
    return () => {
      mounted = false;
    };
  }, [association]);

  const hasAny = BLOCKS.some((b) => data[b.type].length > 0);
  if (!hasAny) return null;

  return (
    <>
      {BLOCKS.map((block) => {
        const items = data[block.type];
        if (items.length === 0) return null;
        return (
          <div
            key={block.type}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-center">
              <h3 className="font-bold text-primary text-[15px]">{block.title}</h3>
            </div>
            <ul className="py-2">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`${basePath}/${item.id}.htm`}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-10 h-10 shrink-0 bg-white border border-slate-100 rounded flex items-center justify-center p-1">
                      <SafeImage
                        src={item.logoUrl}
                        alt={item.orgName}
                        width={36}
                        height={36}
                        className="max-w-full max-h-full object-contain"
                        fallback={getInstitutionLogoFallback(item.orgName)}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-800 truncate group-hover:text-primary">
                        {item.orgName}
                      </p>
                      {(item.provinceName || item.cityName) ? (
                        <p className="text-[11px] text-slate-400 truncate">
                          {[item.provinceName, item.cityName].filter(Boolean).join(' ')}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </>
  );
}
