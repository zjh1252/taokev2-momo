'use client';

import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SafeImage } from '@/components/safe-image';
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
  const coverSrc = course.coverUrl;

  // 公开课：取主排期展示时间/地点
  const primaryPlan = isOpen ? course.plans?.[0] : null;
  const planLocation = primaryPlan
    ? (() => {
        if (primaryPlan.onlineUrl) return '线上';
        if (primaryPlan.address?.trim()) return primaryPlan.address.trim();
        const parts = [primaryPlan.provinceName, primaryPlan.cityName].filter(Boolean);
        return parts.length > 0 ? parts.join(' ') : null;
      })()
    : null;
  const planStartDate = primaryPlan?.startTime;
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-[280px] h-[180px] rounded-lg overflow-hidden shrink-0 relative bg-slate-100">
          <SafeImage
            src={coverSrc}
            alt={course.title}
            fill
            apiResolved
            className="object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                isOpen ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {isOpen ? t('tagOpen') : t('tagInternal')}
            </span>
            {course.isFeatured === 1 ? (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-600">
                {t('tagFeatured')}
              </span>
            ) : null}
            {course.isFree === 1 ? (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">
                {t('tagFree')}
              </span>
            ) : null}
          </div>

          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-6">{course.title}</h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-8 text-sm">
            <div className="text-slate-500 min-w-0 break-words">
              {t('courseId')}：
              <span className="text-slate-800 font-medium">
                TK-{String(course.id).padStart(6, '0')}
              </span>
            </div>
            <div className="text-slate-500 min-w-0 break-words">
              {t('duration')}：
              <span className="text-slate-800 font-medium">
                {course.durationDays || '-'} {t('daysUnit')}
                {totalHoursDisplay ? ` / ${totalHoursDisplay} ${t('hoursUnit')}` : null}
              </span>
            </div>
            <div className="text-slate-500 min-w-0 break-words">
              {t('trainer')}：
              <span className="text-primary font-medium">{course.trainerName || '-'}</span>
            </div>
            <div className="text-slate-500 min-w-0 break-words">
              {t('category')}：
              <span className="text-primary font-medium">{course.categoryName || '-'}</span>
            </div>
            <div className="text-slate-500 flex items-center gap-1 min-w-0">
              {t('rating')}：
              <span className="text-slate-800 font-bold">{course.score || '0.0'}</span>
              <Star className="size-4 fill-yellow-400 text-yellow-400" />
            </div>
            {isOpen && planStartDate ? (
              <div className="text-slate-500">
                {t('planTime')}：
                <span className="text-slate-800 font-medium">
                  {formatDate(planStartDate)}
                </span>
              </div>
            ) : null}
            {isOpen && planLocation ? (
              <div className="text-slate-500">
                {t('planLocation')}：
                <span className="text-slate-800 font-medium">{planLocation}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
