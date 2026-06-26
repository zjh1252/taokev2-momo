'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Loader2, PlayCircle, BookOpen, MapPin, CalendarDays } from 'lucide-react';
import ReviewDialog from '@/features/interaction/components/ReviewDialog';
import { getMyVideoLearnings, getMyCourseEnrollments } from '@/features/learning/api/service';
import type { MyVideoLearning, MyCourseEnrollment, PageResponse } from '@/features/learning/api/types';

/** 根据过期时间计算有效期状态 */
function getExpiryStatus(expiredAt: string | null): { label: string; color: string } {
  if (!expiredAt) return { label: '永久有效', color: 'bg-green-500/90' };
  const exp = new Date(expiredAt);
  const now = new Date();
  const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: '已过期', color: 'bg-slate-500/80' };
  if (daysLeft <= 30) return { label: `剩余${daysLeft}天`, color: 'bg-amber-500/90' };
  return { label: '有效期内', color: 'bg-green-500/90' };
}

/** 根据开课计划时间判断状态 */
function getPlanStatus(
  startTime: string | null,
  endTime: string | null,
): { label: string; color: string } {
  if (!startTime || !endTime) return { label: '待安排', color: 'text-gray-500' };
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (now < start) return { label: '待开课', color: 'text-blue-600' };
  if (now <= end) return { label: '进行中', color: 'text-green-600' };
  return { label: '已完结', color: 'text-gray-500' };
}

/** 格式化日期 */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 我的学习 — 录播课 / 公开课
 *
 * @author Fangxinxin
 * @date 2026-04-03 12:00
 */
