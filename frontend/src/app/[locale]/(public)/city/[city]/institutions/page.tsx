import { notFound } from 'next/navigation';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { InstitutionListSection } from '@/features/institution/components/list/InstitutionListSection';
import { getCityByEnNameCached } from '@/features/city/api/server';
import { cityChannelPath } from '@/features/city/lib/paths';
import { resolveCityFilterId } from '@/features/city/lib/filter-city-id';
import { getInstitutionList } from '@/features/institution/api/service';
import { loadGoldInstitutions } from '@/features/recommendation/api/loaders';
import { getCachedTrainerExpertiseTree } from '@/lib/cached-categories';
import { buildInstitutionCategoryLinks } from '@/lib/institution-category-nav';
import { institutionListMetadata, institutionListH1 } from '@/lib/seo';

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { city } = await params;
  const detail = await getCityByEnNameCached(city).catch(() => null);
  if (!detail) return { title: '城市培训机构 - 淘课网' };
  return institutionListMetadata({ city: detail.cityName });
}

export default async function CityInstitutionListPage({ params }: Props) {
  const { city } = await params;
  const detail = await getCityByEnNameCached(city).catch(() => null);
  if (!detail) notFound();

  const cityId = resolveCityFilterId(detail);

  // 一次列表请求同时供首屏分页与金牌推荐回退池，避免同城再打 size=50
  const [initialData, expertiseTree] = await Promise.all([
    getInstitutionList({
      page: 1,
      size: 15,
      cityId,
      sort: 'newly_joined',
    }).catch(() => ({
      list: [],
      total: 0,
      page: 1,
      size: 15,
      totalPages: 0,
    })),
    getCachedTrainerExpertiseTree(),
  ]);

  const initialGoldRecommends = await loadGoldInstitutions(initialData.list, 4);
  const categoryItems = buildInstitutionCategoryLinks(expertiseTree, '/company');

  return (
    <main className="max-w-7xl mx-auto px-8 py-6 min-h-screen flex flex-col gap-6">
      <PageBreadcrumb
        items={[
          { label: `${detail.cityName}培训频道`, href: cityChannelPath(detail.enName) },
          { label: '培训机构' },
        ]}
      />
      <h1 className="text-2xl font-bold text-slate-900">
        {institutionListH1({ city: detail.cityName })}
      </h1>
      <InstitutionListSection
        initialData={initialData}
        initialGoldRecommends={initialGoldRecommends}
        categoryItems={categoryItems}
        categoryTitle="培训机构类别"
        lockedCityId={cityId}
      />
    </main>
  );
}
