'use client';

import { Link } from '@/i18n/navigation';
import { BookOpen, Flame, Star } from 'lucide-react';
import { useBumpedViewCount } from '@/hooks/use-bumped-view-count';
import type { CourseListItem } from '../../api/types';
import { decodeHtmlEntities } from '@/lib/html-entities';
import { normalizeCourseDurationDays } from '../../utils/display';

interface InnerCourseCardProps {
  course: CourseListItem;
}

function decodeCourseTitle(title: string) {
  return decodeHtmlEntities(title);
}

function formatKeywords(keywords?: string): string {
  if (!keywords?.trim()) return '-';
  return keywords
    .split(/[,，、\s]+/)
    .map((kw) => kw.trim())
    .filter(Boolean)
    .join(' ');
}

function formatTrainerLocation(course: CourseListItem): string {
  const parts = [course.trainerProvinceName, course.trainerCityName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : '-';
}

/**
 * 内训课列表卡片 — 对齐 designs/innercourse_list.html
 */
export function InnerCourseCard({ course }: InnerCourseCardProps) {
  const { viewCount, onCardClick } = useBumpedViewCount(course.viewCount, 'course', course.id);
  const durationDays = normalizeCourseDurationDays(course.durationDays, course.totalHours);
  const keywordText = formatKeywords(course.keywords);

  return (
    <Link
      href={`/inhousecourse/${course.id}.htm`}
      onClick={onCardClick}
      className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group block"
    >
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
          <BookOpen className="size-6 text-slate-300" strokeWidth={1.5} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row md:items-start justify-between mb-2 gap-2">
            <h3 className="text-base font-bold text-slate-800 group-hover:text-primary transition-colors line-clamp-1 min-w-0">
              {decodeCourseTitle(course.title)}
            </h3>
            <div className="flex items-center gap-4 text-xs shrink-0">
              <span className="flex items-center gap-1 text-slate-500">
                <Flame className="size-3.5 text-orange-400" />
                人气：
                <span className="text-primary font-semibold">{viewCount}</span>
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                课程评分：
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1.5 text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-md mb-2">
            <div className="flex items-center gap-1">
              <span className="text-slate-400 min-w-[60px]">授课讲师：</span>
              <span className="text-slate-700">{course.trainerName || '-'}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-400 min-w-[60px]">确定天数：</span>
              <span className="text-slate-700">
                {durationDays != null ? `${durationDays}天` : '-'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-400 min-w-[60px]">讲师常驻地：</span>
              <span className="text-slate-700">{formatTrainerLocation(course)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-400 min-w-[60px]">课程分类：</span>
              <span className="text-slate-700">{course.categoryName || '-'}</span>
            </div>
          </div>

          <div className="text-xs text-slate-400">关键字：{keywordText}</div>
        </div>
      </div>
    </Link>
  );
}
