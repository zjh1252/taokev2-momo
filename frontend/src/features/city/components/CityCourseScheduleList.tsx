import { Link } from '@/i18n/navigation';
import type { CourseListItem } from '@/features/course/api/types';

interface CityCourseScheduleListProps {
  /** 区块标题，如「最近开课的上海培训课程」 */
  title: string;
  /** 城市名，用于格式化标签（如 "[上海]"） */
  cityName: string;
  /** 课程列表，已按时间排序好 */
  courses: CourseListItem[];
  /** 空数据文案 */
  emptyText?: string;
}

/**
 * 城市频道页课程排期清单 — 仿老站表格风格：
 * <p>「[城市] 课程名（n天）  价格  开课时间」三列横排，移动端折行。</p>
 *
 * @author Fangxinxin
 * @date 2026-05-20 18:30
 */
export function CityCourseScheduleList({
  title,
  cityName,
  courses,
  emptyText = '暂无开课信息',
}: CityCourseScheduleListProps) {
  return (
    <section className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden">
      <header className="px-5 py-3 border-b border-slate-100 bg-slate-50">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
      </header>

      {courses.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-400">{emptyText}</div>
      ) : (
        <>
          {/* 表头 — 仅 sm+ 显示 */}
          <div className="hidden sm:grid grid-cols-[1fr_120px_140px] px-5 py-2 text-xs text-primary border-b border-slate-100">
            <span>课程名称</span>
            <span className="text-center">课程价格</span>
            <span className="text-center">开课时间</span>
          </div>

          <ul className="divide-y divide-slate-50">
            {courses.map((course) => (
              <CityScheduleRow key={course.id} course={course} cityName={cityName} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function CityScheduleRow({ course, cityName }: { course: CourseListItem; cityName: string }) {
  // 优先取后端 VO 的 nextPlanStartDate（最近一场公开课日期），缺失时显示「咨询客服」
  const dateLabel = course.nextPlanStartDate
    ? formatDate(course.nextPlanStartDate)
    : '咨询客服';
  const priceLabel = formatPrice(course.price);

  return (
    <li className="px-5 py-3 grid grid-cols-1 sm:grid-cols-[1fr_120px_140px] sm:items-center gap-1 sm:gap-3 hover:bg-slate-50 transition-colors">
      <Link
        href={`/opencourses/${course.id}`}
        className="text-sm text-slate-800 hover:text-primary line-clamp-1"
      >
        <span className="text-primary mr-1">[{cityName}]</span>
        {course.title}
      </Link>
      <span className="text-sm text-orange-600 font-medium sm:text-center">{priceLabel}</span>
      <span className="text-xs text-slate-500 sm:text-center">{dateLabel}</span>
    </li>
  );
}

function formatDate(iso: string): string {
  // 兼容 "2026-05-15T10:00:00" 与 "2026-05-15 10:00:00"
  const norm = iso.replace(' ', 'T');
  const d = new Date(norm);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatPrice(price: number | null | undefined): string {
  if (price == null) return '咨询客服';
  if (price === 0) return '免费';
  return `${price}元`;
}
