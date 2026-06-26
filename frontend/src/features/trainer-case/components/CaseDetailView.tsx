'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, Eye, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { LegacyRichText } from '@/components/legacy-rich-text';
import { SafeImage } from '@/components/safe-image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import {
  addFavorite,
  getInteractionState,
  removeFavorite,
} from '@/features/interaction/api/service';
import { useAuthGuard } from '@/lib/auth/auth-guard-context';
import type { TrainerCase } from '../api/types';
import { CaseReviewsPanel } from './CaseReviewsPanel';

interface CaseDetailViewProps {
  caseData: TrainerCase;
  trainerName: string;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function collectCaseImages(caseData: TrainerCase): string[] {
  const urls: string[] = [];
  const add = (url?: string | null) => {
    const u = url?.trim();
    if (u && !urls.includes(u)) urls.push(u);
  };
  add(caseData.coverImage);
  for (const f of caseData.files) {
    if (f.fileType === 1) add(f.thumbnailUrl || f.fileUrl);
  }
  return urls;
}

function CaseImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api || images.length <= 1) return;
    const timer = setInterval(() => api.scrollNext(), 5000);
    return () => clearInterval(timer);
  }, [api, images.length]);

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="relative h-56 md:h-80 w-full rounded-lg overflow-hidden border border-slate-100">
        <SafeImage src={images[0]} alt={alt} fill className="object-cover" />
      </div>
    );
  }

  return (
    <Carousel setApi={setApi} className="w-full">
      <CarouselContent>
        {images.map((src, idx) => (
          <CarouselItem key={`${src}-${idx}`}>
            <div className="relative h-56 md:h-80 w-full rounded-lg overflow-hidden border border-slate-100">
              <SafeImage src={src} alt={`${alt} ${idx + 1}`} fill className="object-cover" />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-3 border-white/80 bg-white/90 shadow-md" />
      <CarouselNext className="right-3 border-white/80 bg-white/90 shadow-md" />
    </Carousel>
  );
}

export function CaseDetailView({ caseData, trainerName }: CaseDetailViewProps) {
  const { requireAuth } = useAuthGuard();
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const images = useMemo(() => collectCaseImages(caseData), [caseData]);

  const hasSupplementaryInfo =
    Boolean(caseData.enterpriseName?.trim())
    || Boolean(caseData.industry?.trim())
    || Boolean(caseData.trainingDate)
    || Boolean(caseData.trainingAddress?.trim())
    || caseData.traineeCount != null;

  useEffect(() => {
    getInteractionState('CASE', caseData.id)
      .then((s) => setFavorited(s.favorited))
      .catch(() => {});
  }, [caseData.id]);

  const toggleFavorite = useCallback(async () => {
    setFavLoading(true);
    try {
      if (favorited) {
        await removeFavorite('CASE', caseData.id);
        setFavorited(false);
        toast.success('已取消收藏');
      } else {
        await addFavorite('CASE', caseData.id);
        setFavorited(true);
        toast.success('收藏成功');
      }
    } catch {
      // 错误提示已在 apiClient 中弹出
    } finally {
      setFavLoading(false);
    }
  }, [caseData.id, favorited]);

  return (
    <article className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 md:p-8 space-y-8">
        <header className="text-center space-y-3">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            {caseData.caseTitle}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-slate-500">
            <span>
              服务讲师：
              <Link
                href={`/trainer/${caseData.trainerId}.htm`}
                className="text-primary hover:underline font-medium ml-1"
              >
                {trainerName}
              </Link>
            </span>
            {caseData.viewCount != null && caseData.viewCount > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3.5" />
                浏览 {caseData.viewCount} 次
              </span>
            ) : null}
          </div>
        </header>

        <CaseImageGallery images={images} alt={caseData.caseTitle} />

        {hasSupplementaryInfo ? (
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              案例信息
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">客户企业</dt>
                <dd className="font-medium text-slate-800 mt-1">{caseData.enterpriseName || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">所属行业</dt>
                <dd className="font-medium text-slate-800 mt-1">{caseData.industry || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">培训时间</dt>
                <dd className="font-medium text-slate-800 mt-1">{formatDate(caseData.trainingDate)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">培训地点</dt>
                <dd className="font-medium text-slate-800 mt-1">{caseData.trainingAddress || '—'}</dd>
              </div>
              {caseData.traineeCount != null ? (
                <div>
                  <dt className="text-slate-500">参训人数</dt>
                  <dd className="font-medium text-slate-800 mt-1">{caseData.traineeCount} 人</dd>
                </div>
              ) : null}
            </dl>
          </section>
        ) : null}

        {caseData.trainingTopic ? (
          <section>
            <h3 className="text-base font-bold text-slate-900 mb-3">培训主题</h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {caseData.trainingTopic}
            </p>
          </section>
        ) : null}

        {caseData.trainingEffect ? (
          <section>
            <h3 className="text-base font-bold text-slate-900 mb-3">培训效果</h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {caseData.trainingEffect}
            </p>
          </section>
        ) : null}

        {caseData.description ? (
          <section>
            <h3 className="text-base font-bold text-slate-900 mb-3">案例详情</h3>
            <LegacyRichText content={caseData.description} className="text-sm" />
          </section>
        ) : null}

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
            学员评价
          </h2>
          <CaseReviewsPanel caseId={caseData.id} />
        </section>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          <Link
            href={`/trainer/${caseData.trainerId}.htm`}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg text-slate-700 hover:border-primary hover:text-primary transition-colors"
          >
            <ArrowLeft className="size-4" />
            返回专家主页
          </Link>
          <button
            type="button"
            onClick={() => requireAuth(toggleFavorite)}
            disabled={favLoading}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${
              favorited
                ? 'border-primary text-primary bg-primary/5'
                : 'border-slate-200 text-slate-700 hover:border-primary hover:text-primary'
            }`}
          >
            <Heart className={`size-4 ${favorited ? 'fill-primary' : ''}`} />
            {favorited ? '已收藏' : '收藏案例'}
          </button>
        </div>
      </div>
    </article>
  );
}
