'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Play, Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { LegacyRichText } from '@/components/legacy-rich-text';
import { SafeImage } from '@/components/safe-image';
import { DEFAULT_COURSE_COVER } from '@/lib/media';
import type { TrainerDetail, TrainerBook } from '../../types';
import type { CourseListItem } from '@/features/course/api/types';
import type { VideoListItem } from '@/features/video/api/types';
import type { TrainerCase } from '@/features/trainer-case/api/types';
import type { TrainerHighlight } from '@/features/trainer-highlight/api/types';
import { getPublicReviews } from '@/features/interaction/api/service';
import type { ReviewItem } from '@/features/interaction/api/types';
import ReviewDialog from '@/features/interaction/components/ReviewDialog';
import { ReviewPhotoList } from '@/features/interaction/components/ReviewPhotoList';
import { getCourseDetailPath, isOpenCourseType } from '@/features/course/utils/routes';
import { decodeHtmlEntities } from '@/lib/html-entities';
import { useAuthGuard } from '@/lib/auth/auth-guard-context';

interface TrainerDetailContentProps {
  trainer: TrainerDetail;
  courses: CourseListItem[];
  cases: TrainerCase[];
  highlights: TrainerHighlight[];
  videos: VideoListItem[];
  books: TrainerBook[];
}

interface TabConfig {
  id: string;
  label: string;
  countKey?: 'courses' | 'cases' | 'videos' | 'reviews' | 'books';
}

