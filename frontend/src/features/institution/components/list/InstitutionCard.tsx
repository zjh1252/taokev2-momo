'use client';

import { Link } from '@/i18n/navigation';
import { Flame, Star, MessageSquare } from 'lucide-react';
import { SafeImage } from '@/components/safe-image';
import { useBumpedViewCount } from '@/hooks/use-bumped-view-count';
import { getInstitutionLogoFallback } from '../../utils/logo';
import { institutionPublicHref } from '../../utils/public-path';
import { legacyRichTextToPlain } from '@/lib/legacy-rich-text';
import type { InstitutionListItem } from '../../types';

interface InstitutionCardProps {
  institution: InstitutionListItem;
  basePath?: string;
}

export function InstitutionCard({ institution, basePath = '/company' }: InstitutionCardProps) {
  const { viewCount, onCardClick } = useBumpedViewCount(
    institution.viewCount,
    'institution',
    institution.id,
  );
  const location = [institution.provinceName, institution.cityName].filter(Boolean).join(' ');

  return (
    <Link
      href={institutionPublicHref(institution, basePath)}
      onClick={onCardClick}
      className="p-6 border-b border-slate-100 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row gap-6 group"
    >
      {/* Logo */}
      <div className="w-[120px] h-[120px] shrink-0 bg-white border border-slate-100 rounded-lg shadow-sm flex items-center justify-center p-2 group-hover:border-primary/30 transition-colors">
        <SafeImage
          src={institution.logoUrl}
          alt={institution.orgName}
          width={112}
          height={112}
          apiResolved
          className="max-w-full max-h-full object-contain"
          loading="eager"
          fallback={getInstitutionLogoFallback(institution.orgName)}
        />
      </div>

      {/* 信息区 */}
      <div className="flex-1 flex flex-col">
        {/* 标题 */}
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-lg font-bold text-slate-800 group-hover:text-primary transition-colors">
            {institution.orgName}
          </h3>
          {institution.isCertified === 1 && (
            <span className="border border-red-500 text-red-500 text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0">
              已认证
            </span>
          )}
          {institution.isRecommended === 1 && (
            <span className="border border-amber-500 text-amber-500 text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0">
              金牌
            </span>
          )}
        </div>

        {/* 详情区 */}
        <div className="flex flex-col gap-1.5 text-[13px] text-slate-600 mb-4 bg-slate-50 p-3 rounded">
          <div className="flex items-start">
            <span className="text-slate-400 shrink-0 w-[70px]">所在地：</span>
            <span className="text-slate-700">{location || '—'}</span>
          </div>
          {institution.specialties && (
            <div className="flex items-start">
              <span className="text-slate-400 shrink-0 w-[70px]">擅长领域：</span>
              <span className="text-slate-700">{institution.specialties}</span>
            </div>
          )}
          {institution.industries && (
            <div className="flex items-start">
              <span className="text-slate-400 shrink-0 w-[70px]">擅长行业：</span>
              <span className="text-slate-700">{institution.industries}</span>
            </div>
          )}
          {institution.bio && institution.bio.trim() && (
            <div className="flex items-start">
              <span className="text-slate-400 shrink-0 w-[70px]">机构简介：</span>
              <span className="text-slate-700 line-clamp-2 whitespace-pre-line">
                {legacyRichTextToPlain(institution.bio)}
              </span>
            </div>
          )}
        </div>

        {/* 底部数据 */}
        <div className="flex items-center gap-6 text-xs text-slate-500">
          <div>
            公开课：<span className="text-primary font-bold">{institution.openCourseCount}</span>
          </div>
          <div>
            内训课：<span className="text-primary font-bold">{institution.innerCourseCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Flame className="size-3.5 text-orange-400" />
            人气：<span className="text-primary font-bold">{viewCount}</span>
          </div>
          {institution.score > 0 && (
            <div className="flex items-center gap-1">
              <Star className="size-3.5 text-amber-400 fill-amber-400" />
              <span className="text-amber-500 font-bold">{institution.score}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <MessageSquare className="size-3.5" />
            评价：<span className="text-primary font-bold">{institution.commentCount}条</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
