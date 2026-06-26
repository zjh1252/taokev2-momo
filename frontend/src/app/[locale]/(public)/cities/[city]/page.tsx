import { notFound } from 'next/navigation';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { getActiveCities, getCityByEnName } from '@/features/city/api/service';
import { CityChannelSection } from '@/features/city/components/CityChannelSection';
import { CityCourseScheduleList } from '@/features/city/components/CityCourseScheduleList';
import { CityInnerCourseList } from '@/features/city/components/CityInnerCourseList';
import {
  CityLatestCourseList,
  mergeLatestCityCourses,
} from '@/features/city/components/CityLatestCourseList';
import { CityInstitutionFlowList } from '@/features/city/components/CityInstitutionFlowList';
import { CityTrainerFlowList } from '@/features/city/components/CityTrainerFlowList';
import { CityNavGrid } from '@/features/city/components/CityNavGrid';
import {
  cityInstitutionListPath,
  cityOpenCourseListPath,
  cityTrainerListPath,
} from '@/features/city/lib/paths';
import { resolveCityFilterId } from '@/features/city/lib/filter-city-id';
import { getCourseList } from '@/features/course/api/service';
import { getInstitutionList } from '@/features/institution/api/service';
import { getTrainerList } from '@/features/trainer/api/service';
import { getVideoList } from '@/features/video/api/service';
import { buildCityChannelMetadata } from '@/lib/seo';

interface Props {
  params: Promise<{ city: string }>;
}

const emptyPage = { list: [], total: 0, page: 1, size: 10, totalPages: 0 };

export async function generateMetadata({ params }: Props) {
  const { city } = await params;
  const detail = await getCityByEnName(city).catch(() => null);
  if (!detail) return { title: '城市培训频道 - 淘课网' };
  return buildCityChannelMetadata(detail.cityName);
}

/**
 * 城市综合频道页 — /cities/[city]（SEO 别名 /city/{拼音}）
 */
export default async function CityChannelPage({ params }: Props) {
  const { city } = await params;
  const detail = await getCityByEnName(city).catch(() => null);

  if (!detail) {
    notFound();
  }

  const cityId = resolveCityFilterId(detail);
  const cityIds = [cityId];
  const { cityName } = detail;

  const [
    upcomingOpen,
    hotInner,
    latestOpen,
    latestVideos,
    institutions,
    trainers,
    allCities,
  ] = await Promise.all([
    getCourseList({
      page: 1,
      size: 10,
      isOpen: true,
      cityIds,
      enrollStatus: 'ENROLLING',
      sortBy: 'time',
    }).catch(() => emptyPage),
    getCourseList({
      page: 1,
      size: 10,
      isOpen: false,
      trainerCityId: cityId,
      sortBy: 'viewCount',
    }).catch(() => emptyPage),
    getCourseList({
      page: 1,
      size: 10,
      isOpen: true,
      cityIds,
      sortBy: 'time',
    }).catch(() => emptyPage),
    getVideoList({ page: 1, size: 10, sortBy: 'time' }).catch(() => emptyPage),
    getInstitutionList({
      page: 1,
      size: 20,
      cityId,
      sort: 'newly_joined',
    }).catch(() => emptyPage),
    getTrainerList({
      page: 1,
      size: 20,
      cityId,
      sort: 'newly_joined',
    }).catch(() => emptyPage),
    getActiveCities(50).catch(() => []),
  ]);

  const latestItems = mergeLatestCityCourses(latestOpen.list, latestVideos.list, 10);

  return (
    <main className="max-w-7xl mx-auto px-8 py-6 min-h-screen flex flex-col gap-6">
      <PageBreadcrumb items={[{ label: `${cityName}培训频道` }]} />

      <section className="rounded-lg border border-slate-100 bg-gradient-to-r from-primary/5 to-orange-50/80 px-6 py-5">
        <h1 className="text-2xl font-bold text-slate-900 m-0">
          {cityName}培训课程与资源汇总
        </h1>
      </section>

      <CityChannelSection
        title={`最近开课${cityName}公开课`}
        isEmpty={upcomingOpen.list.length === 0}
        emptyText={`暂无${cityName}公开课排期`}
        viewMoreHref={cityOpenCourseListPath(detail.enName)}
        viewMoreLabel="查看更多公开课"
      >
        <CityCourseScheduleList
          title=""
          cityName={cityName}
          courses={upcomingOpen.list}
          emptyText=""
        />
      </CityChannelSection>

      <CityChannelSection
        title={`${cityName}本月热门内训课`}
        isEmpty={hotInner.list.length === 0}
        emptyText={`暂无${cityName}热门内训课`}
      >
        <CityInnerCourseList cityName={cityName} courses={hotInner.list} />
      </CityChannelSection>

      <CityChannelSection
        title={`最新${cityName}培训课程`}
        isEmpty={latestItems.length === 0}
        emptyText={`暂无${cityName}最新课程`}
      >
        <CityLatestCourseList cityName={cityName} items={latestItems} />
      </CityChannelSection>

      <CityChannelSection
        title={`最新${cityName}培训机构`}
        isEmpty={institutions.list.length === 0}
        emptyText={`暂无${cityName}入驻机构`}
        viewMoreHref={cityInstitutionListPath(detail.enName)}
        viewMoreLabel="查看更多机构"
      >
        <CityInstitutionFlowList cityName={cityName} institutions={institutions.list} />
      </CityChannelSection>

      <CityChannelSection
        title={`最新${cityName}授课专家`}
        isEmpty={trainers.list.length === 0}
        emptyText={`暂无${cityName}授课专家`}
        viewMoreHref={cityTrainerListPath(detail.enName)}
        viewMoreLabel="查看更多专家"
      >
        <CityTrainerFlowList
          cityName={cityName}
          cityEnName={detail.enName}
          trainers={trainers.list}
        />
      </CityChannelSection>

      <CityNavGrid cities={allCities} currentEnName={detail.enName} />
    </main>
  );
}
