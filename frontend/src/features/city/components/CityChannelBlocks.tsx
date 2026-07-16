import { getCourseList } from '@/features/course/api/service';
import { getInstitutionList } from '@/features/institution/api/service';
import { getTrainerList } from '@/features/trainer/api/service';
import { getVideoList } from '@/features/video/api/service';
import { getActiveCitiesCached } from '@/features/city/api/server';
import type { CityChannelDetail } from '@/features/city/api/types';
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

const emptyPage = { list: [], total: 0, page: 1, size: 10, totalPages: 0 };

interface CityBlockProps {
  detail: CityChannelDetail;
  cityId: number;
}

/** 最近开课公开课（计划时间排序，所有城市共用同一数据口径） */
export async function CityUpcomingOpenBlock({ detail, cityId }: CityBlockProps) {
  const upcomingOpen = await getCourseList({
    page: 1,
    size: 10,
    isOpen: true,
    cityIds: [cityId],
    enrollStatus: 'ENROLLING',
    sortBy: 'time',
  }).catch(() => emptyPage);

  return (
    <CityChannelSection
      title={`最近开课${detail.cityName}公开课`}
      isEmpty={upcomingOpen.list.length === 0}
      emptyText={`暂无${detail.cityName}公开课排期`}
      viewMoreHref={cityOpenCourseListPath(detail.enName)}
      viewMoreLabel="查看更多公开课"
    >
      <CityCourseScheduleList
        title=""
        cityName={detail.cityName}
        courses={upcomingOpen.list}
        emptyText=""
      />
    </CityChannelSection>
  );
}

/** 热门内训 */
export async function CityHotInnerBlock({ detail, cityId }: CityBlockProps) {
  const hotInner = await getCourseList({
    page: 1,
    size: 10,
    isOpen: false,
    trainerCityId: cityId,
    sortBy: 'viewCount',
  }).catch(() => emptyPage);

  return (
    <CityChannelSection
      title={`${detail.cityName}本月热门内训课`}
      isEmpty={hotInner.list.length === 0}
      emptyText={`暂无${detail.cityName}热门内训课`}
    >
      <CityInnerCourseList cityName={detail.cityName} courses={hotInner.list} />
    </CityChannelSection>
  );
}

/** 最新公开课 + 录播课（published 排序，避开计划维重查询） */
export async function CityLatestBlock({ detail, cityId }: CityBlockProps) {
  const [latestOpen, latestVideos] = await Promise.all([
    getCourseList({
      page: 1,
      size: 10,
      isOpen: true,
      cityIds: [cityId],
      sortBy: 'published',
    }).catch(() => emptyPage),
    getVideoList({ page: 1, size: 10, sortBy: 'time' }).catch(() => emptyPage),
  ]);
  const latestItems = mergeLatestCityCourses(latestOpen.list, latestVideos.list, 10);

  return (
    <CityChannelSection
      title={`最新${detail.cityName}培训课程`}
      isEmpty={latestItems.length === 0}
      emptyText={`暂无${detail.cityName}最新课程`}
    >
      <CityLatestCourseList cityName={detail.cityName} items={latestItems} />
    </CityChannelSection>
  );
}

/** 最新机构 */
export async function CityInstitutionsBlock({ detail, cityId }: CityBlockProps) {
  const institutions = await getInstitutionList({
    page: 1,
    size: 20,
    cityId,
    sort: 'newly_joined',
  }).catch(() => emptyPage);

  return (
    <CityChannelSection
      title={`最新${detail.cityName}培训机构`}
      isEmpty={institutions.list.length === 0}
      emptyText={`暂无${detail.cityName}入驻机构`}
      viewMoreHref={cityInstitutionListPath(detail.enName)}
      viewMoreLabel="查看更多机构"
    >
      <CityInstitutionFlowList cityName={detail.cityName} institutions={institutions.list} />
    </CityChannelSection>
  );
}

/** 最新专家 */
export async function CityTrainersBlock({ detail, cityId }: CityBlockProps) {
  const trainers = await getTrainerList({
    page: 1,
    size: 20,
    cityId,
    sort: 'newly_joined',
  }).catch(() => emptyPage);

  return (
    <CityChannelSection
      title={`最新${detail.cityName}授课专家`}
      isEmpty={trainers.list.length === 0}
      emptyText={`暂无${detail.cityName}授课专家`}
      viewMoreHref={cityTrainerListPath(detail.enName)}
      viewMoreLabel="查看更多专家"
    >
      <CityTrainerFlowList
        cityName={detail.cityName}
        cityEnName={detail.enName}
        trainers={trainers.list}
      />
    </CityChannelSection>
  );
}

/** 底部城市导航（非首屏，单独 Suspense） */
export async function CityNavBlock({ currentEnName }: { currentEnName: string }) {
  const allCities = await getActiveCitiesCached(50).catch(() => []);
  return <CityNavGrid cities={allCities} currentEnName={currentEnName} />;
}

/** 区块占位，避免流式空洞 */
export function CityBlockSkeleton({ title }: { title: string }) {
  return (
    <section className="rounded-lg border border-slate-100 bg-white">
      <div className="px-5 py-3 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-800 m-0">{title}</h2>
      </div>
      <div className="px-5 py-8 space-y-3 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-4 bg-slate-100 rounded w-2/3" />
        <div className="h-4 bg-slate-100 rounded w-1/2" />
      </div>
    </section>
  );
}
