import { Link } from '@/i18n/navigation';
import { Flame, Star, BookOpen } from 'lucide-react';
import type { CourseListItem } from '../../api/types';

interface InnerCourseCardProps {
  course: CourseListItem;
}

export function InnerCourseCard({ course }: InnerCourseCardProps) {
  return (
    <Link
      href={`/innercourses/${course.id}`}
      className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group flex gap-4"
    >
      {/* 左侧图标 */}
      <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
        {course.coverUrl ? (
          <img
            src={course.coverUrl}
            alt={course.title}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <BookOpen className="size-6 text-slate-300" />
        )}
      </div>

      {/* 右侧信息 */}
      <div className="flex-1 min-w-0">
        {/* 标题行 + 指标 */}
        <div className="flex items-start justify-between mb-2 gap-2">
          <h3 className="text-base font-bold text-slate-800 group-hover:text-primary transition-colors line-clamp-1">
            {course.title}
          </h3>
          <div className="flex items-center gap-4 text-xs shrink-0">
            <span className="flex items-center gap-1 text-slate-500">
              <Flame className="size-3.5 text-orange-400" />
              人气：<span className="text-primary font-semibold">{course.viewCount}</span>
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

        {/* 信息网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1.5 text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-md mb-2">
          <div className="flex items-center gap-1">
            <span className="text-slate-400 min-w-[72px]">授课讲师：</span>
            <span className="text-slate-700">{course.trainerName || '-'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400 min-w-[72px]">确定天数：</span>
            <span className="text-slate-700">
              {course.durationDays ? `${course.durationDays}天` : '-'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400 min-w-[72px]">讲师常驻地：</span>
            <span className="text-slate-700">-</span>
            {/* TODO: 讲师常驻地需从后端 trainer 表获取 */}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400 min-w-[72px]">课程分类：</span>
            <span className="text-slate-700">{course.categoryName || '-'}</span>
          </div>
        </div>

        {/* 关键字 */}
        {course.keywords && (
          <div className="text-xs text-slate-400">关键字：{course.keywords}</div>
        )}
      </div>
    </Link>
  );
}
