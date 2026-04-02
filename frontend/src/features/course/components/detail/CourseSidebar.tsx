'use client';

import { MessageSquare, Heart, Share2, Flame, PenLine, Eye, CalendarCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { CourseDetail } from '../../api/types';

interface CourseSidebarProps {
  course: CourseDetail;
}

export function CourseSidebar({ course }: CourseSidebarProps) {
  const t = useTranslations('course.detail');
  const isOpen = course.type === 'OPEN_OFFLINE' || course.type === 'OPEN_ONLINE';

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 sticky top-[120px] space-y-4">
      {/* 公开课显示价格 */}
      {isOpen && course.price > 0 && (
        <div className="text-center pb-4 border-b border-slate-100">
          <p className="text-sm text-slate-500 mb-1">{t('price')}</p>
          <p className="text-3xl font-bold text-red-500">
            ¥{course.price.toLocaleString()}
            {course.originalPrice > course.price && (
              <span className="text-base text-slate-400 line-through ml-2">¥{course.originalPrice.toLocaleString()}</span>
            )}
          </p>
        </div>
      )}

      {/* 主按钮 */}
      <button
        onClick={() => { /* TODO: 咨询/预约功能 */ }}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-md"
      >
        {isOpen ? (
          <><CalendarCheck className="size-4" /> {t('reserve')}</>
        ) : (
          <><MessageSquare className="size-4" /> {t('consult')}</>
        )}
      </button>

      {/* 收藏按钮 */}
      <button
        onClick={() => { /* TODO: 收藏功能 */ }}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-slate-200 text-slate-700 font-medium text-sm hover:border-primary hover:text-primary transition-all"
      >
        <Heart className="size-4" />
        {t('favorite')}
      </button>

      {/* 互动数据 */}
      <div className="flex items-center justify-around pt-4 border-t border-slate-100 text-xs text-slate-500">
        <button className="flex items-center gap-1 hover:text-primary transition-colors">
          <Share2 className="size-3.5" />
          {t('share')}
        </button>
        <span className="flex items-center gap-1">
          {isOpen ? <Eye className="size-3.5" /> : <Flame className="size-3.5" />}
          {isOpen ? t('views') : t('popularity')}: {course.viewCount}
        </span>
        <button className="flex items-center gap-1 hover:text-primary transition-colors">
          <PenLine className="size-3.5" />
          {t('review')}
        </button>
      </div>
    </div>
  );
}
