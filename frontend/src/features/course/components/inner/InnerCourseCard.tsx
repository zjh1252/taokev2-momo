'use client';

import { Link } from '@/i18n/navigation';
import { CourseListCoverThumb } from '@/components/course-list-cover-thumb';
import { Flame, Star } from 'lucide-react';
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

/** 与「专家常驻地：」等最长标签同宽，保证各行取值左对齐 */
const FIELD_LABEL_CLASS = 'text-slate-400 shrink-0 w-[4.5rem]';

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
        <CourseListCoverThumb coverUrl={course.coverUrl} alt={course.title} />

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
                <span className="text-primary font-semibold tabular-nums">
                  {(course.score ?? 0).toFixed(1)}
                </span>
                <span className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const score = course.score ?? 0;
                    const filled = i < Math.floor(score) || (i === Math.floor(score) && score - Math.floor(score) >= 0.5);
                    return (
                      <Star
                        key={i}
                        className={`size-3.5 ${
                          filled ? 'fill-amber-400 text-amber-400' : 'fill-none text-slate-200'
                        }`}
                      />
                    );
                  })}
                </span>
              </span>
            </div>
          </div>

          <div className="bg-slate-50/50 p-2.5 rounded-md mb-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-1 min-w-0">
                <span className={FIELD_LABEL_CLASS}>授课专家：</span>
                <span className="text-slate-700 truncate">{course.trainerName || '-'}</span>
              </div>
              <div className="flex items-center gap-1 min-w-0">
                <span className={FIELD_LABEL_CLASS}>培训天数：</span>
                <span className="text-slate-700">
                  {durationDays != null ? `${durationDays}天` : '-'}
                </span>
              </div>
              <div className="flex items-center gap-1 min-w-0">
                <span className={FIELD_LABEL_CLASS}>专家常驻地：</span>
                <span className="text-slate-700 truncate">{formatTrainerLocation(course)}</span>
              </div>
              <div className="flex items-center gap-1 min-w-0">
                <span className={FIELD_LABEL_CLASS}>课程分类：</span>
                <span className="text-slate-700 truncate">{course.categoryName || '-'}</span>
              </div>
            </div>
            <div className="flex items-start gap-1 mt-1.5 text-xs min-w-0">
              <span className={FIELD_LABEL_CLASS}>关键词：</span>
              <span className="text-slate-700 line-clamp-2 min-w-0 flex-1">{keywordText}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
