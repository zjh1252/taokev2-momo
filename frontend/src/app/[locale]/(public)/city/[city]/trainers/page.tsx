import { notFound } from 'next/navigation';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { TrainerListSection } from '@/features/trainer/components/list/TrainerListSection';
import { getCityByEnNameCached } from '@/features/city/api/server';
import { cityChannelPath } from '@/features/city/lib/paths';
import { resolveCityFilterId } from '@/features/city/lib/filter-city-id';
import { getTrainerList } from '@/features/trainer/api/service';
import {
  loadTrainerListRecommended,
  loadTrainerPageCases
} from '@/features/recommendation/api/loaders';
import { buildTrainerCategoryNavItems } from '@/lib/channel-category-stats';
import {
  getCachedTrainerExpertiseTree,
  getCachedTrainerIndustryTree,
} from '@/lib/cached-categories';
import { trainerListMetadata, trainerListH1 } from '@/lib/seo';
import { filterStandardTrainerExpertiseTree } from '@/features/trainer/utils/expertise-categories';
import { slugParamsToTrainerListParams } from '@/features/trainer/utils/list-params';
import type { TrainerSlugParams } from '@/features/trainer/utils/url';

interface Props {
  params: Promise<{ city: string }>;
  searchParams: Promise<{ field?: string; industry?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { city } = await params;
  const detail = await getCityByEnNameCached(city).catch(() => null);
  if (!detail) return { title: '城市培训专家 - 淘课网' };
  return trainerListMetadata({ city: detail.cityName });
}

export default async function CityTrainerListPage({
  params,
  searchParams,
}: Props) {
  const { city } = await params;
  const sp = await searchParams;
  const detail = await getCityByEnNameCached(city).catch(() => null);
  if (!detail) notFound();

  const rawExpertiseTreePromise = getCachedTrainerExpertiseTree();
  const expertiseTreePromise = rawExpertiseTreePromise.then(filterStandardTrainerExpertiseTree);
  const categoryNavPromise = expertiseTreePromise.then(buildTrainerCategoryNavItems).catch(() => []);

  const cityId = resolveCityFilterId(detail);
  const slugParams: TrainerSlugParams = {
    field: sp.field || undefined,
    industry: sp.industry || undefined,
    region: detail.cityName,
  };

  const listPromise = Promise.all([
    expertiseTreePromise,
    getCachedTrainerIndustryTree(),
  ]).then(([expertiseTree, industryTree]) =>
    getTrainerList(
      slugParamsToTrainerListParams(slugParams, expertiseTree, industryTree, {
        page: 1,
        size: 16,
        sort: 'newly_joined',
        cityId,
      }),
    ).catch(() => ({
      list: [],
      total: 0,
      page: 1,
      size: 16,
      totalPages: 0,
    })),
  );

  const [expertiseTree, industryTree, recommendedTrainers, recentCases, initialData] =
    await Promise.all([
      expertiseTreePromise,
      getCachedTrainerIndustryTree(),
      loadTrainerListRecommended(9),
      loadTrainerPageCases(10),
      listPromise,
    ]);

  return (
    <main className="max-w-7xl mx-auto px-8 py-6 min-h-screen flex flex-col gap-6">
      <PageBreadcrumb
        items={[
          { label: `${detail.cityName}培训频道`, href: cityChannelPath(detail.enName) },
          { label: '培训专家' },
        ]}
      />
      <h1 className="text-2xl font-bold text-slate-900">
        {trainerListH1({ city: detail.cityName, field: slugParams.field, industry: slugParams.industry })}
      </h1>
      <TrainerListSection
        initialData={initialData}
        expertiseTree={expertiseTree}
        industryTree={industryTree}
        recommendedTrainers={recommendedTrainers}
        recentCases={recentCases}
        initialSlugParams={slugParams}
        lockedCityId={cityId}
        bottomCategoryNav={{
          title: '专家擅长领域',
          countUnit: '位',
          itemsPromise: categoryNavPromise,
        }}
      />
    </main>
  );
}
