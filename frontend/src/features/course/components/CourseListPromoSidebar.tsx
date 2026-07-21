'use client';

import { useEffect, useMemo, useState } from 'react';
import { Flame, Star } from 'lucide-react';

type PromoVariant = 'inner' | 'open';

interface CourseListPromoSidebarProps {
  variant: PromoVariant;
}

interface PromoCourse {
  key: string;
  href: string;
  title: string;
  teacher: string;
  metricLabel: string;
  metricValue: string;
}

interface PromoCategory {
  key: string;
  label: string;
  courses: PromoCourse[];
}

const PROMO_GROUPS: Record<
  PromoVariant,
  {
    title: string;
    categories: PromoCategory[];
  }
> = {
  inner: {
    title: '热门内训课',
    categories: [
      {
        key: 'ai',
        label: 'AI',
        courses: [
          {
            key: 'inner-ai-1',
            href: '/inhousecourse/222607.htm',
            title: 'AI一键通关，带你从新手村一路进军...',
            teacher: '刘雪峰',
            metricLabel: '人气',
            metricValue: '3746',
          },
          {
            key: 'inner-ai-2',
            href: '/inhousecourse/222610.htm',
            title: 'AI工具赋能企业培训体系升级',
            teacher: '陈思宇',
            metricLabel: '人气',
            metricValue: '3120',
          },
          {
            key: 'inner-ai-3',
            href: '/inhousecourse/222611.htm',
            title: '生成式AI在管理场景中的落地应用',
            teacher: '李清华',
            metricLabel: '人气',
            metricValue: '2986',
          },
        ],
      },
      {
        key: 'hr',
        label: '人力资源',
        courses: [
          {
            key: 'inner-hr-1',
            href: '/inhousecourse/222608.htm',
            title: '人才盘点与组织梯队建设实战课',
            teacher: '张家存',
            metricLabel: '人气',
            metricValue: '2869',
          },
          {
            key: 'inner-hr-2',
            href: '/inhousecourse/222612.htm',
            title: '绩效管理与薪酬激励方案设计',
            teacher: '王老师',
            metricLabel: '人气',
            metricValue: '2541',
          },
          {
            key: 'inner-hr-3',
            href: '/inhousecourse/222613.htm',
            title: '招聘面试官训练与人才识别',
            teacher: '赵老师',
            metricLabel: '人气',
            metricValue: '2390',
          },
        ],
      },
      {
        key: 'leadership',
        label: '领导力',
        courses: [
          {
            key: 'inner-leadership-1',
            href: '/inhousecourse/222609.htm',
            title: '中高层管理技能提升 MTP',
            teacher: '张家存',
            metricLabel: '人气',
            metricValue: '2268',
          },
          {
            key: 'inner-leadership-2',
            href: '/inhousecourse/222614.htm',
            title: '卓越团队建设与管理',
            teacher: '刘雪峰',
            metricLabel: '人气',
            metricValue: '2156',
          },
          {
            key: 'inner-leadership-3',
            href: '/inhousecourse/222615.htm',
            title: '目标拆解、授权与团队复盘',
            teacher: '陈思宇',
            metricLabel: '人气',
            metricValue: '2038',
          },
        ],
      },
    ],
  },
  open: {
    title: '热门公开课',
    categories: [
      {
        key: 'ai',
        label: 'AI',
        courses: [
          {
            key: 'open-ai-1',
            href: '/opencourse/15.htm',
            title: 'AI大模型办公提效公开课',
            teacher: '陈思宇',
            metricLabel: '报名',
            metricValue: '1286',
          },
          {
            key: 'open-ai-2',
            href: '/opencourse/18.htm',
            title: 'AI提示词与企业知识库应用',
            teacher: '刘雪峰',
            metricLabel: '报名',
            metricValue: '1132',
          },
          {
            key: 'open-ai-3',
            href: '/opencourse/19.htm',
            title: 'AI智能体工作流实战训练',
            teacher: '李清华',
            metricLabel: '报名',
            metricValue: '987',
          },
        ],
      },
      {
        key: 'management',
        label: '管理技能',
        courses: [
          {
            key: 'open-management-1',
            href: '/opencourse/16.htm',
            title: '中层管理者角色认知与执行力',
            teacher: '李清华',
            metricLabel: '报名',
            metricValue: '956',
          },
          {
            key: 'open-management-2',
            href: '/opencourse/20.htm',
            title: '高效沟通与跨部门协同',
            teacher: '张家存',
            metricLabel: '报名',
            metricValue: '873',
          },
          {
            key: 'open-management-3',
            href: '/opencourse/21.htm',
            title: '问题分析与结构化决策',
            teacher: '陈思宇',
            metricLabel: '报名',
            metricValue: '801',
          },
        ],
      },
      {
        key: 'growth',
        label: '营销增长',
        courses: [
          {
            key: 'open-growth-1',
            href: '/opencourse/17.htm',
            title: '品牌增长与私域运营实战',
            teacher: 'Robert',
            metricLabel: '报名',
            metricValue: '823',
          },
          {
            key: 'open-growth-2',
            href: '/opencourse/22.htm',
            title: '大客户销售策略与成交推进',
            teacher: '王老师',
            metricLabel: '报名',
            metricValue: '768',
          },
          {
            key: 'open-growth-3',
            href: '/opencourse/23.htm',
            title: '短视频内容营销与线索转化',
            teacher: '赵老师',
            metricLabel: '报名',
            metricValue: '705',
          },
        ],
      },
    ],
  },
};

