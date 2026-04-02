'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Star, ChevronRight, Play } from 'lucide-react';
import type {
  TrainerDetail,
  MockCourse,
  MockCase,
  MockClip,
  MockReview,
  MockBook,
  MockRelatedTrainer,
} from '../../types';

interface TrainerDetailContentProps {
  trainer: TrainerDetail;
  courses: MockCourse[];
  cases: MockCase[];
  clips: MockClip[];
  reviews: MockReview[];
  books: MockBook[];
  relatedTrainers: MockRelatedTrainer[];
}

const TABS = [
  { id: 'home', label: '主页' },
  { id: 'courses', label: '主讲课程' },
  { id: 'cases', label: '授课案例' },
  { id: 'clips', label: '录播课' },
  { id: 'comments', label: '学员评价' },
  { id: 'books', label: '著作' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-1 h-5 bg-primary rounded-full" />
      <h2 className="text-[22px] font-bold">{children}</h2>
    </div>
  );
}

export function TrainerDetailContent({
  trainer,
  courses,
  cases,
  clips,
  reviews,
  books,
  relatedTrainers,
}: TrainerDetailContentProps) {
  const [activeTab, setActiveTab] = useState<TabId>('home');

  return (
    <>
      {/* Tab 导航 */}
      <div className="px-6 lg:px-8 border-t border-slate-200 bg-white rounded-b-xl -mt-6 mb-6">
        <div className="flex items-center gap-8 overflow-x-auto text-[15px]">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary font-bold'
                  : 'text-slate-600 hover:text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 内容区 */}
      <div className="min-h-[800px]">
        {activeTab === 'home' && (
          <HomeView
            trainer={trainer}
            cases={cases}
            clips={clips}
            reviews={reviews}
            books={books}
            relatedTrainers={relatedTrainers}
          />
        )}
        {activeTab === 'courses' && <CoursesView courses={courses} />}
        {activeTab === 'cases' && <CasesView cases={cases} />}
        {activeTab === 'clips' && <ClipsView clips={clips} />}
        {activeTab === 'comments' && <ReviewsView reviews={reviews} />}
        {activeTab === 'books' && <BooksView books={books} />}
      </div>
    </>
  );
}

// ==================== 主页视图 ====================

