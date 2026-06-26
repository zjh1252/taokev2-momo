'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { getPublicReviews } from '@/features/interaction/api/service';
import type { ReviewItem } from '@/features/interaction/api/types';
import { ReviewPhotoList } from '@/features/interaction/components/ReviewPhotoList';

interface CaseReviewsPanelProps {
  caseId: number;
}

export function CaseReviewsPanel({ caseId }: CaseReviewsPanelProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getPublicReviews('CASE', { caseId, page: 0, size: 50 })
      .then((page) => {
        setReviews(page.list);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [caseId]);

  if (!loaded) {
    return <div className="text-center py-12 text-slate-400">加载中...</div>;
  }

  if (reviews.length === 0) {
    return <div className="text-center py-12 text-slate-400">暂无评价数据</div>;
  }

  const avgScore = (
    reviews.reduce((sum, r) => sum + Number(r.avgScore), 0) / reviews.length
  ).toFixed(1);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-4">
        <span className="text-2xl font-extrabold text-primary">{avgScore}</span>
        <span className="text-sm text-slate-500">综合评分 · 共 {reviews.length} 条</span>
      </div>
      {reviews.map((review) => (
        <article key={review.id} className="border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">
              {review.anonymous ? '匿名用户' : (review.submitterName || '学员')}
            </span>
            <span className="text-xs text-slate-500">
              {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex text-[#FFD700]">
              {Array.from({ length: Math.floor(Number(review.avgScore)) }).map((_, i) => (
                <Star key={i} className="size-4 fill-current" />
              ))}
            </div>
            <span className="text-[#FFD700] font-bold text-sm">{review.avgScore}</span>
          </div>
          <div className="flex gap-4 mt-1 text-xs text-slate-400">
            <span>内容 {review.ratingContent}分</span>
            <span>水平 {review.ratingTeaching}分</span>
            <span>服务 {review.ratingService}分</span>
          </div>
          <p className="text-sm text-slate-600 mt-2">{review.commentText}</p>
          <ReviewPhotoList urls={review.photoUrls} />
        </article>
      ))}
    </div>
  );
}