export function CourseListPromoSidebar({ variant }: CourseListPromoSidebarProps) {
  const promo = PROMO_GROUPS[variant];
  const categories = promo.categories;
  const realSlides = useMemo(
    () =>
      categories.flatMap((category, categoryIndex) =>
        category.courses.map((course, courseIndex) => ({
          category,
          categoryIndex,
          course,
          courseIndex,
        })),
      ),
    [categories],
  );
  const slides = useMemo(
    () => (realSlides.length > 0 ? [...realSlides, realSlides[0]] : realSlides),
    [realSlides],
  );
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const activeRealIndex = realSlides.length > 0 ? activeSlideIndex % realSlides.length : 0;
  const activeSlide = realSlides[activeRealIndex] ?? realSlides[0];
  const activeCategory = activeSlide.category;
  const activeCourseIndex = activeSlide.courseIndex;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTransitionEnabled(true);
      setActiveSlideIndex((currentIndex) => {
        if (realSlides.length === 0) return 0;
        return currentIndex + 1;
      });
    }, 3400);

    return () => window.clearInterval(timer);
  }, [realSlides.length]);

  const handleCategoryChange = (categoryKey: string) => {
    const targetIndex = realSlides.findIndex((slide) => slide.category.key === categoryKey);
    setTransitionEnabled(true);
    setActiveSlideIndex(targetIndex >= 0 ? targetIndex : 0);
  };

  const handleDotClick = (courseIndex: number) => {
    const targetIndex = realSlides.findIndex(
      (slide) =>
        slide.category.key === activeCategory.key && slide.courseIndex === courseIndex,
    );
    setTransitionEnabled(true);
    setActiveSlideIndex(targetIndex >= 0 ? targetIndex : activeRealIndex);
  };

  const handleTrackTransitionEnd = () => {
    if (realSlides.length === 0 || activeSlideIndex < realSlides.length) return;
    setTransitionEnabled(false);
    setActiveSlideIndex(0);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setTransitionEnabled(true));
    });
  };

  return (
    <section className="w-full">
      <div className="mb-5 flex items-center gap-2">
        <h2 className="text-[26px] font-extrabold leading-none text-slate-900">
          {promo.title}
        </h2>
        <Flame className="size-6 fill-orange-500 text-orange-500" />
      </div>

      <div className="mb-4 flex items-center justify-start gap-11">
        {categories.map((category) => {
          const active = category.key === activeCategory.key;
          return (
            <button
              key={category.key}
              type="button"
              onClick={() => handleCategoryChange(category.key)}
              className={`relative h-8 whitespace-nowrap text-left text-base font-bold transition-colors cursor-pointer ${
                active ? 'text-primary' : 'text-slate-500 hover:text-primary'
              }`}
            >
              {category.label}
              {active ? (
                <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-primary" />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div
          className={`flex will-change-transform ${
            transitionEnabled
              ? 'transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]'
              : ''
          }`}
          style={{ transform: `translate3d(-${activeSlideIndex * 100}%, 0, 0)` }}
          onTransitionEnd={handleTrackTransitionEnd}
        >
          {slides.map(({ course }, index) => (
            <a
              key={`${course.key}-${index}`}
              href={course.href}
              className="group block w-full shrink-0"
            >
              <div className="relative h-[330px] bg-gradient-to-b from-[#2f2f2f] to-[#7a7a7a]">
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-sm font-bold text-white">
                  <Flame className="size-4 fill-white text-white" />
                  {course.metricLabel} {course.metricValue}
                </div>
              </div>

              <div className="border-b border-slate-100 px-5 py-3">
                <h3 className="line-clamp-1 text-lg font-extrabold text-slate-950 transition-colors group-hover:text-primary">
                  {course.title}
                </h3>
              </div>

              <div className="px-4 pb-4 pt-4">
                <div className="flex items-center gap-3">
                  <span className="size-10 shrink-0 rounded-full bg-slate-300" />

                  <div className="flex h-9 w-[56px] min-w-0 flex-col justify-center">
                    <div className="text-[11px] font-bold leading-4 text-slate-700">讲师</div>
                    <div className="truncate text-xs font-semibold leading-4 text-slate-600">
                      {course.teacher}
                    </div>
                  </div>

                  <div className="flex h-9 w-[58px] shrink-0 flex-col justify-center">
                    <div className="text-[11px] font-bold leading-4 text-slate-700">评分</div>
                    <div className="flex h-4 items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <Star
                          key={starIndex}
                          className="size-3 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                  </div>

                  <span className="ml-auto inline-flex h-9 w-[88px] shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white transition-colors group-hover:bg-primary/90">
                    去查看
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 pb-4 pt-1">
          {activeCategory.courses.map((course, index) => {
            const active = index === activeCourseIndex;
            return (
              <button
                key={course.key}
                type="button"
                aria-label={`查看${activeCategory.label}第${index + 1}门热门课程`}
                onClick={() => handleDotClick(index)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  active ? 'w-7 bg-slate-400' : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