function HomeView({
  trainer,
  cases,
  clips,
  reviews,
  books,
  relatedTrainers,
}: {
  trainer: TrainerDetail;
  cases: MockCase[];
  clips: MockClip[];
  reviews: MockReview[];
  books: MockBook[];
  relatedTrainers: MockRelatedTrainer[];
}) {
  return (
    <div className="space-y-6">
      {/* 资质背景 */}
      {trainer.educations.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <SectionTitle>资质背景</SectionTitle>
          <ul className="space-y-2 text-[15px] leading-7 text-slate-600 list-disc pl-5 marker:text-slate-400">
            {trainer.educations.map((edu) => (
              <li key={edu.id || edu.schoolName}>
                {edu.schoolName}
                {edu.major && ` · ${edu.major}`}
                {edu.degree && `（${edu.degree}）`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 实战经历 */}
      {trainer.background && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <SectionTitle>实战经历</SectionTitle>
          <div className="text-[15px] leading-7 text-slate-600 whitespace-pre-line">
            {trainer.background}
          </div>
        </div>
      )}

      {/* 职业经历 */}
      {trainer.workExperiences.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <SectionTitle>职业经历</SectionTitle>
          <div className="space-y-4">
            {trainer.workExperiences.map((exp) => (
              <div key={exp.id || exp.companyName} className="flex gap-4">
                <div className="w-24 shrink-0 text-[14px] text-slate-500 font-medium mt-1">
                  {exp.startDate?.substring(0, 4)} -{' '}
                  {exp.endDate ? exp.endDate.substring(0, 4) : '至今'}
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-slate-900">
                    {exp.companyName}
                    {exp.position && ` / ${exp.position}`}
                  </h4>
                  {exp.jobDescription && (
                    <p className="text-[14px] text-slate-500 mt-1">{exp.jobDescription}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 授课风格 */}
      {trainer.teachingStyle && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <SectionTitle>授课风格</SectionTitle>
          <p className="text-[15px] leading-7 text-slate-600">{trainer.teachingStyle}</p>
        </div>
      )}

      {/* 个人简介 */}
      {trainer.bio && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <SectionTitle>个人简介</SectionTitle>
          <div className="text-[15px] leading-7 text-slate-600 whitespace-pre-line">
            {trainer.bio}
          </div>
        </div>
      )}

      {/* 证书 */}
      {trainer.honors.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <SectionTitle>证书</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {trainer.honors.map((honor) => (
              <div
                key={honor.id || honor.honorName}
                className="flex flex-col items-center group cursor-pointer"
              >
                {honor.honorImage ? (
                  <div className="w-full aspect-[4/3] bg-white border border-slate-200 p-1 shadow-sm group-hover:shadow-md transition-shadow max-w-[200px]">
                    <Image
                      src={honor.honorImage}
                      alt={honor.honorName}
                      width={200}
                      height={150}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-[4/3] bg-slate-100 border border-slate-200 flex items-center justify-center max-w-[200px] rounded">
                    <span className="text-slate-400 text-sm">证书</span>
                  </div>
                )}
                <h3 className="text-[13px] text-slate-900 mt-3 text-center line-clamp-1 group-hover:text-primary transition-colors">
                  {honor.honorName}
                </h3>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 授课案例 预览 */}
      {cases.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>授课案例</SectionTitle>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cases.slice(0, 3).map((c) => (
              <article
                key={c.id}
                className="rounded-lg border border-slate-200 overflow-hidden group hover:shadow-sm transition"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <Image
                    src={c.image}
                    alt={c.title}
                    width={640}
                    height={400}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-[15px] line-clamp-2">{c.title}</h3>
                  <p className="text-sm text-slate-500 mt-2 line-clamp-2">{c.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* 相关讲师 */}
      {relatedTrainers.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <SectionTitle>相关讲师</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedTrainers.map((t) => (
              <Link
                key={t.id}
                href={`/trainers/${t.id}`}
                className="border border-slate-200 rounded-lg p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow cursor-pointer group"
              >
                <Image
                  src={t.avatar}
                  alt={t.name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm mb-3 group-hover:scale-105 transition-transform"
                />
                <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors text-[15px]">
                  {t.name}
                </h4>
                <p className="text-[12px] text-slate-500 mt-1 line-clamp-1">{t.title}</p>
                <div className="flex items-center text-[14px] mt-2 gap-1">
                  <Star className="size-4 fill-[#FFD700] text-[#FFD700]" />
                  <span className="text-slate-900 text-[12px] font-bold">{t.score}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== 主讲课程视图 ====================

function CoursesView({ courses }: { courses: MockCourse[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
        <h2 className="text-[20px] font-bold text-slate-900">
          全部主讲课程{' '}
          <span className="text-slate-500 font-normal text-[15px] ml-2">共 {courses.length} 门</span>
        </h2>
      </div>
      <div className="space-y-4">
        {courses.map((course) => (
          <div
            key={course.id}
            className="p-5 rounded-lg border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-sm transition"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-2 py-0.5 text-[12px] rounded-sm font-medium ${
                    course.type === 'copyright'
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                  }`}
                >
                  {course.type === 'copyright' ? '版权课' : '内训课'}
                </span>
                <h3 className="font-bold text-[18px] text-slate-900 hover:text-primary cursor-pointer transition-colors">
                  {course.title}
                </h3>
              </div>
              <p className="text-sm text-slate-500 mb-2">
                适用对象：{course.target} ｜ 课时：{course.duration}
              </p>
              <p className="text-[13px] text-slate-500 line-clamp-2">{course.description}</p>
            </div>
            <div className="shrink-0">
              <button className="px-6 py-2.5 rounded-md border border-slate-200 text-slate-600 hover:text-primary hover:border-primary font-medium w-full md:w-auto transition-colors">
                查看详情
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== 授课案例视图 ====================

function CasesView({ cases }: { cases: MockCase[] }) {
  const byIndustry = cases.reduce(
    (acc, c) => {
      const key = c.industry || '其他';
      if (!acc[key]) acc[key] = [];
      acc[key].push(c);
      return acc;
    },
    {} as Record<string, MockCase[]>,
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
        <h2 className="text-[20px] font-bold text-slate-900">
          授课案例 <span className="text-primary mx-1">{cases.length}</span> 个
        </h2>
      </div>
      <div className="space-y-6">
        {Object.entries(byIndustry).map(([industry, items]) => (
          <div
            key={industry}
            className="flex flex-col md:flex-row gap-6 pb-6 border-b border-slate-200 border-dashed last:border-b-0"
          >
            <div className="w-full md:w-[120px] shrink-0 font-medium text-slate-900 flex items-center md:justify-center">
              {industry}
            </div>
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((c) => (
                <div key={c.id} className="group cursor-pointer">
                  <div className="aspect-video overflow-hidden rounded border border-slate-200 mb-2 relative">
                    <Image
                      src={c.image}
                      alt={c.title}
                      width={300}
                      height={200}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="text-[13px] text-slate-900 group-hover:text-primary transition-colors line-clamp-2 text-center">
                    {c.title}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== 录播课视图 ====================

function ClipsView({ clips }: { clips: MockClip[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
        <h2 className="text-[20px] font-bold text-slate-900">
          全部录播课{' '}
          <span className="text-slate-500 font-normal text-[15px] ml-2">共 {clips.length} 门</span>
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {clips.map((clip) => (
          <article
            key={clip.id}
            className="rounded-lg overflow-hidden border border-slate-200 group cursor-pointer hover:shadow-sm transition"
          >
            <div className="aspect-video relative overflow-hidden">
              <Image
                src={clip.image}
                alt={clip.title}
                width={520}
                height={293}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
              />
              {clip.type === 'video' && (
                <>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <span className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-white/90 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition shadow-sm">
                    <Play className="size-5 fill-current" />
                  </span>
                  {clip.duration && (
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[11px] px-1.5 py-0.5 rounded">
                      {clip.duration}
                    </span>
                  )}
                </>
              )}
              {clip.type === 'article' && (
                <span className="absolute top-2 right-2 bg-primary/90 text-white text-[11px] px-1.5 py-0.5 rounded shadow-sm">
                  图文
                </span>
              )}
            </div>
            <div className="p-3">
              <h3 className="text-[14px] font-medium text-slate-900 group-hover:text-primary transition-colors line-clamp-2">
                {clip.title}
              </h3>
              <p className="text-[12px] text-slate-500 mt-1 flex justify-between">
                <span>{clip.lessons}</span>
                <span className="text-primary font-bold">{clip.price}</span>
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

// ==================== 学员评价视图 ====================

function ReviewsView({ reviews }: { reviews: MockReview[] }) {
  const avgScore = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-4 mb-6">
        <h2 className="text-[20px] font-bold text-slate-900">
          学员评价 <span className="text-primary mx-1">{reviews.length}</span> 个
        </h2>
      </div>

      {/* 评分统计 */}
      <div className="grid md:grid-cols-[220px_1fr] gap-6 mb-8">
        <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
          <div className="text-3xl font-extrabold text-primary">{avgScore}</div>
          <div className="text-sm text-slate-500 mt-1">综合评分</div>
        </div>
        <div className="space-y-3">
          {reviews.map((review) => (
            <article key={review.id} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{review.username}</span>
                  <span className="text-xs text-slate-500">{review.role}</span>
                </div>
                <div className="text-xs text-slate-500">{review.date}</div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex text-[#FFD700]">
                  {Array.from({ length: Math.floor(review.rating) }).map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <span className="text-[#FFD700] font-bold text-[14px]">{review.rating}</span>
                <span className="text-[14px] text-primary">{review.courseName}</span>
              </div>
              <p className="text-sm text-slate-600 mt-2">{review.content}</p>
              {review.image && (
                <div className="mt-3">
                  <Image
                    src={review.image}
                    alt="评价配图"
                    width={200}
                    height={140}
                    className="w-[200px] h-[140px] object-cover rounded border border-slate-200"
                  />
                </div>
              )}
              {review.hasReply && review.replyContent && (
                <p className="text-xs mt-2 text-primary">讲师回复：{review.replyContent}</p>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== 著作视图 ====================

function BooksView({ books }: { books: MockBook[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
        <h2 className="text-[20px] font-bold text-slate-900">
          全部著作{' '}
          <span className="text-slate-500 font-normal text-[15px] ml-2">共 {books.length} 本</span>
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {books.map((book) => (
          <div key={book.id} className="flex flex-col items-center group cursor-pointer">
            <div className="w-full aspect-[3/4] bg-white border border-slate-200 p-1 shadow-sm group-hover:shadow-md transition-shadow">
              <Image
                src={book.image}
                alt={book.title}
                width={280}
                height={373}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-[14px] text-slate-900 mt-3 text-center line-clamp-2 group-hover:text-primary transition-colors">
              {book.title}
            </h3>
            <p className="text-[12px] text-slate-500 mt-1">{book.publisher}</p>
            <p className="text-[16px] text-primary font-bold mt-1">
              {book.price > 0 ? `¥ ${book.price.toFixed(2)}` : '免费'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
