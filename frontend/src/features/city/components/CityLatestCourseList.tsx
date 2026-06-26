import { Link } from '@/i18n/navigation';
import type { CourseListItem } from '@/features/course/api/types';
import type { VideoListItem } from '@/features/video/api/types';
import { getCourseDetailPath, isOpenCourseType } from '@/features/course/utils/routes';

export type CityLatestItem =
  | { kind: 'course'; item: CourseListItem; sortAt: string }
  | { kind: 'video'; item: VideoListItem; sortAt: string };

interface CityLatestCourseListProps {
  cityName: string;
  items: CityLatestItem[];
}

function formatDate(iso: string): string {
  const norm = iso.replace(' ', 'T');
  const d = new Date(norm);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatPrice(price: number | null | undefined, isFree?: number): string {
  if (isFree === 1 || price === 0) return '免费';
  if (price == null) return '咨询客服';
  return `${price}元`;
}

function itemHref(entry: CityLatestItem): string {
  if (entry.kind === 'video') {
    return `/videos/${entry.item.id}.htm`;
  }
  return getCourseDetailPath(entry.item.id, entry.item.type);
}

function itemTitle(entry: CityLatestItem): string {
  return entry.kind === 'video' ? entry.item.title : entry.item.title;
}

function itemPrice(entry: CityLatestItem): string {
  if (entry.kind === 'video') {
    return formatPrice(entry.item.price, entry.item.isFree);
  }
  return formatPrice(entry.item.price, entry.item.isFree);
}

function itemDate(entry: CityLatestItem): string {
  if (entry.kind === 'video') {
    return '在线学习';
  }
  const course = entry.item;
  if (isOpenCourseType(course.type) && course.nextPlanStartDate) {
    return formatDate(course.nextPlanStartDate);
  }
  if (course.publishedAt) {
    return formatDate(course.publishedAt);
  }
  return '—';
}

/**
 * 城市频道 — 最新培训课程（公开课 + 录播课）
 */
export function CityLatestCourseList({ cityName, items }: CityLatestCourseListProps) {
  return (
    <>
      <div className="hidden sm:grid grid-cols-[1fr_120px_140px] px-5 py-2 text-xs text-primary border-b border-slate-100">
        <span>课程名称</span>
        <span className="text-center">课程价格</span>
        <span className="text-center">开课时间</span>
      </div>
      <ul className="divide-y divide-slate-50">
        {items.map((entry) => (
          <li
            key={`${entry.kind}-${entry.kind === 'video' ? entry.item.id : entry.item.id}`}
            className="px-5 py-3 grid grid-cols-1 sm:grid-cols-[1fr_120px_140px] sm:items-center gap-1 sm:gap-3 hover:bg-slate-50 transition-colors"
          >
            <h3 className="text-sm font-normal m-0">
              <Link href={itemHref(entry)} className="text-slate-800 hover:text-primary line-clamp-1">
                <span className="text-primary mr-1">[{cityName}]</span>
                {itemTitle(entry)}
                {(entry.kind === 'course' && entry.item.isFree === 1) ||
                (entry.kind === 'video' && entry.item.isFree === 1) ? (
                  <span className="ml-2 inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] text-emerald-700">
                    免费
                  </span>
                ) : null}
              </Link>
            </h3>
            <span className="text-sm text-orange-600 font-medium sm:text-center">{itemPrice(entry)}</span>
            <span className="text-xs text-slate-500 sm:text-center">{itemDate(entry)}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

/** 合并公开课与录播课，按上架时间倒序取前 N 条 */
export function mergeLatestCityCourses(
  openCourses: CourseListItem[],
  videos: VideoListItem[],
  limit: number,
): CityLatestItem[] {
  const merged: CityLatestItem[] = [
    ...openCourses.map((item) => ({
      kind: 'course' as const,
      item,
      sortAt: item.publishedAt || item.createdAt || '',
    })),
    ...videos.map((item) => ({
      kind: 'video' as const,
      item,
      sortAt: item.publishedAt || item.createdAt || '',
    })),
  ];
  return merged
    .filter((row) => row.sortAt)
    .toSorted((a, b) => b.sortAt.localeCompare(a.sortAt))
    .slice(0, limit);
}
