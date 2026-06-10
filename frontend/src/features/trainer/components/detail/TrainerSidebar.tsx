'use client';

import { useEffect, useState, useMemo } from 'react';
import { SafeImage } from '@/components/safe-image';
import { DEFAULT_COURSE_COVER } from '@/lib/media';
import { Link } from '@/i18n/navigation';
import { Bot, Star, Flame, BookOpen, Briefcase, Users } from 'lucide-react';
import type {
  TrainerDetail,
  RecommendedCourseItem,
  RecommendedTrainerItem,
} from '../../types';
import { getRecommendedCourses, getRecommendedTrainers } from '../../api/service';
import { pickDisplayTitle } from '../../utils/displayTitle';
import { getTrainerDisplayName } from '../../utils/displayName';
import { getCourseDetailPath, isOpenCourseType } from '@/features/course/utils/routes';
import { decodeHtmlEntities } from '@/lib/html-entities';

/** 每个推荐模块展示条数上限 */
const MAX_TRAINERS = 6;
const MAX_PUBLIC_COURSES = 5;
const MAX_INTERNAL_COURSES = 5;

interface TrainerSidebarProps {
  trainer: TrainerDetail;
}

/**
 * 专家详情页右侧推荐栏
 *
 * <p>包含三个推荐模块：</p>
 * <ul>
 *   <li>相关专家 — 同领域的其他讲师（4-6 个）</li>
 *   <li>相关公开课 — 同领域公开课，优先近期报名 + 热度高（3-5 门）</li>
 *   <li>相关内训课 — 同领域内训课（3-5 门）</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-06-09 17:00
 */
export function TrainerSidebar({ trainer }: TrainerSidebarProps) {
  const [allCourses, setAllCourses] = useState<RecommendedCourseItem[]>([]);
  const [trainers, setTrainers] = useState<RecommendedTrainerItem[]>([]);

  useEffect(() => {
    // 请求足够多的课程，前端按类型拆分
    getRecommendedCourses(trainer.id, 10)
      .then(setAllCourses)
      .catch(() => setAllCourses([]));
    getRecommendedTrainers(trainer.id, MAX_TRAINERS)
      .then(setTrainers)
      .catch(() => setTrainers([]));
  }, [trainer.id]);

  const { publicCourses, internalCourses } = useMemo(() => {
    const pub: RecommendedCourseItem[] = [];
    const inter: RecommendedCourseItem[] = [];
    for (const c of allCourses) {
      if (isOpenCourseType(c.type)) {
        pub.push(c);
      } else {
        inter.push(c);
      }
    }
    return {
      publicCourses: pub.slice(0, MAX_PUBLIC_COURSES),
      internalCourses: inter.slice(0, MAX_INTERNAL_COURSES),
    };
  }, [allCourses]);

  const limitedTrainers = trainers.slice(0, MAX_TRAINERS);
  const hasAnyRecommendation =
    limitedTrainers.length > 0 || publicCourses.length > 0 || internalCourses.length > 0;

  if (!hasAnyRecommendation) {
    return (
      <aside className="space-y-3 lg:sticky lg:top-[96px] max-h-[calc(100vh-120px)] overflow-y-auto overflow-x-hidden h-fit scrollbar-hide">
        <AiMatchingCard />
      </aside>
    );
  }

  return (
    <aside className="space-y-3 lg:sticky lg:top-[96px] max-h-[calc(100vh-120px)] overflow-y-auto overflow-x-hidden h-fit scrollbar-hide">
      {/* ── 相关专家 ── */}
      {limitedTrainers.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <SectionTitle icon={<Users className="size-4" />} accent="bg-blue-500">
            相关专家
          </SectionTitle>
          <div className="space-y-3">
            {limitedTrainers.map((t) => {
              const relatedName = getTrainerDisplayName(t);
              const subtitle =
                pickDisplayTitle(t.title, relatedName) ||
                (t.oneLineIntro?.trim() || undefined);
              return (
                <Link
                  key={t.id}
                  href={`/trainer/${t.id}.htm`}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <SafeImage
                    src={t.avatar}
                    alt={relatedName}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 group-hover:text-primary transition-colors text-[13px] line-clamp-1">
                      {relatedName}
                    </h4>
                    {subtitle ? (
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {subtitle}
                      </p>
                    ) : null}
                  </div>
                  {t.score != null && t.score > 0 && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Star className="size-3 fill-[#FFD700] text-[#FFD700]" />
                      <span className="text-[11px] text-slate-700 font-bold">
                        {Number(t.score).toFixed(1)}
                      </span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 相关公开课 ── */}
      {publicCourses.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <SectionTitle icon={<BookOpen className="size-4" />} accent="bg-primary">
            相关公开课
          </SectionTitle>
          <div className="space-y-3">
            {publicCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      )}

      {/* ── 相关内训课 ── */}
      {internalCourses.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <SectionTitle icon={<Briefcase className="size-4" />} accent="bg-amber-500">
            相关内训课
          </SectionTitle>
          <div className="space-y-3">
            {internalCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      )}

      {/* ── AI 智能匹配 ── */}
      <AiMatchingCard />
    </aside>
  );
}

/** 推荐模块标题 */
function SectionTitle({
  icon,
  accent,
  children,
}: {
  icon: React.ReactNode;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-1 h-4 ${accent} rounded-full`} />
      {icon && <span className="text-slate-600">{icon}</span>}
      <h3 className="font-bold text-[15px] text-slate-800">{children}</h3>
    </div>
  );
}

/** 推荐课程卡片（公开课 / 内训课通用） */
function CourseCard({ course }: { course: RecommendedCourseItem }) {
  return (
    <Link
      href={getCourseDetailPath(course.id, course.type)}
      className="flex items-center gap-3 cursor-pointer group"
    >
      <SafeImage
        src={course.coverUrl}
        fallback={DEFAULT_COURSE_COVER}
        alt={decodeHtmlEntities(course.title)}
        width={56}
        height={42}
        className="w-14 h-[42px] object-cover rounded border border-slate-200 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-slate-900 group-hover:text-primary transition-colors text-[13px] line-clamp-2">
          {decodeHtmlEntities(course.title)}
        </h4>
        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
          <Flame className="size-3 text-orange-400" />
          {course.viewCount ?? 0} 次浏览
        </p>
      </div>
    </Link>
  );
}

/** AI 智能匹配引导卡片 */
function AiMatchingCard() {
  return (
    <div className="bg-primary rounded-xl p-4 text-white">
      <div className="flex items-center gap-2 mb-2">
        <Bot className="size-5" />
        <h3 className="font-bold text-lg">AI 智能匹配</h3>
      </div>
      <p className="text-[13px] text-white/85 mt-1 leading-relaxed">
        输入您的培训需求，AI 助手将为您精准匹配最适合的讲师和课程方案。
      </p>
      <button
        type="button"
        className="w-full mt-3 py-2 rounded-lg bg-white text-primary text-[14px] font-semibold hover:bg-white/90 transition-colors flex items-center justify-center gap-1.5"
      >
        立即体验
      </button>
    </div>
  );
}
