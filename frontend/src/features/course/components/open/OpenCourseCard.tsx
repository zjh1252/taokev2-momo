import { Link } from '@/i18n/navigation';
import { Flame, Star, BookOpen } from 'lucide-react';
import type { CourseListItem } from '../../api/types';

interface OpenCourseCardProps {
  course: CourseListItem;
}

export function OpenCourseCard({ course }: OpenCourseCardProps) {
  return (
    <Link
      href={`/opencourses/${course.id}`}
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
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-base font-bold text-slate-800 group-hover:text-primary transition-colors line-clamp-1">
              {course.title}
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
              看过：<span className="text-primary font-semibold">{course.viewCount}</span>
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

        {/* 信息网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1.5 text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-md">
          <div className="flex items-center gap-1">
            <span className="text-slate-400 min-w-[60px]">开课时间：</span>
            <span className="text-slate-700">-</span>
            {/* TODO: 开课时间需从 plans 中获取 */}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400 min-w-[60px]">课程天数：</span>
            <span className="text-slate-700">
              {course.durationDays ? `${course.durationDays}天` : '-'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400 min-w-[60px]">开课地点：</span>
            <span className="text-slate-700">-</span>
            {/* TODO: 开课地点需从 plans 中获取 */}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400 min-w-[60px]">授课讲师：</span>
            <span className="text-slate-700">{course.trainerName || '-'}</span>
          </div>
          <div className="flex items-center gap-1 md:col-span-2">
            <span className="text-slate-400 min-w-[60px]">课程分类：</span>
            <span className="text-slate-700">{course.categoryName || '-'}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
