'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { CoursePlan } from '../../api/types';
import { isPlanEnrolling } from '../../utils/display';
import { formatPlanCode, getOpenCoursePlanPath } from '../../utils/plan-code';

interface CoursePlanTableProps {
  plans: CoursePlan[];
  courseId: number;
  /** 当前页面对应的开课计划编号，用于高亮或排除 */
  activePlanCode?: string;
  /** 自定义表格标题 */
  title?: string;
  /** 仅展示未开课的场次（「近期开课计划」） */
  upcomingOnly?: boolean;
  /** 课程整体已过期时，场次状态一律展示为已结束 */
  courseOverdue?: boolean;
}

export function CoursePlanTable({
  plans,
  courseId,
  activePlanCode,
  title,
  upcomingOnly = false,
  courseOverdue = false,
}: CoursePlanTableProps) {
  const t = useTranslations('course.plan');

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getLocationText = (plan: CoursePlan) => {
    if (plan.onlineUrl) return '线上';
    if (plan.address?.trim()) return plan.address.trim();
    const parts = [plan.provinceName, plan.cityName].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
    return '-';
  };

  const allPlans = plans
    .map((plan, index) => ({ plan, index, planCode: formatPlanCode(courseId, index + 1) }))
    .filter(({ planCode }) => planCode !== activePlanCode)
    .sort((a, b) => {
      const ta = new Date(a.plan.startTime).getTime();
      const tb = new Date(b.plan.startTime).getTime();
      if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
      if (Number.isNaN(ta)) return 1;
      if (Number.isNaN(tb)) return -1;
      return ta - tb;
    });

  // upcomingOnly 时优先展示未开课的场次；全部已结束时回退到最近的历史场次
  let visiblePlans = allPlans;
  if (upcomingOnly) {
    const upcoming = allPlans.filter(({ plan }) => isPlanEnrolling(plan));
    visiblePlans = upcoming.length > 0 ? upcoming : allPlans;
  }

  if (visiblePlans.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="text-lg font-bold text-slate-900 mb-4">{title ?? t('title')}</h3>
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">{t('courseId')}</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">{t('location')}</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">{t('startTime')}</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">{t('status')}</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">{t('action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visiblePlans.map(({ plan, index, planCode }) => {
              const enrolling = !courseOverdue && isPlanEnrolling(plan);
              return (
                <tr key={plan.id || index} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={getOpenCoursePlanPath(planCode)}
                      className="text-primary font-medium hover:underline"
                    >
                      {planCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{getLocationText(plan)}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatDate(plan.startTime)} ~ {formatDate(plan.endTime)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        enrolling
                          ? 'bg-green-50 text-green-600'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {enrolling ? t('enrolling') : t('ended')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {enrolling ? (
                      <Link
                        href={getOpenCoursePlanPath(planCode)}
                        className="text-primary hover:underline text-sm font-medium"
                      >
                        {t('enroll')}
                      </Link>
                    ) : (
                      <span className="text-slate-400 text-sm">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
