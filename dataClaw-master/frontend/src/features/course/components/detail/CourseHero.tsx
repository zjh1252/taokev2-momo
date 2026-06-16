'use client';

import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { CourseDetail } from '../../api/types';

interface CourseHeroProps {
  course: CourseDetail;
}

export function CourseHero({ course }: CourseHeroProps) {
  const t = useTranslations('course.detail');
  const isOpen = course.type === 'OPEN_OFFLINE' || course.type === 'OPEN_ONLINE';
  const totalHoursDisplay = course.totalHours
    ? Number(course.totalHours).toFixed(0)
    : null;

  return (
    <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100">
      {/* 标签 */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          isOpen ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
        }`}>
          {isOpen ? t('tagOpen') : t('tagInternal')}
        </span>
        {course.isFeatured === 1 && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-600">
            {t('tagFeatured')}
          </span>
        )}
        {course.isFree === 1 && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">
            {t('tagFree')}
          </span>
        )}
      </div>

      {/* 标题 */}
      <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-6">{course.title}</h1>

      {/* 信息网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-8 text-sm">
        <div className="text-slate-500">
          {t('courseId')}：<span className="text-slate-800 font-medium">TK-{String(course.id).padStart(6, '0')}</span>
        </div>
        <div className="text-slate-500">
          {t('duration')}：
          <span className="text-slate-800 font-medium">
            {course.durationDays || '-'} {t('daysUnit')}
            {totalHoursDisplay && ` / ${totalHoursDisplay} ${t('hoursUnit')}`}
          </span>
        </div>
        <div className="text-slate-500">
          {t('audience')}：<span className="text-slate-800 font-medium">{course.audience || '-'}</span>
        </div>
        <div className="text-slate-500">
          {t('trainer')}：
          <span className="text-primary font-medium">{course.trainerName || '-'}</span>
        </div>
        <div className="text-slate-500">
          {t('category')}：
          <span className="text-primary font-medium">{course.categoryName || '-'}</span>
        </div>
        <div className="text-slate-500 flex items-center gap-1">
          {t('rating')}：
          <span className="text-slate-800 font-bold">{course.score || '0.0'}</span>
          <Star className="size-4 fill-yellow-400 text-yellow-400" />
        </div>
        {isOpen && course.publisherName && (
          <div className="text-slate-500">
            {t('publisher')}：<span className="text-primary font-medium">{course.publisherName}</span>
          </div>
        )}
      </div>
    </div>
  );
}
