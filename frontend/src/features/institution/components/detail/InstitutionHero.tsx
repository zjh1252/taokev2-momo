'use client';

import {
  Building2,
  Star,
  MapPin,
  Share2,
  Heart,
  Eye,
  MessageSquare,
  Award,
} from 'lucide-react';
import type { InstitutionDetail } from '../../types';

interface InstitutionHeroProps {
  institution: InstitutionDetail;
}

export function InstitutionHero({ institution }: InstitutionHeroProps) {
  const bannerSrc =
    institution.bannerUrl ||
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop';

  return (
    <div className="flex flex-col gap-6">
      {/* Banner */}
      <div className="w-full h-48 md:h-64 rounded-xl overflow-hidden relative shadow-sm border border-slate-200">
        <img
          src={bannerSrc}
          alt={institution.orgName}
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center pb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-wide drop-shadow-md">
            {institution.orgName}
          </h1>
        </div>
      </div>

      {/* 机构名片 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="mx-4 mt-4 border-l-4 border-primary pl-3 py-2 bg-slate-50 rounded-r flex items-center justify-between">
          <span className="font-bold text-slate-800">{institution.orgName}的简介</span>
          <div className="flex items-center gap-2 text-sm text-slate-600 font-normal">
            <span>机构评分：</span>
            <div className="flex text-amber-500">
              {renderStars(institution.score)}
            </div>
            <span className="text-amber-500 font-bold">{institution.score}</span>
          </div>
        </div>

        <div className="p-6 flex flex-col md:flex-row gap-8">
          {/* Logo + 数据 */}
          <div className="flex flex-col items-center gap-4 w-40 shrink-0">
            <div className="w-40 h-40 border border-slate-100 rounded-lg p-2 shadow-sm flex items-center justify-center">
              {institution.logoUrl ? (
                <img
                  src={institution.logoUrl}
                  alt={institution.orgName}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="w-full h-full bg-teal-50 flex flex-col items-center justify-center text-teal-600 rounded">
                  <Building2 className="size-10 mb-1" />
                  <span className="font-bold text-lg">{institution.orgName.slice(0, 4)}</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-600 w-full px-2">
              <div>
                课程：<span className="font-medium text-slate-900">{institution.openCourseCount + institution.innerCourseCount}</span>
              </div>
              <div>
                评价：<span className="font-medium text-slate-900">{institution.commentCount}</span>
              </div>
            </div>
          </div>

          {/* 右侧信息 */}
          <div className="flex-1 flex flex-col relative">
            {/* 右上角操作 */}
            <div className="absolute right-0 top-0 flex flex-col gap-3 w-[120px]">
              <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2 rounded shadow-sm transition-all flex items-center justify-center gap-1 text-sm">
                <MessageSquare className="size-4" /> 联系机构
              </button>
              <div className="flex items-center justify-between text-xs font-medium w-full px-1">
                <button className="flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors">
                  <Share2 className="size-3.5" /> 分享
                </button>
                <button className="flex items-center gap-1 text-amber-500 hover:text-amber-600 transition-colors">
                  <Heart className="size-3.5" /> 收藏
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3 pr-32">
              <h2 className="text-xl font-bold text-slate-800">{institution.orgName}</h2>
              {institution.isRecommended === 1 && (
                <Award className="size-5 text-amber-500" />
              )}
            </div>

            <div className="flex items-center gap-2 mb-5">
              {institution.isCertified === 1 && (
                <span className="text-[10px] text-primary border border-primary/30 bg-red-50 px-1.5 py-0.5 rounded font-medium">
                  已认证
                </span>
              )}
              {institution.isRecommended === 1 && (
                <span className="text-[10px] text-amber-600 border border-amber-300 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                  金牌
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-y-3 text-sm text-slate-600">
              {institution.specialties && (
                <div className="flex items-start">
                  <span className="w-20 shrink-0 text-slate-400">擅长领域：</span>
                  <span className="text-slate-800">{institution.specialties}</span>
                </div>
              )}
              {institution.industries && (
                <div className="flex items-start">
                  <span className="w-20 shrink-0 text-slate-400">擅长行业：</span>
                  <span className="text-slate-800">{institution.industries}</span>
                </div>
              )}
              <div className="flex items-start">
                <span className="w-20 shrink-0 text-slate-400">机构编号：</span>
                <span className="text-slate-800">{institution.id}</span>
              </div>
              <div className="flex items-center gap-6 text-xs text-slate-500 mt-2">
                <div className="flex items-center gap-1">
                  <Eye className="size-3.5" />
                  人气：{institution.viewCount}
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="size-3.5" />
                  评价：{institution.commentCount}条
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderStars(score: number) {
  const stars = [];
  const full = Math.floor(score);
  const hasHalf = score - full >= 0.25;
  for (let i = 0; i < full; i++) {
    stars.push(<Star key={i} className="size-4 text-amber-400 fill-amber-400" />);
  }
  if (hasHalf && stars.length < 5) {
    stars.push(<Star key="half" className="size-4 text-amber-400 fill-amber-200" />);
  }
  while (stars.length < 5) {
    stars.push(<Star key={`empty-${stars.length}`} className="size-4 text-slate-200" />);
  }
  return stars;
}
