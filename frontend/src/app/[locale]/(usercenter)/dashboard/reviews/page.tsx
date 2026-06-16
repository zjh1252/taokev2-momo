'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star } from 'lucide-react';
import { getMyReviews } from '@/features/interaction/api/service';
import type { ReviewItem } from '@/features/interaction/api/types';

const STATUS_MAP: Record<number, { text: string; cls: string }> = {
  0: { text: '待审核', cls: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  1: { text: '已通过', cls: 'text-green-600 bg-green-50 border-green-200' },
  [-1]: { text: '已驳回', cls: 'text-red-600 bg-red-50 border-red-200' },
  2: { text: '已隐藏', cls: 'text-gray-600 bg-gray-50 border-gray-200' },
};

function reviewScopeLabel(scope: string) {
  if (scope === 'COURSE') return '课程';
  if (scope === 'INSTITUTION') return '机构';
  return '专家';
}

/**
 * 我的点评 — 仅展示用户已发表的评价。
 *
 * <p>「去评价」入口已移除：评价均通过课程详情 / 专家详情 / 我的学习入口主动提交。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const page = await getMyReviews(0, 50);
      setReviews(page.list);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
      <div className="px-6 border-b border-slate-200 flex gap-8">
        <span className="py-4 text-[15px] text-primary font-bold border-b-2 border-primary">
          我的评价
        </span>
      </div>

      <div className="p-6 space-y-4">
        {loading && (
          <div className="text-center text-gray-400 py-12">加载中...</div>
        )}
        {!loading && reviews.length === 0 && (
          <div className="text-center text-gray-400 py-12">暂无评价记录</div>
        )}
        {!loading &&
          reviews.map((r) => {
            const statusInfo = STATUS_MAP[r.status] ?? STATUS_MAP[0];
            return (
              <div key={r.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {reviewScopeLabel(r.reviewScope)}：{r.courseTitle || r.expertName || '--'}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded border ${statusInfo.cls}`}
                  >
                    {statusInfo.text}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <div className="flex text-[#FFD700]">
                    {Array.from({ length: Math.floor(Number(r.avgScore)) }).map((_, i) => (
                      <Star key={i} className="size-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm text-[#FFD700] font-bold">{r.avgScore}</span>
                </div>
                <p className="text-sm mt-2 text-slate-600">{r.commentText}</p>
                <div className="text-xs text-gray-400 mt-2">
                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}
