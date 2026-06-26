'use client';

import { Link } from '@/i18n/navigation';
import { BookOpen, Flame, Star } from 'lucide-react';
import { useBumpedViewCount } from '@/hooks/use-bumped-view-count';
import type { CourseListItem } from '../../api/types';
import { decodeHtmlEntities } from '@/lib/html-entities';
import {
  formatPlanStartDate,
  normalizeCourseDurationDays,
} from '../../utils/display';

interface OpenCourseCardProps {
  course: CourseListItem;
}

function decodeCourseTitle(title: string) {
  return decodeHtmlEntities(title);
}

function formatKeywords(keywords?: string): string[] {
  if (!keywords) return [];
  return keywords
    .split(/[,，、\s]+/)
    .map((kw) => kw.trim())
    .filter(Boolean);
}

/**
 * 公开课列表卡片 — 对齐 designs/opencourse_list.html（无封面大图，信息行列表）
 */
export function OpenCourseCard({ course }: OpenCourseCardProps) {
  const { viewCount, onCardClick } = useBumpedViewCount(course.viewCount, 'course', course.id);
  const planTime = formatPlanStartDate(course.nextPlanStartDate);
  const planCity = course.nextPlanCity?.trim() || '-';
  const durationDays = normalizeCourseDurationDays(course.durationDays, course.totalHours);
  const keywordTags = formatKeywords(course.keywords);

  return (
    <Link
      href={`/opencourse/${course.id}.htm`}
      onClick={onCardClick}
      className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group block"
    >
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
          <BookOpen className="size-6 text-slate-300" strokeWidth={1.5} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row md:items-start justify-between mb-2 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-base font-bold text-slate-800 group-hover:text-primary transition-colors line-clamp-1">
                {decodeCourseTitle(course.title)}
              </h3>
              {course.isFeatured === 1 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-primary border border-primary/30 bg-primary/5 whitespace-nowrap shrink-0">
                  推荐
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs shrink-0">
              <span className="flex items-center gap-1 text-slate-500">
                <Flame className="size-3.5 text-orange-400" />
                看过：
                <span className="text-primary font-semibold">{viewCount}</span>
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                评分：
                <span className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-3.5 ${
                        i < Math.round(course.score)
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-none text-slate-200'
                      }`}
                    />
                  ))}
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1.5 text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-md">
            <div className="flex items-center gap-1">
              <span className="text-slate-400 min-w-[60px]">开课时间：</span>
              <span className="text-slate-700">{planTime}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-400 min-w-[60px]">课程天数：</span>
              <span className="text-slate-700">
                {durationDays != null ? `${durationDays}天` : '-'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-400 min-w-[60px]">开课地点：</span>
              <span className="text-slate-700">{planCity}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-400 min-w-[60px]">授课讲师：</span>
              <span className="text-slate-700">{course.trainerName || '-'}</span>
            </div>
            <div className="flex items-center gap-1 md:col-span-2">
              <span className="text-slate-400 min-w-[60px]">课程分类：</span>
              <span className="text-slate-700">{course.categoryName || '-'}</span>
            </div>
            {keywordTags.length > 0 && (
              <div className="flex items-start gap-1 md:col-span-2">
                <span className="text-slate-400 min-w-[60px] shrink-0">关键词：</span>
                <span className="text-slate-700 line-clamp-2 min-w-0">{keywordTags.join(' ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
