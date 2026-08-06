'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { SafeImage } from '@/components/safe-image';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import {
  Download,
  Heart,
  MapPin,
  MessageSquare,
  Star,
  StarHalf,
} from 'lucide-react';
import { toast } from 'sonner';
import type { TrainerDetail } from '../../types';
import {
  addFavorite,
  getInteractionState,
  removeFavorite,
} from '@/features/interaction/api/service';
import TrainerMessageDialog from '@/features/interaction/components/TrainerMessageDialog';
import { useAuthGuard } from '@/lib/auth/auth-guard-context';
import { pickDisplayTitle, plainIntroOrUndefined } from '../../utils/displayTitle';
import { getTrainerDisplayName } from '../../utils/displayName';
import { getTrainerDetailTabHref } from '../../utils/routes';
import { readTrainerListReturnPath, rememberTrainerListPath } from '../../utils/list-return';
import { Link } from '@/i18n/navigation';

interface TrainerHeroProps {
  trainer: TrainerDetail;
  trainerListReturnPath?: string | null;
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

function StatBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-center">
      <span className="flex h-[22px] items-center text-[15px] font-semibold leading-none text-[#313a47]">
        {label}
      </span>
      <div className="mt-3 flex h-[28px] items-center justify-center">{children}</div>
    </div>
  );
}