export default function LearningPage() {
  const [tab, setTab] = useState<'video' | 'course'>('video');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewCourseId, setReviewCourseId] = useState(0);
  const [reviewCourseTitle, setReviewCourseTitle] = useState('');

  // 录播课状态
  const [videoPage, setVideoPage] = useState(1);
  const [videoData, setVideoData] = useState<PageResponse<MyVideoLearning> | null>(null);
  const [videoLoading, setVideoLoading] = useState(true);

  // 公开课状态
  const [coursePage, setCoursePage] = useState(1);
  const [courseData, setCourseData] = useState<PageResponse<MyCourseEnrollment> | null>(null);
  const [courseLoading, setCourseLoading] = useState(false);

  const PAGE_SIZE = 9;

  const loadVideos = useCallback((page: number) => {
    setVideoLoading(true);
    getMyVideoLearnings(page, PAGE_SIZE)
      .then(setVideoData)
      .catch(() => setVideoData(null))
      .finally(() => setVideoLoading(false));
  }, []);

  const loadCourses = useCallback((page: number) => {
    setCourseLoading(true);
    getMyCourseEnrollments(page, PAGE_SIZE)
      .then(setCourseData)
      .catch(() => setCourseData(null))
      .finally(() => setCourseLoading(false));
  }, []);

  useEffect(() => {
    loadVideos(1);
  }, [loadVideos]);

  useEffect(() => {
    if (tab === 'course' && !courseData) {
      loadCourses(1);
    }
  }, [tab, courseData, loadCourses]);

  const handleVideoPageChange = (page: number) => {
    setVideoPage(page);
    loadVideos(page);
  };

  const handleCoursePageChange = (page: number) => {
    setCoursePage(page);
    loadCourses(page);
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
      <div className="px-6 border-b border-slate-200 flex gap-8">
        <button
          type="button"
          onClick={() => setTab('video')}
          className={`py-4 text-[15px] ${tab === 'video' ? 'text-primary font-bold border-b-2 border-primary' : 'text-gray-500 font-medium'}`}
        >
          录播课
        </button>
        <button
          type="button"
          onClick={() => setTab('course')}
          className={`py-4 text-[15px] ${tab === 'course' ? 'text-primary font-bold border-b-2 border-primary' : 'text-gray-500 font-medium'}`}
        >
          公开课
        </button>
      </div>

      {/* 录播课 Tab */}
      {tab === 'video' && (
        <div className="p-6">
          {videoLoading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <Loader2 className="size-5 animate-spin mr-2" />
              <span className="text-sm">加载中...</span>
            </div>
          ) : !videoData || videoData.list.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <BookOpen className="size-12 mb-3 opacity-30" />
              <span className="text-sm">暂无录播课学习记录</span>
              <Link href={ROUTES.VIDEOS} className="text-xs text-primary mt-2 hover:underline">
                去发现课程 →
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {videoData.list.map((v) => {
                  const expiry = v.completed
                    ? { label: '已完成', color: 'bg-emerald-500/90' }
                    : getExpiryStatus(v.expiredAt);

                  let btnText: string;
                  let btnStyle: string;
                  if (v.completed) {
                    btnText = '已学完';
                    btnStyle = 'border border-slate-300 text-gray-700 hover:bg-slate-50';
                  } else if (v.progress > 0) {
                    btnText = '继续学习';
                    btnStyle = 'bg-primary hover:bg-primary/90 text-white';
                  } else {
                    btnText = '开始学习';
                    btnStyle = 'border border-primary text-primary hover:bg-red-50';
                  }

                  return (
                    <div key={v.videoId} className="border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <div className="aspect-[16/10] bg-slate-100 relative">
                        {v.coverUrl ? (
                          <Image
                            src={v.coverUrl}
                            alt={v.title}
                            width={400}
                            height={250}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <PlayCircle className="size-12 text-slate-300" />
                          </div>
                        )}
                        <div className={`absolute top-2 left-2 ${expiry.color} text-white text-[10px] px-2 py-1 rounded`}>
                          {expiry.label}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-gray-800 line-clamp-2 mb-3 text-sm h-10">
                          {v.title}
                        </h3>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
                          <div
                            className={`${v.completed ? 'bg-emerald-500' : 'bg-primary'} h-1.5 rounded-full`}
                            style={{ width: `${v.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-xs text-gray-500">
                            已学习 {v.progress}% ({v.completedChapters}/{v.totalEpisodes}集)
                          </span>
                        </div>
                        <Link
                          href={`${ROUTES.VIDEOS}/${v.videoId}`}
                          className={`block w-full text-center text-sm py-2 rounded transition-colors ${btnStyle}`}
                        >
                          {btnText}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* 分页 */}
              {videoData.totalPages > 1 && (
                <Pagination
                  current={videoPage}
                  total={videoData.totalPages}
                  onChange={handleVideoPageChange}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* 公开课 Tab */}
      {tab === 'course' && (
        <div className="p-6">
          {courseLoading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <Loader2 className="size-5 animate-spin mr-2" />
              <span className="text-sm">加载中...</span>
            </div>
          ) : !courseData || courseData.list.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <BookOpen className="size-12 mb-3 opacity-30" />
              <span className="text-sm">暂无公开课报名记录</span>
              <Link href={ROUTES.PUBLIC_COURSES} className="text-xs text-primary mt-2 hover:underline">
                去发现公开课 →
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {courseData.list.map((c) => {
                  const planStatus = getPlanStatus(c.planStartTime, c.planEndTime);
                  const isFinished = planStatus.label === '已完结';

                  return (
                    <div key={c.courseId} className="border border-slate-200 rounded-lg p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
                      <div className="w-[160px] h-[96px] rounded overflow-hidden bg-slate-100 shrink-0">
                        {c.coverUrl ? (
                          <Image
                            src={c.coverUrl}
                            alt={c.title}
                            width={160}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <BookOpen className="size-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 truncate">{c.title}</div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 rounded text-[11px]">
                            {c.typeLabel}
                          </span>
                          {c.planCity && (
                            <span className="inline-flex items-center gap-0.5">
                              <MapPin className="size-3" /> {c.planCity}
                            </span>
                          )}
                          {c.planStartTime && (
                            <span className="inline-flex items-center gap-0.5">
                              <CalendarDays className="size-3" /> {formatDate(c.planStartTime)}
                            </span>
                          )}
                          <span className={`font-medium ${planStatus.color}`}>
                            {planStatus.label}
                          </span>
                        </div>
                        {c.trainerName && (
                          <div className="text-xs text-gray-500 mt-1">
                            讲师：{c.trainerName}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0">
                        {isFinished ? (
                          <button
                            type="button"
                            onClick={() => {
                              setReviewCourseId(c.courseId);
                              setReviewCourseTitle(c.title);
                              setReviewOpen(true);
                            }}
                            className="text-xs px-3 py-1.5 rounded bg-primary text-white hover:bg-primary/90 transition-colors"
                          >
                            去评价
                          </button>
                        ) : (
                          <Link
                            href={`${ROUTES.PUBLIC_COURSES}/${c.courseId}`}
                            className="text-xs px-3 py-1.5 rounded border border-primary text-primary hover:bg-red-50 transition-colors"
                          >
                            查看详情
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {courseData.totalPages > 1 && (
                <Pagination
                  current={coursePage}
                  total={courseData.totalPages}
                  onChange={handleCoursePageChange}
                />
              )}
            </>
          )}
        </div>
      )}

      <ReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        scope="COURSE"
        courseId={reviewCourseId}
        prefillTitle={reviewCourseTitle}
        onSuccess={() => toast.success('评价已提交，审核通过后将公开展示')}
      />
    </section>
  );
}

/** 简易分页组件 */
function Pagination({
  current,
  total,
  onChange,
}: {
  current: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pages: number[] = [];
  for (let i = 1; i <= total; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        type="button"
        disabled={current <= 1}
        onClick={() => onChange(current - 1)}
        className="px-3 py-1.5 text-xs rounded border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
      >
        上一页
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`w-8 h-8 text-xs rounded transition-colors ${
            p === current
              ? 'bg-primary text-white'
              : 'border border-slate-200 hover:bg-slate-50 text-gray-600'
          }`}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        disabled={current >= total}
        onClick={() => onChange(current + 1)}
        className="px-3 py-1.5 text-xs rounded border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
      >
        下一页
      </button>
    </div>
  );
}
