import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { TrainerListSection } from '@/features/trainer/components/list/TrainerListSection';
import { parseListPageFromSearchParams } from '@/lib/list-page';
import { parseSlug } from '@/features/trainer/utils/url';
import { getTrainerList } from '@/features/trainer/api/service';
import {
  loadCategoryExpertTrainers,
  loadTrainerListRecommended,
  loadTrainerPageCases
} from '@/features/recommendation/api/loaders';
import { resolveExpertiseCategoryId } from '@/features/trainer/utils/expertise-categories';
import { buildTrainerCategoryNavItems } from '@/lib/channel-category-stats';
import {
  getCachedTrainerExpertiseTree,
  getCachedTrainerIndustryTree,
} from '@/lib/cached-categories';
import { trainerListMetadata, trainerListH1 } from '@/lib/seo';
import { filterStandardTrainerExpertiseTree } from '@/features/trainer/utils/expertise-categories';
import { slugParamsToTrainerListParams } from '@/features/trainer/utils/list-params';

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

  const slugParams = parseSlug(sp.slug || '');

  const rawExpertiseTreePromise = getCachedTrainerExpertiseTree();
  const expertiseTreePromise = rawExpertiseTreePromise.then(filterStandardTrainerExpertiseTree);
  const categoryNavPromise = expertiseTreePromise.then(buildTrainerCategoryNavItems).catch(() => []);

  const listPromise = Promise.all([
    expertiseTreePromise,
    getCachedTrainerIndustryTree(),
  ]).then(([expertiseTree, industryTree]) =>
    getTrainerList(
      slugParamsToTrainerListParams(slugParams, expertiseTree, industryTree, {
        page,
        size: 16,
        sort: 'default',
      }),
    ).catch(() => ({
      list: [],
      total: 0,
      page,
      size: 16,
      totalPages: 0,
    })),
  );

  const [expertiseTree, industryTree, recommendedTrainers, recentCases, initialData, categoryExpertTrainers] =
    await Promise.all([
      expertiseTreePromise,
      getCachedTrainerIndustryTree(),
      loadTrainerListRecommended(9),
      loadTrainerPageCases(10),
      listPromise,
      expertiseTreePromise.then((tree) => {
        const categoryId = resolveExpertiseCategoryId(tree, slugParams.field);
        return categoryId ? loadCategoryExpertTrainers(categoryId, 3) : Promise.resolve([]);
      }),
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
        categoryExpertTrainers={categoryExpertTrainers}
        initialSlugParams={slugParams}
        bottomCategoryNav={{
          title: '推荐讲师分类',
          countUnit: '位',
          itemsPromise: categoryNavPromise,
        }}
      />
    </main>
  );
}
