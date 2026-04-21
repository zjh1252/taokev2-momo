'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { ChevronRight, Play, Star } from 'lucide-react';
import { toast } from 'sonner';
import type { InstitutionDetail } from '../../types';
import {
  getInstitutionCourses,
  getInstitutionVideos,
} from '../../api/service';
import { getPublicReviews } from '@/features/interaction/api/service';
import type { ReviewItem } from '@/features/interaction/api/types';
import ReviewDialog from '@/features/interaction/components/ReviewDialog';
import { useAuthGuard } from '@/lib/auth/auth-guard-context';
import type { CourseListItem } from '@/features/course/api/types';
import type { VideoListItem } from '@/features/video/api/types';

interface InstitutionDetailTabsProps {
  institution: InstitutionDetail;
}

type TabKey = 'intro' | 'reviews' | 'contact';

const PREVIEW_COURSE_LIMIT = 10;
const PREVIEW_VIDEO_LIMIT = 10;

export function InstitutionDetailTabs({ institution }: InstitutionDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('intro');

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'intro', label: '机构介绍' },
    { key: 'reviews', label: '评价详情', count: institution.commentCount },
    { key: 'contact', label: '在线留言' },
  ];

  return (
    <div className="flex flex-col">
      {/* Tab 按钮 */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-6 py-2.5 text-sm font-medium transition-colors bg-white border border-transparent rounded-t-lg ${
              activeTab === tab.key
                ? 'text-primary font-bold border-slate-200 border-b-white z-10 -mb-px'
                : 'text-slate-500 bg-slate-50 border-slate-200 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            {activeTab === tab.key && (
              <span className="absolute top-0 left-0 right-0 h-[3px] bg-primary rounded-t" />
            )}
            <span className="inline-flex items-center gap-1.5">
              {tab.label}
              {tab.count != null && tab.count > 0 && (
                <span
                  className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-bold ${
                    activeTab === tab.key
                      ? 'bg-primary text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <div className="bg-white border border-slate-200 border-t-0 rounded-b-xl shadow-sm p-6">
        {activeTab === 'intro' && <IntroContent institution={institution} />}
        {activeTab === 'reviews' && <ReviewsContent institution={institution} />}
        {activeTab === 'contact' && <ContactContent institution={institution} />}
      </div>
    </div>
  );
}

/* ==================== 机构介绍 ==================== */

function SectionHeader({
  title,
  moreHref,
}: {
  title: string;
  moreHref?: string;
}) {
  return (
    <div className="flex items-center justify-between border-l-4 border-primary pl-3 py-2 bg-slate-50 rounded-r mb-4">
      <span className="font-bold text-slate-800 text-sm">{title}</span>
      {moreHref && (
        <Link
          href={moreHref}
          className="inline-flex items-center text-xs text-slate-500 hover:text-primary transition-colors pr-2"
        >
          更多 <ChevronRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}

function IntroContent({ institution }: { institution: InstitutionDetail }) {
  const [openCourses, setOpenCourses] = useState<CourseListItem[]>([]);
  const [innerCourses, setInnerCourses] = useState<CourseListItem[]>([]);
  const [videos, setVideos] = useState<VideoListItem[]>([]);

  useEffect(() => {
    getInstitutionCourses(institution.id, 'OPEN', 1, PREVIEW_COURSE_LIMIT)
      .then((res) => setOpenCourses(res.list))
      .catch(() => setOpenCourses([]));
    getInstitutionCourses(institution.id, 'INNER', 1, PREVIEW_COURSE_LIMIT)
      .then((res) => setInnerCourses(res.list))
      .catch(() => setInnerCourses([]));
    getInstitutionVideos(institution.id, 1, PREVIEW_VIDEO_LIMIT)
      .then((res) => setVideos(res.list))
      .catch(() => setVideos([]));
  }, [institution.id]);

  return (
    <div className="space-y-8">
      {/* 简介 */}
      {institution.bio && (
        <section>
          <SectionHeader title="简介" />
          <p className="text-sm text-slate-600 leading-loose whitespace-pre-wrap">
            {institution.bio}
          </p>
        </section>
      )}

      {/* 公开课 */}
      {openCourses.length > 0 && (
        <section>
          <SectionHeader
            title="公开课"
            moreHref={`/opencourses?institutionId=${institution.id}`}
          />
          <OpenCourseTable courses={openCourses} />
        </section>
      )}

      {/* 内训课 */}
      {innerCourses.length > 0 && (
        <section>
          <SectionHeader
            title="内训课"
            moreHref={`/innercourses?institutionId=${institution.id}`}
          />
          <InnerCourseTable courses={innerCourses} />
        </section>
      )}

      {/* 视频 */}
      {videos.length > 0 && (
        <section>
          <SectionHeader
            title="视频"
            moreHref={`/videos?institutionId=${institution.id}`}
          />
          <VideoGrid videos={videos} />
        </section>
      )}

      {/* 部分客户 */}
      {institution.clientCases && (
        <section>
          <SectionHeader title="部分客户" />
          <p className="text-sm text-slate-600 leading-loose whitespace-pre-wrap">
            {institution.clientCases}
          </p>
        </section>
      )}

      {/* 成功案例 */}
      {institution.successCases && (
        <section>
          <SectionHeader title="成功案例" />
          <p className="text-sm text-slate-600 leading-loose whitespace-pre-wrap">
            {institution.successCases}
          </p>
        </section>
      )}

      {/* 全部为空时占位 */}
      {!institution.bio &&
        openCourses.length === 0 &&
        innerCourses.length === 0 &&
        videos.length === 0 &&
        !institution.clientCases &&
        !institution.successCases && (
          <p className="text-sm text-slate-400 text-center py-12">该机构暂未填写介绍内容</p>
        )}
    </div>
  );
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatPrice(price: number, isFree: number) {
  if (isFree === 1 || price === 0) return '免费';
  return `¥${Number(price).toLocaleString()}`;
}

function OpenCourseTable({ courses }: { courses: CourseListItem[] }) {
  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="text-left font-medium px-4 py-2.5 w-[40%]">课程名称</th>
            <th className="text-left font-medium px-4 py-2.5">价格</th>
            <th className="text-left font-medium px-4 py-2.5">开课时间</th>
            <th className="text-left font-medium px-4 py-2.5">开课城市</th>
            <th className="text-right font-medium px-4 py-2.5">操作</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((c) => (
            <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3 text-slate-800">
                <Link
                  href={`/opencourses/${c.id}`}
                  className="font-medium hover:text-primary line-clamp-1"
                >
                  {c.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-primary font-semibold">
                {formatPrice(c.price, c.isFree)}
              </td>
              <td className="px-4 py-3 text-slate-600">{formatDate(c.nextPlanStartDate)}</td>
              <td className="px-4 py-3 text-slate-600">{c.nextPlanCity || '—'}</td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/opencourses/${c.id}`}
                  className="text-primary hover:underline text-xs"
                >
                  查看详情
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InnerCourseTable({ courses }: { courses: CourseListItem[] }) {
  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="text-left font-medium px-4 py-2.5 w-[50%]">课程名称</th>
            <th className="text-left font-medium px-4 py-2.5">专家</th>
            <th className="text-left font-medium px-4 py-2.5">课程天数</th>
            <th className="text-right font-medium px-4 py-2.5">操作</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((c) => (
            <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3 text-slate-800">
                <Link
                  href={`/innercourses/${c.id}`}
                  className="font-medium hover:text-primary line-clamp-1"
                >
                  {c.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-600">{c.trainerName || '—'}</td>
              <td className="px-4 py-3 text-slate-600">
                {c.durationDays ? `${c.durationDays} 天` : '—'}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/innercourses/${c.id}`}
                  className="text-primary hover:underline text-xs"
                >
                  查看详情
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VideoGrid({ videos }: { videos: VideoListItem[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {videos.map((v) => (
        <Link
          key={v.id}
          href={`/videos/${v.id}`}
          className="group rounded-lg overflow-hidden border border-slate-200 hover:shadow-sm transition-shadow"
        >
          <div className="aspect-video relative overflow-hidden bg-slate-100">
            {v.coverUrl ? (
              <Image
                src={v.coverUrl}
                alt={v.title}
                width={320}
                height={180}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <Play className="size-8" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/15 group-hover:bg-black/5 transition-colors" />
            <span className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-white/90 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition shadow-sm">
              <Play className="size-4 fill-current" />
            </span>
          </div>
          <div className="p-2">
            <h4 className="text-xs font-medium text-slate-900 group-hover:text-primary transition-colors line-clamp-2">
              {v.title}
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 flex justify-between">
              <span>{v.totalEpisodes ? `${v.totalEpisodes}节` : '—'}</span>
              <span className="text-primary font-bold">
                {v.isFree === 1 ? '免费' : `¥${Number(v.price).toLocaleString()}`}
              </span>
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ==================== 评价详情 ==================== */

function ReviewsContent({ institution }: { institution: InstitutionDetail }) {
  const { requireAuth } = useAuthGuard();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const loadReviews = () => {
    getPublicReviews('INSTITUTION', { institutionId: institution.id, page: 0, size: 50 })
      .then((page) => {
        setReviews(page.list);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  };

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institution.id]);

  const avgScore = reviews.length
    ? (reviews.reduce((sum, r) => sum + Number(r.avgScore), 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
        <h2 className="text-[18px] font-bold text-slate-900">
          评价详情 <span className="text-primary mx-1">{reviews.length}</span> 条
        </h2>
        <button
          onClick={() => requireAuth(() => setReviewOpen(true))}
          className="px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 transition-colors"
        >
          发表评价
        </button>
      </div>

      <div className="grid md:grid-cols-[220px_1fr] gap-6">
        <div className="rounded-lg border border-slate-200 p-4 bg-slate-50 h-fit">
          <div className="text-3xl font-extrabold text-primary">{avgScore}</div>
          <div className="text-sm text-slate-500 mt-1">综合评分</div>
        </div>
        <div className="space-y-3">
          {loaded && reviews.length === 0 && (
            <p className="text-sm text-slate-400 py-8 text-center">暂无评价数据</p>
          )}
          {reviews.map((review) => (
            <article key={review.id} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  {review.anonymous ? '匿名用户' : review.submitterName || '学员'}
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
            </article>
          ))}
        </div>
      </div>

      <ReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        scope="INSTITUTION"
        institutionId={institution.id}
        prefillTitle={institution.orgName}
        onSuccess={() => {
          toast.success('评价已提交，审核通过后将公开展示');
          loadReviews();
        }}
      />
    </div>
  );
}

/* ==================== 在线留言 ==================== */

function ContactContent({ institution: _institution }: { institution: InstitutionDetail }) {
  return (
    <div className="flex flex-col md:flex-row gap-12">
      {/* 左侧客服中转信息 */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-primary rounded-full flex items-center justify-center">
            <span className="text-2xl">📞</span>
          </div>
          <div>
            <div className="text-sm text-slate-400 mb-1">淘课网客服 中转</div>
            <div className="text-lg font-bold text-slate-800">021-34606062</div>
          </div>
        </div>
        <div className="text-sm text-slate-400 bg-slate-50 rounded-lg p-4">
          如需联系该机构，请致电淘课网客服热线，我们将为您转接。
        </div>
      </div>

      {/* 右侧留言 */}
      <div className="flex-1 bg-slate-50 p-6 rounded-xl border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-4">在线留言</h3>
        <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            placeholder="您的姓名"
            className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
          <input
            type="tel"
            placeholder="联系电话"
            className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
          <textarea
            placeholder="请输入您的咨询需求..."
            rows={4}
            className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
          />
          <button
            type="button"
            className="bg-primary hover:bg-primary/90 text-white font-bold py-2 rounded transition-colors shadow-sm"
          >
            提交留言
          </button>
        </form>
      </div>
    </div>
  );
}
