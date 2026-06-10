import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { ChannelCategoryNav } from '@/components/layout/channel-category-nav';
import { getCityByEnName } from '@/features/city/api/service';
import { getCourseList } from '@/features/course/api/service';
import { CityCourseScheduleList } from '@/features/city/components/CityCourseScheduleList';
import { buildCourseCategoryNavItems } from '@/lib/channel-category-stats';
import { getCachedCourseCategoryTree } from '@/lib/cached-categories';

interface Props {
  params: Promise<{ city: string }>;
}

/** 当月初/月末（用于「本月开课」筛选） */
function thisMonthRange(): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);
  return {
    from: toDate(first),
    to: toDate(last),
  };
}

/** 下月初/月末 */
function nextMonthRange(): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);
  return {
    from: toDate(first),
    to: toDate(last),
  };
}

function toDate(d: Date): string {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export async function generateMetadata({ params }: Props) {
  const { city } = await params;
  try {
    const detail = await getCityByEnName(city);
    if (!detail) return { title: '城市频道 - 淘课网' };
    return {
      title: `${detail.cityName}培训分站 - 淘课网`,
      description: `寻找各类${detail.cityName}培训资源、线下公开课、专家课程。`,
    };
  } catch {
    return { title: '城市频道 - 淘课网' };
  }
}

/**
 * 城市频道页 — /cities/[city]
 * <p>SSR 拉城市详情 + 该城市最近开课课程 + 下月计划，仿老站「上海培训分站」风格。</p>
 */
export default async function CityChannelPage({ params }: Props) {
  const { city } = await params;
  const detail = await getCityByEnName(city).catch(() => null);

  if (!detail) {
    notFound();
  }

  const cityIds = [detail.cityRegionId];
  const month = thisMonthRange();
  const next = nextMonthRange();

  const categoryTreePromise = getCachedCourseCategoryTree();

  const [recentPage, nextMonthPage, categoryNavItems] = await Promise.all([
    // 最近开课：本月可报名公开课
    getCourseList({
      page: 1,
      size: 10,
      isOpen: true,
      cityIds,
      startTimeFrom: month.from,
      startTimeTo: month.to,
      sortBy: 'time',
    }).catch(() => ({
      list: [],
      total: 0,
      page: 1,
      size: 10,
      totalPages: 0,
    })),
    // 下月计划：下月所有公开课
    getCourseList({
      page: 1,
      size: 10,
      isOpen: true,
      cityIds,
      startTimeFrom: next.from,
      startTimeTo: next.to,
      sortBy: 'time',
    }).catch(() => ({
      list: [],
      total: 0,
      page: 1,
      size: 10,
      totalPages: 0,
    })),
    categoryTreePromise
      .then((tree) => buildCourseCategoryNavItems(tree, true, '/opencourse', {
        cityIds,
        cityName: detail.cityName,
      }))
      .catch(() => []),
  ]);

  const monthLabel = `${new Date().getMonth() + 1}`;
  const nextMonthLabel = `${((new Date().getMonth() + 1) % 12) + 1}`;

  return (
    <main className="max-w-7xl mx-auto px-8 py-6 min-h-screen flex flex-col gap-6">
      {/* 面包屑 */}
      <PageBreadcrumb
        items={[
          { label: '城市频道' },
          { label: `${detail.cityName}分站` },
        ]}
      />

      {/* 横幅 */}
      <section className="rounded-lg bg-gradient-to-r from-primary/10 to-orange-50 border border-primary/10 px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            欢迎来到淘课网 —— {detail.cityName}培训分站
          </h1>
          <p className="text-sm text-slate-500">
            寻找各类{detail.cityName}培训资源、本地公开课、企业内训
          </p>
        </div>
        <Link
          href={`/opencourse?cityIds=${detail.cityRegionId}&cityName=${encodeURIComponent(detail.cityName)}`}
          className="inline-flex items-center gap-1.5 bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-md hover:opacity-90 transition-opacity shrink-0"
        >
          查看全部{detail.cityName}公开课
          <ArrowRight className="size-4" />
        </Link>
      </section>

      {/* 最近开课 */}
      <CityCourseScheduleList
        title={`最近开课的${detail.cityName}培训课程（${monthLabel}月）`}
        cityName={detail.cityName}
        courses={recentPage.list}
        emptyText={`本月暂无${detail.cityName}开课`}
      />

      {/* 下月计划 */}
      <CityCourseScheduleList
        title={`${detail.cityName}下月（${nextMonthLabel}月）公开课计划`}
        cityName={detail.cityName}
        courses={nextMonthPage.list}
        emptyText={`下月暂无${detail.cityName}开课`}
      />

      <ChannelCategoryNav
        title="公开课课程分类"
        items={categoryNavItems}
        countUnit="门"
      />
    </main>
  );
}
