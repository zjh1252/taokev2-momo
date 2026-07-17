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
    <div className="flex gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={i} className="size-4 fill-[#FFD700] text-[#FFD700]" />
      ))}
      {hasHalf && <StarHalf className="size-4 fill-[#FFD700] text-[#FFD700]" />}
    </div>
  );
}

function formatViewCount(viewCount: number | undefined): string {
  if (!viewCount) return '0';
  return `${(viewCount / 1000).toFixed(1)}k+`;
}

/** 已备抠图素材的专家：透明底、贴卡片底、放大展示（图2） */
const TRAINER_CUTOUT_SRC: Record<number, string> = {
  75587: '/statics/images/trainer/trainer-cutout-liuxuefeng.png?v=2',
};

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
  const cutoutSrc = TRAINER_CUTOUT_SRC[trainer.id];
  const useCutout = Boolean(cutoutSrc);
  const photoColWidth = useCutout ? 350 : 280;

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
    <section className="relative z-10 w-full h-[420px] mb-6 overflow-hidden bg-white shadow-sm">
      <div
        className="absolute inset-y-0 left-0 z-0 overflow-hidden"
        style={{
          width: `calc((100% - min(100%, 1400px)) / 2 + 84px + ${photoColWidth}px + 96px)`,
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
          className="object-cover object-right object-bottom pointer-events-none select-none"
        />
      </div>

      <div className="relative z-10 mx-auto flex h-full max-w-[1400px] flex-row pl-[84px] pr-6">
        <div
          className="relative flex h-full shrink-0"
          style={{ width: photoColWidth }}
        >
          {useCutout ? (
            <div className="relative h-full w-full">
              <Image
                src={cutoutSrc!}
                alt={displayName}
                width={304}
                height={370}
                unoptimized
                priority
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[370px] w-auto max-w-none object-contain object-bottom pointer-events-none select-none"
              />
              {trainer.isTrusted === 1 && (
                <Image
                  src="/statics/images/icons/trusted-xin.png"
                  alt="信得过"
                  width={72}
                  height={72}
                  unoptimized
                  className="absolute bottom-8 -right-2 z-10 w-[72px] h-[72px] object-contain drop-shadow-md pointer-events-none select-none"
                />
              )}
            </div>
          ) : (
            <div className="relative flex h-full w-full items-center">
              <div className="relative">
                <div className="relative h-[320px] w-[280px] overflow-hidden border-[5px] border-white bg-slate-100">
                  <SafeImage
                    src={trainer.avatar}
                    alt={displayName}
                    width={280}
                    height={320}
                    apiResolved
                    className="w-full h-full object-cover"
                  />
                </div>
                {trainer.isTrusted === 1 && (
                  <Image
                    src="/statics/images/icons/trusted-xin.png"
                    alt="信得过"
                    width={72}
                    height={72}
                    unoptimized
                    className="absolute -bottom-7 -right-[52px] z-10 w-[72px] h-[72px] object-contain drop-shadow-md pointer-events-none select-none"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative ml-36 flex min-w-0 flex-1 flex-row">
          <Image
            src="/statics/images/trainer/hero-taoke-watermark.png"
            alt=""
            width={560}
            height={200}
            unoptimized
            className="absolute right-0 top-1/2 -translate-y-1/2 w-[560px] h-auto pointer-events-none select-none"
            aria-hidden
          />

          <div className="relative z-[1] flex min-w-0 flex-1 flex-col pb-7 pt-11 pr-6">
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="min-w-0 truncate text-[38px] font-bold leading-none text-[#0f172b] tracking-tight">
                {displayName}
              </h1>
              {displayTitle ? (
                <span
                  className="text-[15px] text-[#c24848] px-3 py-1 truncate max-w-[360px] leading-none"
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
              <div className="mt-7 flex items-center gap-1.5 text-[15px] text-[#62748e]">
                <span className="font-medium">专家驻地：</span>
                <MapPin className="size-4 text-slate-400 shrink-0" aria-hidden />
                <span className="text-[#3f4753]">{locationLabel}</span>
              </div>
            ) : null}

            <div className="mt-6 max-h-[130px] space-y-5 overflow-hidden">
              {(trainer.expertiseCategories?.length ?? 0) > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[15px] text-[#62748e] font-medium shrink-0 w-[80px]">
                    擅长领域：
                  </span>
                  <div className="flex flex-wrap gap-3.5">
                    {trainer.expertiseCategories.map((cat) => (
                      <span
                        key={cat.categoryId}
                        className="h-[28px] inline-flex items-center px-3.5 rounded-full border border-[#be0202] text-[13px] font-medium text-[#c31313] bg-white/20"
                      >
                        {cat.categoryName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {(trainer.industryCategories?.length ?? 0) > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[15px] text-[#62748e] font-medium shrink-0 w-[80px]">
                    擅长行业：
                  </span>
                  <div className="flex flex-wrap gap-3.5">
                    {trainer.industryCategories.map((cat) => (
                      <span
                        key={cat.categoryId}
                        className="h-[28px] inline-flex items-center px-3.5 rounded-full border border-[#be0202] text-[13px] font-medium text-[#c31313] bg-white/20"
                      >
                        {cat.categoryName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto pt-4">
              <div className="bg-[rgba(245,246,248,0.92)] rounded-[13.5px] h-[100px] w-[440px] shrink-0 flex items-center justify-between px-10">
                <div className="flex flex-col items-center min-w-[72px]">
                  {trainer.score != null && trainer.score > 0 ? (
                    <>
                      <span className="flex h-[22px] items-center text-[#002B5B] font-bold text-[18px] leading-none">
                        {trainer.score.toFixed(1)}
                      </span>
                      <div className="mt-1.5 flex h-[24px] items-center">
                        <StarRating score={trainer.score} />
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="flex h-[22px] items-center text-[#313a47] font-semibold text-[15px] leading-none">
                        暂无评分
                      </span>
                      <span className="mt-1.5 flex h-[24px] items-center text-[#a8a8a8] font-bold text-[24px] leading-none">
                        —
                      </span>
                    </>
                  )}
                </div>
                <div className="flex flex-col items-center min-w-[72px]">
                  <span className="flex h-[22px] items-center text-[#313a47] font-semibold text-[15px] leading-none">
                    累计咨询
                  </span>
                  <span className="mt-1.5 flex h-[24px] items-center text-[red] font-bold text-[24px] leading-none">
                    {trainer.consultationCount || 0}
                  </span>
                </div>
                <div className="flex flex-col items-center min-w-[72px]">
                  <span className="flex h-[22px] items-center text-[#313a47] font-semibold text-[15px] leading-none">
                    累计曝光
                  </span>
                  <span className="mt-1.5 flex h-[24px] items-center text-[red] font-bold text-[24px] leading-none">
                    {formatViewCount(trainer.viewCount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-[1] flex shrink-0 flex-col items-end justify-between pb-7 pt-11">
            <div className="flex flex-col items-end gap-4">
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  disabled={favLoading}
                  onClick={() => requireAuth(toggleFavorite)}
                  className={`flex items-center gap-1.5 h-[30px] w-[78px] justify-center rounded border border-[#bfbfbf] bg-[#f4f7fe] text-[15px] font-semibold ${
                    favorited ? 'text-primary border-primary' : 'text-[#979fac]'
                  }`}
                >
                  <Heart className={`size-3.5 ${favorited ? 'fill-primary text-primary' : ''}`} />
                  {favorited ? '已收藏' : '收藏'}
                </button>
                <Link
                  href={getTrainerDetailTabHref(trainer.id, 'comments')}
                  className="flex items-center gap-1.5 h-[30px] w-[78px] justify-center rounded border border-[#bfbfbf] bg-[#f4f7fe] text-[15px] font-semibold text-[#979fac]"
                >
                  <Image
                    src="/statics/images/icons/trainer-hero-review.png"
                    alt=""
                    width={12}
                    height={12}
                    unoptimized
                    className="size-3 object-contain"
                  />
                  评价
                </Link>
                <button
                  type="button"
                  aria-disabled="true"
                  className="flex items-center gap-1.5 h-[30px] w-[78px] justify-center rounded border border-[#bfbfbf] bg-[#f4f7fe] text-[15px] font-semibold text-[#979fac]"
                >
                  <Image
                    src="/statics/images/icons/trainer-hero-contact.png"
                    alt=""
                    width={12}
                    height={12}
                    unoptimized
                    className="size-3 object-contain"
                  />
                  联系
                </button>
              </div>
              <button
                type="button"
                aria-disabled="true"
                className="h-[30px] w-[90px] rounded border border-[#bfbfbf] text-[15px] font-medium text-[#979fac]"
              >
                下载简历
              </button>
            </div>

            <button
              type="button"
              onClick={() => requireAuth(() => setMsgOpen(true))}
              className="h-[58px] w-[220px] shrink-0 rounded bg-[#be0000] text-white text-[16px] font-semibold flex items-center justify-center gap-2.5 hover:bg-[#be0000]/90"
            >
              <MessageSquare className="size-4" />
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
