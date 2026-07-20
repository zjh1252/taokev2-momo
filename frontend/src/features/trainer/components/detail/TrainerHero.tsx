'use client';

import { useState, useEffect, useCallback } from 'react';
import { SafeImage } from '@/components/safe-image';
import { Star, StarHalf, MessageSquare, Heart } from 'lucide-react';
import { toast } from 'sonner';
import type { TrainerDetail } from '../../types';
import {
  addFavorite,
  removeFavorite,
  getInteractionState,
} from '@/features/interaction/api/service';
import TrainerMessageDialog from '@/features/interaction/components/TrainerMessageDialog';
import { useAuthGuard } from '@/lib/auth/auth-guard-context';
import { pickDisplayTitle, plainIntroOrUndefined } from '../../utils/displayTitle';
import { getTrainerDisplayName } from '../../utils/displayName';

interface TrainerHeroProps {
  trainer: TrainerDetail;
}

function StarRating({ score }: { score: number }) {
  const fullStars = Math.floor(score);
  const hasHalf = score - fullStars >= 0.25;
  return (
    <div className="flex text-[#8A6D3B] text-[22px]">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={i} className="size-5 fill-current" />
      ))}
      {hasHalf && <StarHalf className="size-5 fill-current" />}
    </div>
  );
}

export function TrainerHero({ trainer }: TrainerHeroProps) {
  const displayName = getTrainerDisplayName(trainer);
  const displayTitle =
    pickDisplayTitle(trainer.title, displayName)
    || plainIntroOrUndefined(trainer.oneLineIntro);
  const { requireAuth } = useAuthGuard();
  const [msgOpen, setMsgOpen] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    getInteractionState('TRAINER', trainer.userId)
      .then((s) => setFavorited(s.favorited))
      .catch(() => {});
  }, [trainer.userId]);

  const toggleFavorite = useCallback(async () => {
    setFavLoading(true);
    try {
      if (favorited) {
        await removeFavorite('TRAINER', trainer.userId);
        setFavorited(false);
        toast.success('已取消收藏');
      } else {
        await addFavorite('TRAINER', trainer.userId);
        setFavorited(true);
        toast.success('收藏成功');
      }
    } catch {
      // 错误提示已在 apiClient 中弹出
    } finally {
      setFavLoading(false);
    }
  }, [favorited, trainer.userId]);

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm relative z-10 w-full mb-6 mt-6">
      <div className="p-6 lg:p-8 flex flex-col xl:flex-row gap-8 relative">
        {/* 左侧：头像与操作按钮 */}
        <div className="w-full xl:w-[220px] flex flex-col items-center shrink-0 relative">
          <div className="relative group">
            <SafeImage
              src={trainer.avatar}
              fallback={trainer.avatarFallback || undefined}
              alt={displayName}
              width={190}
              height={230}
              apiResolved
              className="w-[190px] h-[230px] object-cover border-[6px] border-white shadow-md rounded-sm transition-transform duration-300 group-hover:scale-[1.02]"
            />
            {trainer.isTrusted === 1 && (
              <div
                className="absolute -bottom-3 -right-6 border-[2px] border-primary text-primary px-3 py-1 font-black text-lg tracking-[0.2em] -rotate-[15deg] bg-white/95 shadow-sm whitespace-nowrap opacity-90 backdrop-blur-sm"
                style={{ borderStyle: 'dashed', borderRadius: '4px' }}
              >
                信得过
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 mt-6 w-[190px]">
            <button
              onClick={() => requireAuth(() => setMsgOpen(true))}
              className="w-full px-4 py-2.5 bg-primary text-white rounded flex items-center justify-center gap-1.5 hover:bg-primary/90 font-medium transition-colors whitespace-nowrap"
            >
              <MessageSquare className="size-5" /> 给专家留言
            </button>
            <div className="flex items-center gap-3 w-full justify-between">
              <button
                onClick={() => requireAuth(toggleFavorite)}
                disabled={favLoading}
                className={`flex-1 py-2 border rounded font-medium bg-white transition-all text-[13px] text-center flex items-center justify-center gap-1 ${
                  favorited
                    ? 'border-primary text-primary'
                    : 'border-slate-200 text-slate-600 hover:text-primary hover:border-primary'
                }`}
              >
                <Heart className={`size-3.5 ${favorited ? 'fill-primary' : ''}`} />
                {favorited ? '已收藏' : '收藏讲师'}
              </button>
              <button className="flex-1 py-2 border border-slate-200 rounded text-slate-600 hover:text-primary hover:border-primary font-medium bg-white transition-all text-[13px] text-center">
                加入对比
              </button>
            </div>
          </div>

          <TrainerMessageDialog
            open={msgOpen}
            onOpenChange={setMsgOpen}
            trainerUserId={trainer.userId}
            trainerName={displayName}
            onSuccess={() => toast.success('留言已提交，我们会尽快联系您！')}
          />
        </div>

        {/* 右侧：信息与操作 */}
        <div className="flex-1 pt-1 flex flex-col gap-4">
          <div className="flex flex-col xl:flex-row justify-between gap-8 h-full">
            <div className="flex flex-col gap-5 flex-1 mt-6">
              <div className="flex flex-col md:flex-row md:items-baseline gap-3 md:gap-4">
                <h1 className="text-[36px] leading-none font-extrabold text-slate-900 tracking-tight">
                  {displayName}
                </h1>
                {displayTitle ? (
                  <span className="text-[18px] text-slate-600 font-medium line-clamp-2">{displayTitle}</span>
                ) : null}
              </div>

              {/* 专家编号和驻地 */}
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-600">
                {trainer.trainerCode && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-500">专家编号:</span>
                    <span className="font-bold text-slate-800">{trainer.trainerCode}</span>
                  </div>
                )}
                {(trainer.provinceName || trainer.cityName) && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-500">专家驻地:</span>
                    <span className="text-slate-800">
                      {[trainer.provinceName, trainer.cityName].filter(Boolean).join(' ')}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-2 space-y-4">
                {/* 擅长领域 */}
                {(trainer.expertiseCategories?.length ?? 0) > 0 && (
                  <div className="flex items-center gap-4">
                    <span className="text-[14px] text-slate-600 w-[65px] font-medium shrink-0">
                      擅长领域:
                    </span>
                    <div className="flex flex-wrap gap-2.5 flex-1">
                      {trainer.expertiseCategories.map((cat, i) => (
                        <span
                          key={cat.categoryId}
                          className={`px-3.5 py-1 rounded-full text-[13px] font-medium ${
                            i === 0
                              ? 'border border-primary text-primary'
                              : 'border border-slate-200 text-slate-600 bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer'
                          }`}
                        >
                          {cat.categoryName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 擅长行业 */}
                {(trainer.industryCategories?.length ?? 0) > 0 && (
                  <div className="flex items-center gap-4">
                    <span className="text-[14px] text-slate-600 w-[65px] font-medium shrink-0">
                      擅长行业:
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {trainer.industryCategories.map((cat) => (
                        <span
                          key={cat.categoryId}
                          className="px-3.5 py-1 rounded-full border border-slate-200 text-slate-600 text-[13px] bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
                        >
                          {cat.categoryName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* 数据展示卡片 */}
          <div className="mt-auto bg-[#F4F7FE] rounded-xl px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-6 w-full">
            <div className="flex items-center gap-3">
              {trainer.score != null && trainer.score > 0 ? (
                <>
                  <StarRating score={trainer.score} />
                  <span className="text-[#002B5B] font-bold text-[22px]">
                    {trainer.score.toFixed(1)}
                  </span>
                </>
              ) : (
                <span className="text-[#002B5B] font-medium text-[16px]">暂无评分</span>
              )}
            </div>

            <div className="flex items-center gap-8 text-[#002B5B] mr-auto md:mr-0 md:ml-4">
              <div className="flex flex-col">
                <span className="text-[12px] text-slate-500 font-medium mb-1">累计咨询</span>
                <span className="font-bold text-[18px] leading-none">
                  {trainer.consultationCount || 0}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] text-slate-500 font-medium mb-1">累计曝光</span>
                <span className="font-bold text-[18px] leading-none">
                  {trainer.viewCount ? `${(trainer.viewCount / 1000).toFixed(1)}k+` : '0'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 flex-1">
              {trainer.isSigned === 1 && (
                <span className="px-3 py-1 text-[12px] bg-white border border-primary/40 text-primary rounded-full shadow-sm">
                  签约
                </span>
              )}
              {trainer.hasCopyrightCourse === 1 && (
                <span className="px-3 py-1 text-[12px] bg-white border border-primary/40 text-primary rounded-full shadow-sm">
                  版权课
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
