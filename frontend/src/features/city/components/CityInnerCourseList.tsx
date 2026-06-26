import { Link } from '@/i18n/navigation';
import type { CourseListItem } from '@/features/course/api/types';
import { getCourseDetailPath } from '@/features/course/utils/routes';

interface CityInnerCourseListProps {
  cityName: string;
  courses: CourseListItem[];
}

/**
 * 城市频道 — 本月热门内训课列表
 */
export function CityInnerCourseList({ cityName, courses }: CityInnerCourseListProps) {
  return (
    <ul className="divide-y divide-slate-50">
      {courses.map((course) => (
        <li
          key={course.id}
          className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 hover:bg-slate-50 transition-colors"
        >
          <h3 className="flex-1 text-sm font-normal m-0">
            <Link
              href={getCourseDetailPath(course.id, course.type)}
              className="text-slate-800 hover:text-primary line-clamp-1"
            >
              <span className="text-primary mr-1">[{cityName}]</span>
              {course.title}
            </Link>
          </h3>
          <span className="text-xs text-slate-500 shrink-0">
            授课培训师：
            {course.trainerId ? (
              <Link href={`/trainer/${course.trainerId}.htm`} className="text-primary hover:underline ml-1">
                {course.trainerName || '待定'}
              </Link>
            ) : (
              <span className="ml-1">{course.trainerName || '待定'}</span>
            )}
          </span>
          <span className="text-xs text-slate-400 shrink-0">
            培训所在地：{course.trainerCityName || cityName}
          </span>
        </li>
      ))}
    </ul>
  );
}
