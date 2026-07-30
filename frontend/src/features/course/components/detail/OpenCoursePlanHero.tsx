'use client';

import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { CourseDetail, CoursePlan } from '../../api/types';
import { getPlanDisplayNo } from '../../utils/open-course-seo';

interface OpenCoursePlanHeroProps {
  course: CourseDetail;
  plan: CoursePlan;
  planCode: string;
  planIndex1Based: number;
}

export function OpenCoursePlanHero({
  course,
  plan,
  planCode: _planCode,
  planIndex1Based,
}: OpenCoursePlanHeroProps) {
  const t = useTranslations('course.detail');
  const totalHoursDisplay = course.totalHours
    ? Number(course.totalHours).toFixed(0)
    : null;
  const displayNo = getPlanDisplayNo(plan, course.id, planIndex1Based);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getLocationText = () => {
    if (plan.onlineUrl) return '线上';
    if (plan.address?.trim()) return plan.address.trim();
    const parts = [plan.provinceName, plan.cityName].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
    return '-';
  };

  return (
    <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 mb-4">
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
          {t('tagOpen')}
        </span>
        {course.isFeatured === 1 && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-600">
            {t('tagFeatured')}
          </span>
        )}
      </div>

      <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-6">{course.title}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-8 text-sm">
        <div className="text-slate-500">
          {t('courseId')}：<span className="text-slate-800 font-medium">{displayNo}</span>
        </div>
        <div className="text-slate-500">
          {t('duration')}：
          <span className="text-slate-800 font-medium">
            {course.durationDays || '-'} {t('daysUnit')}
            {totalHoursDisplay && ` / ${totalHoursDisplay} ${t('hoursUnit')}`}
          </span>
        </div>
        <div className="text-slate-500">
          {t('planLocation')}：<span className="text-slate-800 font-medium">{getLocationText()}</span>
        </div>
        <div className="text-slate-500">
          {t('planTime')}：
          <span className="text-slate-800 font-medium">
            {formatDate(plan.startTime)} ~ {formatDate(plan.endTime)}
          </span>
        </div>
        <div className="text-slate-500">
          {t('trainer')}：
          <span className="text-primary font-medium">{course.trainerName || '-'}</span>
        </div>
        <div className="text-slate-500 flex items-center gap-1">
          {t('rating')}：
          <span className="text-slate-800 font-bold">{course.score || '0.0'}</span>
          <Star className="size-4 fill-yellow-400 text-yellow-400" />
        </div>
        {course.publisherName && (
          <div className="text-slate-500">
            {t('publisher')}：<span className="text-primary font-medium">{course.publisherName}</span>
          </div>
        )}
      </div>
    </div>
  );
}
