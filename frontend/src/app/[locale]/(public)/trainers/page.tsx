import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { ChannelCategoryNav } from '@/components/layout/channel-category-nav';
import { TrainerListSection } from '@/features/trainer/components/list/TrainerListSection';
import { parseListPageFromSearchParams } from '@/lib/list-page';
import { parseSlug } from '@/features/trainer/utils/url';
import {
  getTrainerList,
  getTopRecommendedTrainers,
  getRecentTrainerCases,
} from '@/features/trainer/api/service';
import { buildTrainerCategoryNavItems } from '@/lib/channel-category-stats';
import {
  getCachedTrainerExpertiseTree,
  getCachedTrainerIndustryTree,
} from '@/lib/cached-categories';
import { trainerListMetadata, trainerListH1 } from '@/lib/seo';
import {
  filterStandardTrainerExpertiseTree,
  resolveExpertiseCategoryId,
} from '@/features/trainer/utils/expertise-categories';

type TrainersPageProps = {
  searchParams: Promise<{ page?: string; slug?: string }>;
};

export async function generateMetadata({ searchParams }: TrainersPageProps) {
  const sp = await searchParams;
  const slugParams = parseSlug(sp.slug || '');
  return trainerListMetadata({
    city: slugParams.region,
    industry: slugParams.industry,
    field: slugParams.field,
  });
}

export default async function TrainersPage({ searchParams }: TrainersPageProps) {
  const sp = await searchParams;
  const page = parseListPageFromSearchParams(
    new URLSearchParams(sp.page != null ? `page=${sp.page}` : ''),
  );

  // 解析 .htm URL 的 slug 参数为名称筛选条件
  const slugParams = parseSlug(sp.slug || '');

  const rawExpertiseTreePromise = getCachedTrainerExpertiseTree();
  const expertiseTreePromise = rawExpertiseTreePromise.then(filterStandardTrainerExpertiseTree);

  const [expertiseTree, industryTree, recommendedTrainers, recentCases, categoryNavItems, initialData] =
    await Promise.all([
      expertiseTreePromise,
      getCachedTrainerIndustryTree(),
      getTopRecommendedTrainers(9).catch(() => []),
      getRecentTrainerCases(10).catch(() => []),
      expertiseTreePromise.then(buildTrainerCategoryNavItems).catch(() => []),
      expertiseTreePromise.then((tree) =>
        getTrainerList({
          page,
          size: 16,
          expertiseCategoryId: resolveExpertiseCategoryId(tree, slugParams.field),
          industry: slugParams.industry,
          region: slugParams.region,
          sort: 'default',
        }).catch(() => ({
          list: [],
          total: 0,
          page,
          size: 16,
          totalPages: 0,
        })),
      ),
    ]);

  const listH1 = trainerListH1({
    city: slugParams.region,
    industry: slugParams.industry,
    field: slugParams.field,
  });

  return (
    <main className="max-w-7xl mx-auto px-8 py-6 min-h-screen flex flex-col gap-6">
      <PageBreadcrumb items={[{ label: '培训专家' }]} />
      <h1 className="text-2xl font-bold text-slate-900">{listH1}</h1>

      <TrainerListSection
        initialData={initialData}
        expertiseTree={expertiseTree}
        industryTree={industryTree}
        recommendedTrainers={recommendedTrainers}
        recentCases={recentCases}
        initialSlugParams={slugParams}
      />

      <ChannelCategoryNav
        title="推荐讲师分类"
        items={categoryNavItems}
        countUnit="位"
      />
    </main>
  );
}
