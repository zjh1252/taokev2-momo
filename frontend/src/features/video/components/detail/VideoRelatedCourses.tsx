'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import type { CourseListItem } from '@/features/course/api/types';
import { getCourseDetailPath } from '@/features/course/utils/routes';
import { getVideoRelatedCourses } from '../../api/service';

interface VideoRelatedCoursesProps {
  videoId: number;
}

function formatPrice(price: number, isFree: number) {
  if (isFree === 1 || price === 0) return '免费';
  return `${Number(price).toLocaleString()}元`;
}

function formatDuration(hours: number) {
  if (!hours || hours <= 0) return '—';
  const value = Number(hours);
  return Number.isInteger(value) ? `${value}小时` : `${value}小时`;
}

export function VideoRelatedCourses({ videoId }: VideoRelatedCoursesProps) {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getVideoRelatedCourses(videoId)
      .then((data) => {
        if (!cancelled) setCourses(data ?? []);
      })
      .catch(() => {
        if (!cancelled) setCourses([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [videoId]);

  return (
    <section className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200">
        <h2 className="text-base font-bold text-[#d71318]">相关面授课</h2>
      </div>

      {loading ? (
        <p className="text-center py-10 text-slate-400 text-sm">加载中…</p>
      ) : courses.length === 0 ? (
        <p className="text-center py-10 text-slate-400 text-sm">暂无相关面授课</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-slate-800 border-b border-slate-200">
                <th className="text-left font-semibold px-4 py-3">课程名称</th>
                <th className="text-center font-semibold px-4 py-3 w-[120px]">课程分类</th>
                <th className="text-center font-semibold px-4 py-3 w-[100px]">课程时长</th>
                <th className="text-center font-semibold px-4 py-3 w-[100px]">课程价格</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-4 text-slate-800">
                    <Link
                      href={getCourseDetailPath(course.id, course.type, course.seoPathId)}
                      className="hover:text-[#d71318] transition-colors"
                    >
                      {course.title}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-center text-slate-700">
                    {course.categoryName || '—'}
                  </td>
                  <td className="px-4 py-4 text-center text-slate-700">
                    {formatDuration(course.totalHours)}
                  </td>
                  <td className="px-4 py-4 text-center text-[#d71318] font-medium">
                    {formatPrice(course.price, course.isFree)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
