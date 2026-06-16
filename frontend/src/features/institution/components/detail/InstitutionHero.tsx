'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Star,
  MapPin,
  Share2,
  Heart,
  Eye,
  MessageSquare,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';
import type { InstitutionDetail } from '../../types';
import { institutionPublicPathId } from '../../utils/public-path';
import { SafeImage } from '@/components/safe-image';
import { getInstitutionLogoFallback } from '../../utils/logo';
import {
  addFavorite,
  removeFavorite,
  getInteractionState,
} from '@/features/interaction/api/service';
import { useAuthGuard } from '@/lib/auth/auth-guard-context';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

interface InstitutionHeroProps {
  institution: InstitutionDetail;
}

export function InstitutionHero({ institution }: InstitutionHeroProps) {
  const { requireAuth } = useAuthGuard();
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    getInteractionState('INSTITUTION', institution.id)
      .then((s) => setFavorited(s.favorited))
      .catch(() => {});
  }, [institution.id]);

  const toggleFavorite = useCallback(async () => {
    setFavLoading(true);
    try {
      if (favorited) {
        await removeFavorite('INSTITUTION', institution.id);
        setFavorited(false);
        toast.success('已取消收藏');
      } else {
        await addFavorite('INSTITUTION', institution.id);
        setFavorited(true);
        toast.success('收藏成功');
      }
    } catch {
      // 错误提示已在 apiClient 中弹出
    } finally {
      setFavLoading(false);
    }
  }, [favorited, institution.id]);

  const fallbackLogo = getInstitutionLogoFallback(institution.orgName);

  return (
    <div className="flex flex-col gap-6">
      {/* Banner */}
      <div className="w-full h-48 md:h-64 rounded-xl overflow-hidden relative shadow-sm border border-slate-200">
        <SafeImage
          src={institution.bannerUrl}
          fallback="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
          alt={institution.orgName}
          width={1200}
          height={256}
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
          {/* Logo */}
          <div className="flex flex-col items-center gap-4 w-40 shrink-0">
            <div className="w-40 h-40 border border-slate-100 rounded-lg p-2 shadow-sm flex items-center justify-center">
              <SafeImage
                src={institution.logoUrl}
                fallback={fallbackLogo}
                alt={institution.orgName}
                width={160}
                height={160}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>

          {/* 右侧信息 */}
          <div className="flex-1 flex flex-col relative">
            {/* 右上角操作 */}
            <div className="absolute right-0 top-0 flex flex-col gap-3 w-[120px]">
              <button
                onClick={() => setContactOpen(true)}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2 rounded shadow-sm transition-all flex items-center justify-center gap-1 text-sm"
              >
                <MessageSquare className="size-4" /> 联系机构
              </button>
              <div className="flex items-center justify-between text-xs font-medium w-full px-1">
                <button className="flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors">
                  <Share2 className="size-3.5" /> 分享
                </button>
                <button
                  onClick={() => requireAuth(toggleFavorite)}
                  disabled={favLoading}
                  className={`flex items-center gap-1 transition-colors ${
                    favorited ? 'text-primary' : 'text-amber-500 hover:text-amber-600'
                  }`}
                >
                  <Heart className={`size-3.5 ${favorited ? 'fill-primary' : ''}`} />
                  {favorited ? '已收藏' : '收藏'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3 pr-32">
              <p className="text-xl font-bold text-slate-800">{institution.orgName}</p>
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
              {(institution.provinceName || institution.cityName) && (
                <div className="flex items-start">
                  <span className="w-20 shrink-0 text-slate-400">所在地：</span>
                  <span className="text-slate-800 inline-flex items-center gap-1">
                    <MapPin className="size-4 text-slate-400" />
                    {[institution.provinceName, institution.cityName].filter(Boolean).join(' / ')}
                  </span>
                </div>
              )}
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
                <span className="text-slate-800">{institutionPublicPathId(institution)}</span>
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

      {/* 客服中转弹窗 */}
      <AlertDialog open={contactOpen} onOpenChange={setContactOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>客服中转</AlertDialogTitle>
            <AlertDialogDescription>
              淘课网客服 021-34606062
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>知道了</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
