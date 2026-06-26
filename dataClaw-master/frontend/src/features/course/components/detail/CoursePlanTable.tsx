'use client';

import { useTranslations } from 'next-intl';
import type { CoursePlan } from '../../api/types';

interface CoursePlanTableProps {
  plans: CoursePlan[];
  courseId: number;
}

export function CoursePlanTable({ plans, courseId }: CoursePlanTableProps) {
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
    if (plan.address) return plan.address;
    // TODO: 根据 provinceId/cityId 显示省市名称
    return '-';
  };

  return (
    <section>
      <h3 className="text-lg font-bold text-slate-900 mb-4">{t('title')}</h3>
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
            {plans.map((plan, index) => (
              <tr key={plan.id || index} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-slate-700">TK-{String(courseId).padStart(6, '0')}-{index + 1}</td>
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
                  {/* TODO: 报名功能 */}
                  <button className="text-primary hover:underline text-sm font-medium">
                    {t('enroll')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
