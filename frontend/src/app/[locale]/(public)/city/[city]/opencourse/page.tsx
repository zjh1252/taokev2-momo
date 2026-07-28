import { notFound } from 'next/navigation';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { OpenCourseListSection } from '@/features/course/components/open/OpenCourseListSection';
import { getCityByEnNameCached } from '@/features/city/api/server';
import { cityChannelPath } from '@/features/city/lib/paths';
import { resolveCityFilterId } from '@/features/city/lib/filter-city-id';
import { getCourseList } from '@/features/course/api/service';
import { buildCourseCategoryNavItems } from '@/lib/channel-category-stats';
import { getCachedCourseCategoryTree } from '@/lib/cached-categories';
import { openCourseListMetadata, openCourseListH1 } from '@/lib/seo';

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { city } = await params;
  const detail = await getCityByEnNameCached(city).catch(() => null);
  if (!detail) return { title: '城市公开课 - 淘课网' };
  return openCourseListMetadata({ city: detail.cityName });
}

export default async function CityOpenCourseListPage({ params }: Props) {
  const { city } = await params;
  const detail = await getCityByEnNameCached(city).catch(() => null);
  if (!detail) notFound();

  const cityIds = [resolveCityFilterId(detail)];
  const categoryTreePromise = getCachedCourseCategoryTree();
  const categoryNavPromise = categoryTreePromise
    .then((tree) =>
      buildCourseCategoryNavItems(tree, true, '/opencourse', {
        cityIds,
        cityName: detail.cityName,
      }),
    )
    .catch(() => []);

  const [initialData, categoryTree] = await Promise.all([
    getCourseList({
      page: 1,
      size: 15,
      isOpen: true,
      cityIds,
      // 列表默认「综合」即可；开课时间排序由用户在筛选栏切换，避免默认进相关子查询
      sortBy: 'default',
    }).catch(() => ({
      list: [],
      total: 0,
      page: 1,
      size: 15,
      totalPages: 0,
    })),
    categoryTreePromise,
  ]);

  return (
    <main className="max-w-7xl mx-auto px-8 py-6 min-h-screen flex flex-col gap-6">
      <PageBreadcrumb
        items={[
          { label: `${detail.cityName}培训频道`, href: cityChannelPath(detail.enName) },
          { label: '公开课' },
        ]}
      />
      <h1 className="sr-only">
        {openCourseListH1({ city: detail.cityName })}
      </h1>
      <OpenCourseListSection
        initialData={initialData}
        categoryTree={categoryTree}
        initialCityIds={cityIds}
        initialCityNames={[detail.cityName]}
        bottomCategoryNav={{
          title: '公开课课程分类',
          countUnit: '门',
          itemsPromise: categoryNavPromise,
        }}
      />
    </main>
  );
}
