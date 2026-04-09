'use client';

import { Link } from '@/i18n/navigation';
import { Building2, Flame, Star, MessageSquare } from 'lucide-react';
import type { InstitutionListItem } from '../../types';

interface InstitutionCardProps {
  institution: InstitutionListItem;
  basePath?: string;
}

export function InstitutionCard({ institution, basePath = '/institutions' }: InstitutionCardProps) {
  const logoSrc = institution.logoUrl
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(institution.orgName.slice(0, 2))}&background=E0F2FE&color=0369A1&size=120&font-size=0.35`;

  return (
    <Link
      href={`${basePath}/${institution.id}`}
      className="p-6 border-b border-slate-100 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row gap-6 group"
    >
      {/* Logo */}
      <div className="w-[120px] h-[120px] shrink-0 bg-white border border-slate-100 rounded-lg shadow-sm flex items-center justify-center p-2 group-hover:border-primary/30 transition-colors">
        {institution.logoUrl ? (
          <img
            src={logoSrc}
            alt={institution.orgName}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-slate-400 rounded">
            <Building2 className="size-10 mb-1" />
            <span className="text-xs font-medium text-center px-1 line-clamp-1">
              {institution.orgName.slice(0, 4)}
            </span>
          </div>
        )}
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
          {institution.bio && (
            <div className="flex items-start">
              <span className="text-slate-400 shrink-0 w-[70px]">机构简介：</span>
              <span className="text-slate-700 line-clamp-2">{institution.bio}</span>
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
            人气：<span className="text-primary font-bold">{institution.viewCount}</span>
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
