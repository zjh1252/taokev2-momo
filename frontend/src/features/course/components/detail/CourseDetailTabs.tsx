'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { MaterialLinkSection } from '@/components/material-link-section';
import { useTranslations } from 'next-intl';
import type { CourseDetail } from '../../api/types';
import { CoursePlanTable } from './CoursePlanTable';
import { getPublicReviews } from '@/features/interaction/api/service';
import type { ReviewItem } from '@/features/interaction/api/types';
import { ReviewPhotoList } from '@/features/interaction/components/ReviewPhotoList';
import { courseSectionH3 } from '@/lib/seo/headings';

interface CourseDetailTabsProps {
  course: CourseDetail;
  activePlanCode?: string;
  planTableTitle?: string;
}

function CourseRichSection({
  courseTitle,
  title,
  html,
  text,
}: {
  courseTitle: string;
  title: string;
  html?: string | null;
  text?: string | null;
}) {
  const htmlContent = html?.trim();
  const textContent = text?.trim();

  if (!htmlContent && !textContent) return null;

  return (
    <section>
      <h2 className="text-xl font-bold text-slate-900 mb-4">{title}</h2>
      <h3 className="text-lg font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
        {courseSectionH3(courseTitle, title)}
      </h3>
      {htmlContent ? (
        <div
          className="prose prose-slate max-w-none text-sm"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      ) : (
        <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
          {textContent}
        </div>
      )}
    </section>
  );
}

export function CourseDetailTabs({
  course,
  activePlanCode,
  planTableTitle,
}: CourseDetailTabsProps) {
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
      <div className="flex border-b border-slate-100">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
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

      <div className="p-8">
        {(activeTab === 'intro' || activeTab === 'detail') && (
          <div className="space-y-8">
            {isOpen && course.plans && course.plans.length > 0 && (
              <CoursePlanTable
                plans={course.plans}
                courseId={course.id}
                activePlanCode={activePlanCode}
                title={planTableTitle}
                upcomingOnly={!planTableTitle}
                courseOverdue={Boolean(course.isOverdue)}
              />
            )}

            <CourseRichSection
              courseTitle={course.title}
              title="课程简介"
              html={course.intro}
              text={course.summary}
            />
            <CourseRichSection
              courseTitle={course.title}
              title="课纲"
              html={course.syllabus}
            />
            <CourseRichSection
              courseTitle={course.title}
              title={t('trainingTarget')}
              text={course.audience}
            />
            <CourseRichSection
              courseTitle={course.title}
              title={t('courseHighlights')}
              html={course.highlights}
            />
            <CourseRichSection
              courseTitle={course.title}
              title="授课形式"
              text={course.typeLabel}
            />

            <MaterialLinkSection
              courseTitle={course.title}
              materialUrl={course.materialUrl}
              sourceTexts={[
                course.materialText,
                course.intro,
                course.summary,
                course.syllabus,
                course.audience,
                course.highlights,
              ]}
            />

            {course.trainerName && (
              <section>
                <h3 className="text-lg font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
                  {t('trainerProfile')}
                </h3>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="font-bold text-slate-900">{course.trainerName}</p>
                  {course.trainerId > 0 && (
                    <a
                      href={`/trainer/${course.trainerId}.htm`}
                      className="text-sm text-primary hover:underline mt-1 inline-block"
                    >
                      {t('viewTrainerPage')} →
                    </a>
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'review' && (
          <CourseReviewsPanel courseId={course.id} />
        )}
      </div>
    </div>
  );
}

function CourseReviewsPanel({ courseId }: { courseId: number }) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getPublicReviews('COURSE', { courseId, page: 0, size: 50 })
      .then((page) => {
        setReviews(page.list);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [courseId]);

  if (!loaded) {
    return <div className="text-center py-12 text-slate-400">加载中...</div>;
  }

  if (reviews.length === 0) {
    return <div className="text-center py-12 text-slate-400">暂无评价数据</div>;
  }

  const avgScore = (
    reviews.reduce((sum, r) => sum + Number(r.avgScore), 0) / reviews.length
  ).toFixed(1);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-4">
        <span className="text-2xl font-extrabold text-primary">{avgScore}</span>
        <span className="text-sm text-slate-500">
          综合评分 · 共 {reviews.length} 条
        </span>
      </div>
      {reviews.map((review) => (
        <article key={review.id} className="border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">
              {review.anonymous ? '匿名用户' : (review.submitterName || '学员')}
            </span>
            <span className="text-xs text-slate-500">
              {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex text-[#FFD700]">
              {Array.from({ length: Math.floor(Number(review.avgScore)) }).map((_, i) => (
                <Star key={i} className="size-4 fill-current" />
              ))}
            </div>
            <span className="text-[#FFD700] font-bold text-sm">{review.avgScore}</span>
          </div>
          <div className="flex gap-4 mt-1 text-xs text-slate-400">
            <span>内容 {review.ratingContent}分</span>
            <span>水平 {review.ratingTeaching}分</span>
            <span>服务 {review.ratingService}分</span>
          </div>
          <p className="text-sm text-slate-600 mt-2">{review.commentText}</p>
          <ReviewPhotoList urls={review.photoUrls} />
        </article>
      ))}
    </div>
  );
}