export function TrainerHero({ trainer, trainerListReturnPath }: TrainerHeroProps) {
  const displayName = getTrainerDisplayName(trainer);
  const displayTitle =
    pickDisplayTitle(trainer.title, displayName) ||
    plainIntroOrUndefined(trainer.oneLineIntro);
  const { requireAuth } = useAuthGuard();
  const [msgOpen, setMsgOpen] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [trainerListHref, setTrainerListHref] = useState(trainerListReturnPath ?? '/trainer');
  const locationLabel = [trainer.provinceName, trainer.cityName].filter(Boolean).join(' ');

  useEffect(() => {
    getInteractionState('TRAINER', trainer.userId)
      .then((s) => setFavorited(s.favorited))
      .catch(() => {});
  }, [trainer.userId]);

  useEffect(() => {
    if (trainerListReturnPath) {
      setTrainerListHref(trainerListReturnPath);
      rememberTrainerListPath(trainerListReturnPath);
      return;
    }
    setTrainerListHref(readTrainerListReturnPath('/trainer'));
  }, [trainerListReturnPath]);

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
      // API 层已经统一弹出错误提示。
    } finally {
      setFavLoading(false);
    }
  }, [favorited, trainer.userId]);

  return (
    <section className="relative z-10 mx-auto w-full max-w-[1400px] px-6 pt-6">
      <div className="mb-3">
        <PageBreadcrumb
          showPrefix={false}
          includeHome={false}
          items={[
            { label: '培训专家', href: trainerListHref },
            { label: displayName },
          ]}
        />
      </div>
      <div className="relative overflow-hidden rounded-t-xl border border-b-0 border-slate-200 bg-white shadow-sm">
        <Image
          src="/statics/images/trainer/hero-taoke-watermark.png"
          alt=""
          width={680}
          height={243}
          unoptimized
          className="pointer-events-none absolute left-[35%] top-1/2 hidden -translate-y-1/2 select-none opacity-45 lg:block"
          style={{ width: '52%', maxWidth: 680, height: 'auto' }}
          aria-hidden
        />

        <div className="relative z-[1] flex min-h-[392px] flex-col gap-8 px-6 py-8 lg:flex-row lg:items-center lg:gap-16 lg:px-14 lg:py-10 xl:gap-[82px] xl:pl-[82px] xl:pr-[54px]">
          <div className="flex shrink-0 justify-center lg:w-[220px] xl:w-[240px]">
            <div className="relative">
              <div className="relative h-[220px] w-[192px] overflow-hidden bg-slate-100 lg:h-[238px] lg:w-[208px]">
                <SafeImage
                  src={trainer.avatar}
                  alt={displayName}
                  width={208}
                  height={238}
                  apiResolved
                  className="h-full w-full object-cover"
                />
              </div>
              {trainer.isTrusted === 1 && (
                <Image
                  src="/statics/images/icons/trusted-xin.png"
                  alt="值得信"
                  width={64}
                  height={64}
                  unoptimized
                  className="pointer-events-none absolute -bottom-5 -right-7 z-10 h-16 w-16 select-none object-contain drop-shadow-md"
                />
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-8 xl:flex-row xl:items-stretch xl:justify-between xl:gap-8">
            <div className="flex min-w-0 flex-1 flex-col pt-1 xl:pt-4">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                <h1 className="shrink-0 text-[34px] font-bold leading-none text-[#0f172b] lg:text-[38px]">
                  {displayName}
                </h1>
                {displayTitle ? (
                  <span
                    className="max-w-full truncate px-3 py-1 text-[15px] leading-none text-[#c24848] sm:max-w-[360px]"
                    style={{
                      backgroundImage:
                        'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,151,136,0.35) 22%, rgba(255,185,162,0.62) 50%, rgba(255,151,136,0.35) 78%, rgba(255,255,255,0) 100%)',
                    }}
                  >
                    {displayTitle}
                  </span>
                ) : null}
              </div>

              <div className="mt-12 space-y-7 lg:mt-14">
                {locationLabel ? (
                  <div className="flex items-center gap-3 text-[15px] text-[#62748e]">
                    <span className="w-[80px] shrink-0 font-medium">专家驻地：</span>
                    <MapPin className="size-5 shrink-0 text-slate-400" aria-hidden />
                    <span className="text-[#3f4753]">{locationLabel}</span>
                  </div>
                ) : null}

                {(trainer.expertiseCategories?.length ?? 0) > 0 && (
                  <div className="flex items-start gap-3">
                    <span className="mt-1 w-[80px] shrink-0 text-[15px] font-medium text-[#62748e]">
                      擅长领域：
                    </span>
                    <div className="flex min-w-0 flex-wrap gap-3">
                      {trainer.expertiseCategories.map((cat) => (
                        <span
                          key={cat.categoryId}
                          className="inline-flex h-[30px] items-center rounded-full border border-[#d70000] bg-white px-3.5 text-[14px] font-medium text-[#d70000]"
                        >
                          {cat.categoryName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(trainer.industryCategories?.length ?? 0) > 0 && (
                  <div className="flex items-start gap-3">
                    <span className="mt-1 w-[80px] shrink-0 text-[15px] font-medium text-[#62748e]">
                      擅长行业：
                    </span>
                    <div className="flex min-w-0 flex-wrap gap-3">
                      {trainer.industryCategories.map((cat) => (
                        <span
                          key={cat.categoryId}
                          className="inline-flex h-[30px] items-center rounded-full border border-[#d70000] bg-white px-3.5 text-[14px] font-medium text-[#d70000]"
                        >
                          {cat.categoryName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex w-full shrink-0 flex-col items-stretch xl:w-[384px]">
              <div className="flex w-full flex-nowrap items-center justify-between">
                <button
                  type="button"
                  aria-disabled="true"
                  className="flex h-[34px] w-[92px] cursor-pointer items-center justify-center gap-1.5 rounded border border-[#bfc5cf] bg-[#f6f8fc] text-[15px] font-semibold text-[#979fac] hover:border-primary/40 hover:text-primary"
                >
                  <Download className="size-4" />
                  下载简历
                </button>
                <button
                  type="button"
                  disabled={favLoading}
                  onClick={() => requireAuth(toggleFavorite)}
                  className={`flex h-[34px] w-[82px] cursor-pointer items-center justify-center gap-1.5 rounded border border-[#bfc5cf] bg-[#f6f8fc] text-[15px] font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
                    favorited ? 'border-primary text-primary' : 'text-[#979fac]'
                  }`}
                >
                  <Heart className={`size-4 ${favorited ? 'fill-primary text-primary' : ''}`} />
                  {favorited ? '已收藏' : '收藏'}
                </button>
                <Link
                  href={getTrainerDetailTabHref(trainer.id, 'comments', trainerListHref)}
                  className="flex h-[34px] w-[82px] cursor-pointer items-center justify-center gap-1.5 rounded border border-[#bfc5cf] bg-[#f6f8fc] text-[15px] font-semibold text-[#979fac] hover:border-primary/40 hover:text-primary"
                >
                  <Image
                    src="/statics/images/icons/trainer-hero-review.png"
                    alt="评价"
                    width={13}
                    height={13}
                    unoptimized
                    className="size-[13px] object-contain"
                  />
                  评价
                </Link>
                <button
                  type="button"
                  aria-disabled="true"
                  className="flex h-[34px] w-[82px] cursor-pointer items-center justify-center gap-1.5 rounded border border-[#bfc5cf] bg-[#f6f8fc] text-[15px] font-semibold text-[#979fac] hover:border-primary/40 hover:text-primary"
                >
                  <Image
                    src="/statics/images/icons/trainer-hero-contact.png"
                    alt="联系专家"
                    width={13}
                    height={13}
                    unoptimized
                    className="size-[13px] object-contain"
                  />
                  联系
                </button>
              </div>

              <div className="mt-16 grid h-[86px] grid-cols-3 rounded-[14px] bg-[#f4f6fa] px-10">
                <StatBlock label={trainer.score != null && trainer.score > 0 ? trainer.score.toFixed(1) : '暂无评分'}>
                  {trainer.score != null && trainer.score > 0 ? (
                    <StarRating score={trainer.score} />
                  ) : (
                    <span className="text-[28px] font-bold leading-none text-[#a8a8a8]">—</span>
                  )}
                </StatBlock>
                <StatBlock label="累计咨询">
                  <span className="text-[24px] font-bold leading-none text-[#e60000]">
                    {trainer.consultationCount || 0}
                  </span>
                </StatBlock>
                <StatBlock label="累计曝光">
                  <span className="text-[24px] font-bold leading-none text-[#e60000]">
                    {formatViewCount(trainer.viewCount)}
                  </span>
                </StatBlock>
              </div>

              <button
                type="button"
                onClick={() => requireAuth(() => setMsgOpen(true))}
                className="mt-[30px] flex h-[60px] w-full shrink-0 cursor-pointer items-center justify-center gap-2.5 rounded-[10px] bg-[#d00000] text-[17px] font-semibold text-white hover:bg-[#be0000]"
              >
                <MessageSquare className="size-5" />
                给专家留言
              </button>
            </div>
          </div>
        </div>
      </div>

      <TrainerMessageDialog
        open={msgOpen}
        onOpenChange={setMsgOpen}
        trainerUserId={trainer.userId}
        trainerName={displayName}
        onSuccess={() => toast.success('留言已提交，我们会尽快联系您')}
      />
    </section>
  );
}
