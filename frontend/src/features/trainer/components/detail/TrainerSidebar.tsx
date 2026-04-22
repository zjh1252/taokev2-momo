'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Bot, Star } from 'lucide-react';
import type {
  TrainerDetail,
  RecommendedCourseItem,
  RecommendedTrainerItem,
} from '../../types';
import { getRecommendedCourses, getRecommendedTrainers } from '../../api/service';

interface TrainerSidebarProps {
  trainer: TrainerDetail;
}

/**
 * 专家详情页右侧栏
 * <p>
 * 展示「推荐课程」和「推荐相关专家」，数据由后端公开接口提供，
 * 各列表最多展示 3 条；底部保留 AI 智能匹配引导卡片。
 * </p>
 */
export function TrainerSidebar({ trainer }: TrainerSidebarProps) {
  const [recommendedCourses, setRecommendedCourses] = useState<RecommendedCourseItem[]>([]);
  const [recommendedTrainers, setRecommendedTrainers] = useState<RecommendedTrainerItem[]>([]);

  useEffect(() => {
    getRecommendedCourses(trainer.id)
      .then(setRecommendedCourses)
      .catch(() => setRecommendedCourses([]));
    getRecommendedTrainers(trainer.id)
      .then(setRecommendedTrainers)
      .catch(() => setRecommendedTrainers([]));
  }, [trainer.id]);

  return (
    <aside className="space-y-3 lg:sticky lg:top-[96px] max-h-[calc(100vh-120px)] overflow-y-auto overflow-x-hidden h-fit scrollbar-hide">
      {/* 推荐课程 */}
      {recommendedCourses.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-primary rounded-full" />
            <h3 className="font-bold text-lg">推荐课程</h3>
          </div>
          <div className="space-y-3">
            {recommendedCourses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="flex items-center gap-3 cursor-pointer group"
              >
                {course.coverUrl ? (
                  <Image
                    src={course.coverUrl}
                    alt={course.title}
                    width={56}
                    height={42}
                    className="w-14 h-[42px] object-cover rounded border border-slate-200"
                  />
                ) : (
                  <div className="w-14 h-[42px] bg-slate-100 rounded border border-slate-200" />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-900 group-hover:text-primary transition-colors text-[13px] line-clamp-2">
                    {course.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {course.viewCount ?? 0} 次浏览
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 推荐相关专家 */}
      {recommendedTrainers.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-slate-500 rounded-full" />
            <h3 className="font-bold text-lg">推荐相关专家</h3>
          </div>
          <div className="space-y-3">
            {recommendedTrainers.map((t) => (
              <Link
                key={t.id}
                href={`/trainers/${t.id}`}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <Image
                  src={t.avatar || '/statics/images/expert-main.jpg'}
                  alt={t.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-900 group-hover:text-primary transition-colors text-[13px] line-clamp-1">
                    {t.name}
                  </h4>
                  {t.title && (
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{t.title}</p>
                  )}
                </div>
                {t.score != null && t.score > 0 && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Star className="size-3 fill-[#FFD700] text-[#FFD700]" />
                    <span className="text-[11px] text-slate-700 font-bold">
                      {Number(t.score).toFixed(1)}
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* AI 智能匹配 */}
      <div className="bg-primary rounded-xl p-4 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="size-5" />
          <h3 className="font-bold text-lg">AI 智能匹配</h3>
        </div>
        <p className="text-[13px] text-white/85 mt-1 leading-relaxed">
          输入您的培训需求，AI 助手将为您精准匹配最适合的讲师和课程方案。
        </p>
        <button className="w-full mt-3 py-2 rounded-lg bg-white text-primary text-[14px] font-semibold hover:bg-white/90 transition-colors flex items-center justify-center gap-1.5">
          立即体验
        </button>
      </div>
    </aside>
  );
}
