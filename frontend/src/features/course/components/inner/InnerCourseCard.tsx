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
      className="bg-white rounded-lg p-4 flex gap-4 border border-slate-100 hover:border-primary hover:shadow-md transition-all cursor-pointer group"
    >
      {/* 左侧图标占位（无封面时显示图标） */}
      <div className="w-24 h-24 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
        {course.coverUrl ? (
          <img src={course.coverUrl} alt={course.title} className="w-full h-full object-cover rounded-lg" />
        ) : (
          <BookOpen className="size-8 text-slate-300" />
        )}
      </div>

      {/* 右侧信息 */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-base text-slate-800 group-hover:text-primary transition-colors line-clamp-1 mb-2">
          {course.title}
        </h3>
        <div className="flex items-center gap-3 mb-2">
          <span className="flex items-center gap-1 text-xs text-orange-500">
            <Flame className="size-3.5" />
            {course.viewCount}
          </span>
          <span className="flex items-center gap-0.5 text-xs text-yellow-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`size-3 ${i < Math.round(course.score) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
            ))}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-y-1 text-sm text-slate-500">
          <div>授课讲师：<span className="text-slate-700">{course.trainerName || '-'}</span></div>
          <div>确定天数：<span className="text-slate-700">{course.durationDays ? `${course.durationDays}.0天` : '-'}</span></div>
          {/* TODO: 讲师常驻地需要后端关联讲师表获取省市 */}
          <div>讲师常驻地：<span className="text-slate-700">-</span></div>
          <div>课程分类：<span className="text-slate-700">{course.categoryName || '-'}</span></div>
        </div>
      </div>
    </Link>
  );
}
