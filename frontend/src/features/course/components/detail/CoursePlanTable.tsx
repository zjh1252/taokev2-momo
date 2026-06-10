'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { CoursePlan } from '../../api/types';
import { formatPlanCode, getOpenCoursePlanPath } from '../../utils/plan-code';

interface CoursePlanTableProps {
  plans: CoursePlan[];
  courseId: number;
  /** 当前页面对应的开课计划编号，用于高亮或排除 */
  activePlanCode?: string;
  /** 自定义表格标题 */
  title?: string;
}

export function CoursePlanTable({
  plans,
  courseId,
  activePlanCode,
  title,
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

  const visiblePlans = plans
    .map((plan, index) => ({ plan, index, planCode: formatPlanCode(courseId, index + 1) }))
    .filter(({ planCode }) => planCode !== activePlanCode);

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
            {visiblePlans.map(({ plan, index, planCode }) => (
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
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">
                    {t('enrolling')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={getOpenCoursePlanPath(planCode)}
                    className="text-primary hover:underline text-sm font-medium"
                  >
                    {t('enroll')}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