const TABS: TabConfig[] = [
  { id: 'home', label: '主页' },
  { id: 'courses', label: '主讲课程', countKey: 'courses' },
  { id: 'cases', label: '授课案例', countKey: 'cases' },
  { id: 'videos', label: '录播课', countKey: 'videos' },
  { id: 'comments', label: '学员评价', countKey: 'reviews' },
  { id: 'books', label: '著作', countKey: 'books' },
];

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
  highlights,
  videos,
  books,
}: TrainerDetailContentProps) {
  // 通过 ?tab=cases 等 query 直接深链激活某个 tab，便于其他页面跳过来落到对应 tab
  const searchParams = useSearchParams();
  const initialTab = (() => {
    const t = searchParams?.get('tab');
    return t && TABS.some((x) => x.id === t) ? t : 'home';
  })();
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    const t = searchParams?.get('tab');
    if (t && TABS.some((x) => x.id === t)) {
      setActiveTab(t);
    }
  }, [searchParams]);

  // 学员评价角标：以专家累计已通过评论数为准（后端在评价审核通过时同步 +1）
  const counts = {
    courses: courses.length,
    cases: cases.length,
    videos: videos.length,
    reviews: trainer.commentCount ?? 0,
    books: books.length,
  };

  return (
    <>
      {/* Tab 导航 */}
      <div className="px-6 lg:px-8 border-t border-slate-200 bg-white rounded-b-xl -mt-6 mb-6">
        <div className="flex items-center gap-8 overflow-x-auto text-[15px]">
          {TABS.map((tab) => {
            const count = tab.countKey ? counts[tab.countKey] : 0;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'text-primary border-b-2 border-primary font-bold'
                    : 'text-slate-600 hover:text-primary'
                }`}
              >
                <span>{tab.label}</span>
                {tab.countKey && count > 0 && (
                  <span className={cn(
                    'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-bold',
                    activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'bg-slate-200 text-slate-600'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 内容区 */}
      <div className="min-h-[800px]">
        {activeTab === 'home' && (
          <HomeView trainer={trainer} courses={courses} cases={cases} highlights={highlights} />
        )}
        {activeTab === 'courses' && <CoursesView courses={courses} />}
        {activeTab === 'cases' && <CasesView cases={cases} />}
        {activeTab === 'videos' && <VideosView videos={videos} />}
        {activeTab === 'comments' && (
          <ReviewsView
            trainerUserId={trainer.userId}
            trainerName={trainer.name}
            courses={courses}
            videos={videos}
          />
        )}
        {activeTab === 'books' && <BooksView books={books} />}
      </div>
    </>
  );
}

// ==================== 主页视图 ====================

function HomeView({
  trainer,
  courses,
  cases,
  highlights,
}: {
  trainer: TrainerDetail;
  courses: CourseListItem[];
  cases: TrainerCase[];
  highlights: TrainerHighlight[];
}) {
  const introText = trainer.intro?.trim() || '';
  const bioText = trainer.bio?.trim() || '';
  const showIntro =
    introText.length > 0 && introText !== bioText;
  const showBio = bioText.length > 0;
  const showOneLine = Boolean(trainer.oneLineIntro?.trim());
  const showGoodAt = Boolean(trainer.goodAt?.trim());

  const hasProfileBlock =
    trainer.educations.length > 0
    || Boolean(trainer.background?.trim())
    || Boolean(trainer.partialClients?.trim())
    || trainer.workExperiences.length > 0
    || Boolean(trainer.teachingStyle?.trim())
    || showIntro
    || showBio
    || showOneLine
    || showGoodAt
    || trainer.honors.length > 0
    || cases.length > 0
    || courses.length > 0
    || highlights.length > 0;

  return (
    <div className="space-y-6">
      {!hasProfileBlock && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-[15px] text-slate-500">暂无专家介绍</p>
          <p className="text-sm text-slate-400 mt-2">
            可切换上方「主讲课程」「授课案例」等标签查看其它内容
          </p>
        </div>
      )}

      {/* 一句话简介 */}
      {showOneLine && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <SectionTitle>一句话简介</SectionTitle>
          <p className="text-[15px] leading-7 text-slate-600">{trainer.oneLineIntro}</p>
        </div>
      )}

      {/* 专家简介（intro 与 bio 分开展示，避免重复） */}
      {showIntro && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <SectionTitle>专家简介</SectionTitle>
          <LegacyRichText content={trainer.intro!} />
        </div>
      )}

      {/* 擅长课题 */}
      {showGoodAt && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <SectionTitle>擅长课题</SectionTitle>
          <LegacyRichText content={trainer.goodAt!} />
        </div>
      )}

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
      {trainer.background && trainer.background.trim() && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <SectionTitle>实战经历</SectionTitle>
          <LegacyRichText content={trainer.background} />
        </div>
      )}

      {/* 部分客户 */}
      {trainer.partialClients && trainer.partialClients.trim() && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <SectionTitle>部分客户</SectionTitle>
          <LegacyRichText content={trainer.partialClients} />
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
      {showBio && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <SectionTitle>个人简介</SectionTitle>
          <LegacyRichText content={trainer.bio!} />
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

      {/* 主讲课程预览 */}
      {courses.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <SectionTitle>主讲课程</SectionTitle>
          <div className="space-y-4">
            {courses.slice(0, 3).map((course) => {
              const isOpen = isOpenCourseType(course.type);
              const detailPath = getCourseDetailPath(course.id, course.type);
              return (
                <div
                  key={course.id}
                  className="p-4 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-sm transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`px-2 py-0.5 text-[12px] rounded-sm font-medium ${
                          isOpen
                            ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                            : 'bg-primary/10 text-primary border border-primary/20'
                        }`}
                      >
                        {course.typeLabel || (isOpen ? '公开课' : '内训课')}
                      </span>
                      <Link
                        href={detailPath}
                        className="font-semibold text-[16px] text-slate-900 hover:text-primary transition-colors line-clamp-1"
                      >
                        {decodeHtmlEntities(course.title)}
                      </Link>
                    </div>
                    {course.keywords && (
                      <p className="text-[13px] text-slate-500 line-clamp-2">{course.keywords}</p>
                    )}
                  </div>
                  <Link
                    href={detailPath}
                    className="shrink-0 px-4 py-2 rounded-md border border-slate-200 text-slate-600 hover:text-primary hover:border-primary text-sm text-center transition-colors"
                  >
                    查看详情
                  </Link>
                </div>
              );
            })}
          </div>
          {courses.length > 3 && (
            <p className="text-sm text-slate-400 mt-4 text-center">
              共 {courses.length} 门课程，请切换「主讲课程」查看全部
            </p>
          )}
        </div>
      )}

      {/* 成功案例 — 图片 + 标题 + 描述，可点击进入案例详情 */}
      {cases.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>成功案例</SectionTitle>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cases.slice(0, 6).map((c) => (
              <Link
                key={c.id}
                href={`/trainers/${trainer.id}/cases/${c.id}`}
                className="rounded-lg border border-slate-200 overflow-hidden group hover:shadow-md transition block"
              >
                <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                  {c.coverImage ? (
                    <SafeImage
                      src={c.coverImage}
                      fallback={DEFAULT_COURSE_COVER}
                      alt={c.caseTitle}
                      width={640}
                      height={400}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                      暂无封面
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-[15px] line-clamp-2 group-hover:text-primary transition-colors">
                    {c.caseTitle}
                  </h3>
                  {c.description && (
                    <p className="text-sm text-slate-500 mt-2 line-clamp-2">{c.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 精彩瞬间 — 图片横向滚动展示 */}
      {highlights.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <SectionTitle>精彩瞬间</SectionTitle>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
            {highlights.map((h) => {
              const cover = h.coverImage || h.files?.[0]?.thumbnailUrl || h.files?.[0]?.fileUrl || '';
              return (
                <div
                  key={h.id}
                  className="shrink-0 w-[260px] rounded-lg overflow-hidden border border-slate-200 bg-slate-100"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    {cover ? (
                      <SafeImage
                        src={cover}
                        fallback={DEFAULT_COURSE_COVER}
                        alt={h.title || '精彩瞬间'}
                        width={520}
                        height={325}
                        className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                        暂无图片
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

// ==================== 主讲课程视图 ====================

function CoursesView({ courses }: { courses: CourseListItem[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
        <h2 className="text-[20px] font-bold text-slate-900">
          全部主讲课程{' '}
          <span className="text-slate-500 font-normal text-[15px] ml-2">共 {courses.length} 门</span>
        </h2>
      </div>

      {courses.length === 0 ? (
        <p className="text-sm text-slate-400 py-12 text-center">暂无主讲课程</p>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => {
            const isOpen = isOpenCourseType(course.type);
            const detailPath = getCourseDetailPath(course.id, course.type);
            return (
              <div
                key={course.id}
                className="p-5 rounded-lg border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-sm transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 text-[12px] rounded-sm font-medium ${
                        isOpen
                          ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                          : 'bg-primary/10 text-primary border border-primary/20'
                      }`}
                    >
                      {course.typeLabel || (isOpen ? '公开课' : '内训课')}
                    </span>
                    <Link
                      href={detailPath}
                      className="font-bold text-[18px] text-slate-900 hover:text-primary transition-colors line-clamp-1"
                    >
                      {decodeHtmlEntities(course.title)}
                    </Link>
                  </div>
                  <p className="text-sm text-slate-500 mb-2">
                    {course.categoryName ? `分类：${course.categoryName}` : ''}
                    {course.durationDays ? ` ｜ 课时：${course.durationDays} 天` : ''}
                    {course.totalHours ? ` 共 ${course.totalHours} 小时` : ''}
                  </p>
                  {course.keywords && (
                    <p className="text-[13px] text-slate-500 line-clamp-2">{course.keywords}</p>
                  )}
                </div>
                <div className="shrink-0">
                  <Link
                    href={detailPath}
                    className="px-6 py-2.5 rounded-md border border-slate-200 text-slate-600 hover:text-primary hover:border-primary font-medium w-full md:w-auto transition-colors inline-block text-center"
                  >
                    查看详情
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==================== 授课案例视图 ====================

function CasesView({ cases }: { cases: TrainerCase[] }) {
  const byIndustry = cases.reduce(
    (acc, c) => {
      const key = c.industry || '其他';
      if (!acc[key]) acc[key] = [];
      acc[key].push(c);
      return acc;
    },
    {} as Record<string, TrainerCase[]>,
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
        <h2 className="text-[20px] font-bold text-slate-900">
          授课案例 <span className="text-primary mx-1">{cases.length}</span> 个
        </h2>
      </div>

      {cases.length === 0 ? (
        <p className="text-sm text-slate-400 py-12 text-center">暂无授课案例</p>
      ) : (
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
                    <div className="aspect-video overflow-hidden rounded border border-slate-200 mb-2 relative bg-slate-100">
                      {c.coverImage ? (
                        <SafeImage
                          src={c.coverImage}
                          fallback={DEFAULT_COURSE_COVER}
                          alt={c.caseTitle}
                          width={300}
                          height={200}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                          暂无封面
                        </div>
                      )}
                    </div>
                    <h3 className="text-[13px] text-slate-900 group-hover:text-primary transition-colors line-clamp-2 text-center">
                      {c.caseTitle}
                    </h3>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== 录播课视图 ====================

function VideosView({ videos }: { videos: VideoListItem[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
        <h2 className="text-[20px] font-bold text-slate-900">
          全部录播课{' '}
          <span className="text-slate-500 font-normal text-[15px] ml-2">共 {videos.length} 门</span>
        </h2>
      </div>

      {videos.length === 0 ? (
        <p className="text-sm text-slate-400 py-12 text-center">暂无录播课</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {videos.map((video) => (
            <Link
              key={video.id}
              href={`/videos/${video.id}`}
              className="rounded-lg overflow-hidden border border-slate-200 group cursor-pointer hover:shadow-sm transition block"
            >
              <div className="aspect-video relative overflow-hidden bg-slate-100">
                {video.coverUrl ? (
                  <Image
                    src={video.coverUrl}
                    alt={video.title}
                    width={520}
                    height={293}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                    暂无封面
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <span className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-white/90 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition shadow-sm">
                  <Play className="size-5 fill-current" />
                </span>
              </div>
              <div className="p-3">
                <h3 className="text-[14px] font-medium text-slate-900 group-hover:text-primary transition-colors line-clamp-2">
                  {video.title}
                </h3>
                <p className="text-[12px] text-slate-500 mt-1 flex justify-between">
                  <span>{video.totalEpisodes ? `${video.totalEpisodes} 节` : video.videoTypeLabel}</span>
                  <span className="text-primary font-bold">
                    {video.isFree === 1 ? '免费' : `¥${Number(video.price).toFixed(2)}`}
                  </span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== 学员评价视图 ====================

function ReviewsView({
  trainerUserId,
  trainerName,
  courses,
  videos,
}: {
  trainerUserId: number;
  trainerName: string;
  courses: CourseListItem[];
  videos: VideoListItem[];
}) {
  const { requireAuth } = useAuthGuard();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  // 培训主题候选项 = 主讲课程 + 录播课，作为"我要评价"弹窗下拉选项的来源
  const topicOptions = [
    ...courses.map((c) => {
      const isOpen = c.type === 'OPEN_OFFLINE' || c.type === 'OPEN_ONLINE';
      return {
        type: 'COURSE' as const,
        id: c.id,
        title: c.title,
        badge: c.typeLabel || (isOpen ? '公开课' : '内训课'),
      };
    }),
    ...videos.map((v) => ({
      type: 'VIDEO' as const,
      id: v.id,
      title: v.title,
      badge: '录播课',
    })),
  ];

  // 没有任何课程/录播课时禁止打开评价弹窗，避免无主题可选
  const handleOpenReview = () => {
    if (topicOptions.length === 0) {
      toast.error('该专家暂无课程，不支持评价');
      return;
    }
    requireAuth(() => setReviewOpen(true));
  };

  useEffect(() => {
    getPublicReviews('TRAINER', { trainerUserId, page: 0, size: 50 })
      .then((page) => {
        setReviews(page.list);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [trainerUserId]);

  const avgScore = reviews.length
    ? (reviews.reduce((sum, r) => sum + Number(r.avgScore), 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
        <h2 className="text-[20px] font-bold text-slate-900">
          学员评价 <span className="text-primary mx-1">{reviews.length}</span> 个
        </h2>
        <button
          type="button"
          onClick={handleOpenReview}
          className="px-4 py-2 rounded-md bg-primary text-white text-sm cursor-pointer hover:bg-primary/90 transition-colors"
        >
          我要评价
        </button>
      </div>

      {/* 评分统计 */}
      <div className="grid md:grid-cols-[220px_1fr] gap-6 mb-8">
        <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
          <div className="text-3xl font-extrabold text-primary">{avgScore}</div>
          <div className="text-sm text-slate-500 mt-1">综合评分</div>
        </div>
        <div className="space-y-3">
          {reviews.length === 0 && loaded && (
            <p className="text-sm text-slate-400 py-8 text-center">暂无评价数据</p>
          )}
          {reviews.map((review) => (
            <article key={review.id} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {review.anonymous ? '匿名用户' : (review.submitterName || '学员')}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex text-[#FFD700]">
                  {Array.from({ length: Math.floor(Number(review.avgScore)) }).map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <span className="text-[#FFD700] font-bold text-[14px]">{review.avgScore}</span>
                {review.courseTitle && (
                  <span className="text-[14px] text-primary">{review.courseTitle}</span>
                )}
              </div>
              <div className="flex gap-4 mt-2 text-xs text-slate-400">
                <span>内容 {review.ratingContent}分</span>
                <span>水平 {review.ratingTeaching}分</span>
                <span>服务 {review.ratingService}分</span>
              </div>
              <p className="text-sm text-slate-600 mt-2">{review.commentText}</p>
              <ReviewPhotoList urls={review.photoUrls} />
            </article>
          ))}
        </div>
      </div>

      <ReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        scope="TRAINER"
        trainerUserId={trainerUserId}
        prefillTitle={trainerName}
        topicOptions={topicOptions}
        onSuccess={() => {
          toast.success('评价已提交，审核通过后将公开展示');
          getPublicReviews('TRAINER', { trainerUserId, page: 0, size: 50 })
            .then((page) => setReviews(page.list))
            .catch(() => {});
        }}
      />
    </div>
  );
}

// ==================== 著作视图 ====================

function isExternalUrl(url?: string | null): url is string {
  if (!url?.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function BooksView({ books }: { books: TrainerBook[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
        <h2 className="text-[20px] font-bold text-slate-900">
          全部著作{' '}
          <span className="text-slate-500 font-normal text-[15px] ml-2">共 {books.length} 本</span>
        </h2>
      </div>

      {books.length === 0 ? (
        <p className="text-sm text-slate-400 py-12 text-center">暂无著作</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {books.map((book) => {
            const card = (
              <>
                <div className="w-full aspect-[3/4] bg-white border border-slate-200 p-1 shadow-sm group-hover:shadow-md transition-shadow">
                  {book.coverUrl ? (
                    <SafeImage
                      src={book.coverUrl}
                      fallback={DEFAULT_COURSE_COVER}
                      alt={book.title}
                      width={280}
                      height={373}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm bg-slate-50">
                      暂无封面
                    </div>
                  )}
                </div>
                <h3 className="text-[14px] text-slate-900 mt-3 text-center line-clamp-2 group-hover:text-primary transition-colors">
                  {book.title}
                </h3>
                {book.publisher && (
                  <p className="text-[12px] text-slate-500 mt-1 line-clamp-1">{book.publisher}</p>
                )}
              </>
            );

            return isExternalUrl(book.buyUrl) ? (
              <a
                key={book.id}
                href={book.buyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center group cursor-pointer"
              >
                {card}
              </a>
            ) : (
              <div key={book.id} className="flex flex-col items-center group">
                {card}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
