'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { CourseDetail } from '../../api/types';
import { CoursePlanTable } from './CoursePlanTable';

interface CourseDetailTabsProps {
  course: CourseDetail;
}

export function CourseDetailTabs({ course }: CourseDetailTabsProps) {
  const t = useTranslations('course.detail');
  const isOpen = course.type === 'OPEN_OFFLINE' || course.type === 'OPEN_ONLINE';

  const tabs = isOpen
    ? [
        { key: 'detail', label: t('tabDetail') },
        { key: 'review', label: t('tabReview') },
      ]
    : [
        { key: 'intro', label: t('tabIntro') },
        { key: 'review', label: t('tabReview') },
      ];

  const [activeTab, setActiveTab] = useState(tabs[0].key);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Tab 头 */}
      <div className="flex border-b border-slate-100">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-8 py-4 text-sm font-medium transition-colors relative ${
              activeTab === tab.key
                ? 'text-primary'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <div className="p-8">
        {(activeTab === 'intro' || activeTab === 'detail') && (
          <div className="space-y-8">
            {/* 公开课：开课计划表格 */}
            {isOpen && course.plans && course.plans.length > 0 && (
              <CoursePlanTable plans={course.plans} courseId={course.id} />
            )}

            {/* 培训受众 */}
            {course.audience && (
              <section>
                <h3 className="text-lg font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
                  {t('trainingTarget')}
                </h3>
                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {course.audience}
                </div>
              </section>
            )}

            {/* 课程亮点 */}
            {course.highlights && (
              <section>
                <h3 className="text-lg font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
                  {t('courseHighlights')}
                </h3>
                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {course.highlights}
                </div>
              </section>
            )}

            {/* 课程介绍（富文本） */}
            {course.intro && (
              <section>
                <h3 className="text-lg font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
                  {t('tabIntro')}
                </h3>
                <div
                  className="prose prose-slate max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: course.intro }}
                />
              </section>
            )}

            {/* 课程大纲（富文本） */}
            {course.syllabus && (
              <section>
                <h3 className="text-lg font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
                  {t('courseSyllabus')}
                </h3>
                <div
                  className="prose prose-slate max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: course.syllabus }}
                />
              </section>
            )}

            {/* 授课专家 */}
            {course.trainerName && (
              <section>
                <h3 className="text-lg font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
                  {t('trainerProfile')}
                </h3>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl">
                    {course.trainerName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{course.trainerName}</p>
                    {/* TODO: trainerId 回填后可链接到讲师主页 */}
                    {course.trainerId > 0 && (
                      <a href={`/trainers/${course.trainerId}`} className="text-sm text-primary hover:underline mt-1 inline-block">
                        {t('viewTrainerPage')} →
                      </a>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'review' && (
          <div className="text-center py-12 text-slate-400">
            {/* TODO: 后端暂无评价接口，后续接入 */}
            暂无评价数据
          </div>
        )}
      </div>
    </div>
  );
}
