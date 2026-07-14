'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { SafeImage } from '@/components/safe-image';
import { Star, StarHalf, MessageSquare, Heart, MapPin } from 'lucide-react';
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
import { getTrainerDetailTabHref } from '../../utils/routes';
import { Link } from '@/i18n/navigation';

interface TrainerHeroProps {
  trainer: TrainerDetail;
}

function StarRating({ score }: { score: number }) {
  const fullStars = Math.floor(score);
  const hasHalf = score - fullStars >= 0.25;
  return (
    <div className="flex text-[#8A6D3B] text-[22px]">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={i} className="size-4 fill-current" />
      ))}
      {hasHalf && <StarHalf className="size-4 fill-current" />}
    </div>
  );
}

function formatViewCount(viewCount: number | undefined): string {
  if (!viewCount) return '0';
  return `${(viewCount / 1000).toFixed(1)}k+`;
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
  const locationLabel = [trainer.provinceName, trainer.cityName].filter(Boolean).join(' ');

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
    <section className="relative z-10 w-full h-[322px] mb-6 overflow-hidden bg-white shadow-sm">
      <div
        className="absolute inset-y-0 left-0 z-0 overflow-hidden w-[calc((100%-min(100%,1400px))/2+24px+225px+50px)]"
        style={{
          backgroundImage:
            'linear-gradient(162.13deg, rgb(140, 20, 31) 0%, rgb(191, 31, 38) 38.9%, rgb(229, 33, 23) 70.7%)',
        }}
        aria-hidden
      >
        <Image
          src="/statics/images/trainer/hero-left-decor.png"
          alt=""
          fill
          unoptimized
          className="object-cover object-right pointer-events-none select-none"
        />
      </div>

      <div className="relative z-10 mx-auto flex h-full max-w-[1400px] flex-row px-6">
        <div className="relative flex h-full w-[225px] shrink-0 items-center">
          <div className="relative h-[256px] w-[225px] overflow-hidden border-[5px] border-white bg-slate-100">
            <SafeImage
              src={trainer.avatar}
              alt={displayName}
              width={225}
              height={256}
              apiResolved
              className="w-full h-full object-cover"
            />
          </div>
          {trainer.isTrusted === 1 && (
            <Image
              src="/statics/images/icons/trusted-xin.png"
              alt="信得过"
              width={60}
              height={60}
              className="absolute -bottom-1 -right-3 w-[60px] h-[60px] object-contain drop-shadow-md pointer-events-none select-none"
            />
          )}
        </div>

        <div className="relative ml-6 flex min-w-0 flex-1 flex-row">
          <Image
            src="/statics/images/trainer/hero-taoke-watermark.png"
            alt=""
            width={393}
            height={141}
            unoptimized
            className="absolute left-[141px] top-[93px] w-[393px] h-auto opacity-[0.05] pointer-events-none select-none"
            aria-hidden
          />

          <div className="relative z-[1] flex min-w-0 flex-1 flex-col pb-5 pt-9 pr-6">
            <div className="flex items-baseline gap-3 min-w-0">
              <h1 className="min-w-0 truncate text-[30px] font-bold leading-none text-[#0f172b] tracking-tight">
                {displayName}
              </h1>
              {displayTitle ? (
                <span
                  className="text-[12.5px] text-[#c24848] px-3 py-1 truncate max-w-[360px]"
                  style={{
                    backgroundImage:
                      'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,151,136,0.4) 20%, rgba(255,185,162,0.7) 50%, rgba(255,151,136,0.4) 80%, rgba(255,255,255,0) 100%)',
                  }}
                >
                  {displayTitle}
                </span>
              ) : null}
            </div>

            {locationLabel ? (
              <div className="mt-4 flex items-center gap-1.5 text-[10px] text-[#62748e]">
                <span className="font-medium">专家驻地：</span>
                <MapPin className="size-3 text-slate-400 shrink-0" aria-hidden />
                <span className="text-[#3f4753]">{locationLabel}</span>
              </div>
            ) : null}

            <div className="mt-3 max-h-[72px] space-y-2.5 overflow-hidden">
              {(trainer.expertiseCategories?.length ?? 0) > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#62748e] font-medium shrink-0 w-[60px]">
                    擅长领域：
                  </span>
                  <div className="flex flex-wrap gap-3.5">
                    {trainer.expertiseCategories.map((cat) => (
                      <span
                        key={cat.categoryId}
                        className="h-[23px] inline-flex items-center px-3 rounded-full border border-[#be0202] text-[10px] font-medium text-[#c31313] bg-white/20"
                      >
                        {cat.categoryName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {(trainer.industryCategories?.length ?? 0) > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#62748e] font-medium shrink-0 w-[60px]">
                    擅长行业：
                  </span>
                  <div className="flex flex-wrap gap-3.5">
                    {trainer.industryCategories.map((cat) => (
                      <span
                        key={cat.categoryId}
                        className="h-[23px] inline-flex items-center px-3 rounded-full border border-[#be0202] text-[10px] font-medium text-[#c31313] bg-white/20"
                      >
                        {cat.categoryName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto pt-3">
              <div className="bg-[rgba(245,246,248,0.92)] rounded-[13.5px] h-[80px] w-[327px] shrink-0 flex items-center justify-around px-4">
                <div className="flex flex-col items-center min-w-[54px]">
                  {trainer.score != null && trainer.score > 0 ? (
                    <>
                      <StarRating score={trainer.score} />
                      <span className="text-[#002B5B] font-bold text-[16px] mt-1">
                        {trainer.score.toFixed(1)}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[#313a47] font-semibold text-[13.5px]">暂无评分</span>
                      <span className="text-[#a8a8a8] font-bold text-[22.5px] leading-none mt-1">—</span>
                    </>
                  )}
                </div>
                <div className="flex flex-col items-center min-w-[54px]">
                  <span className="text-[#313a47] font-semibold text-[13.5px]">累计咨询</span>
                  <span className="text-[red] font-bold text-[17px] mt-1.5 leading-none">
                    {trainer.consultationCount || 0}
                  </span>
                </div>
                <div className="flex flex-col items-center min-w-[54px]">
                  <span className="text-[#313a47] font-semibold text-[13.5px]">累计曝光</span>
                  <span className="text-[red] font-bold text-[17px] mt-1.5 leading-none">
                    {formatViewCount(trainer.viewCount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-[1] flex shrink-0 flex-col items-end justify-between pb-5 pt-9">
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-[7px]">
                <button
                  type="button"
                  disabled={favLoading}
                  onClick={() => requireAuth(toggleFavorite)}
                  className={`flex items-center gap-[5px] h-[25px] w-[68px] justify-center rounded border border-[#bfbfbf] bg-[#f4f7fe] text-[13.5px] font-semibold ${
                    favorited ? 'text-primary border-primary' : 'text-[#979fac]'
                  }`}
                >
                  <Heart className={`size-3 ${favorited ? 'fill-primary text-primary' : ''}`} />
                  {favorited ? '已收藏' : '收藏'}
                </button>
                <Link
                  href={getTrainerDetailTabHref(trainer.id, 'comments')}
                  className="flex items-center gap-[5px] h-[25px] w-[68px] justify-center rounded border border-[#bfbfbf] bg-[#f4f7fe] text-[13.5px] font-semibold text-[#979fac]"
                >
                  <Image
                    src="/statics/images/icons/trainer-hero-review.png"
                    alt=""
                    width={10}
                    height={10}
                    unoptimized
                    className="size-2.5 object-contain"
                  />
                  评价
                </Link>
                <button
                  type="button"
                  aria-disabled="true"
                  className="flex items-center gap-[5px] h-[25px] w-[68px] justify-center rounded border border-[#bfbfbf] bg-[#f4f7fe] text-[13.5px] font-semibold text-[#979fac]"
                >
                  <Image
                    src="/statics/images/icons/trainer-hero-contact.png"
                    alt=""
                    width={10}
                    height={10}
                    unoptimized
                    className="size-2.5 object-contain"
                  />
                  联系
                </button>
              </div>
              <button
                type="button"
                aria-disabled="true"
                className="h-[25px] w-[79px] rounded border border-[#bfbfbf] text-[13.5px] font-medium text-[#979fac]"
              >
                下载简历
              </button>
            </div>

            <button
              type="button"
              onClick={() => requireAuth(() => setMsgOpen(true))}
              className="h-[52px] w-[194px] shrink-0 rounded bg-[#be0000] text-white text-[13.5px] font-semibold flex items-center justify-center gap-2.5 hover:bg-[#be0000]/90"
            >
              <MessageSquare className="size-3.5" />
              给专家留言
            </button>
          </div>
        </div>
      </div>

      <TrainerMessageDialog
        open={msgOpen}
        onOpenChange={setMsgOpen}
        trainerUserId={trainer.userId}
        trainerName={displayName}
        onSuccess={() => toast.success('留言已提交，我们会尽快联系您！')}
      />
    </section>
  );
}
