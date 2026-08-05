import { permanentRedirect } from 'next/navigation';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { TrainerListSection } from '@/features/trainer/components/list/TrainerListSection';
import { PxbTrainerListSection } from '@/features/trainer/components/pxb/PxbTrainerListSection';
import {
  parsePxbTrainerListUrl,
  pxbTrainerListParams,
} from '@/features/trainer/components/pxb/pxb-trainer-list-url';
import { parseListPageFromSearchParams } from '@/lib/list-page';
import { filtersToHtmPath, parseSlug } from '@/features/trainer/utils/url';
import { getTrainerList } from '@/features/trainer/api/service';
import {
  loadCategoryExpertTrainers,
  loadTrainerListRecommended,
  loadTrainerPageCases,
} from '@/features/recommendation/api/loaders';
import {
  canonicalizeTrainerSlugField,
  filterStandardTrainerExpertiseTree,
  resolveExpertiseCategoryId,
} from '@/features/trainer/utils/expertise-categories';
import { buildTrainerCategoryNavItems } from '@/lib/channel-category-stats';
import {
  getCachedTrainerExpertiseTree,
  getCachedTrainerIndustryTree,
} from '@/lib/cached-categories';
import { isPxbEmbedOrigin } from '@/lib/pxb-embed';
import { trainerListMetadata, trainerListH1 } from '@/lib/seo';
import { slugParamsToTrainerListParams } from '@/features/trainer/utils/list-params';

function embedSearchParams(
  sp: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (key === 'origin' || value == null) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else {
      params.set(key, value);
    }
  }
  return params;
}

type TrainersPageProps = {
  searchParams: Promise<{
    origin?: string;
    page?: string;
    slug?: string;
    keyword?: string;
    expertiseCategoryId?: string;
    industryCategoryId?: string;
    provinceId?: string;
    cityId?: string;
    quality?: string;
    sortBy?: string;
  }>;
};

export async function generateMetadata({ searchParams }: TrainersPageProps) {
  const sp = await searchParams;
  if (isPxbEmbedOrigin(sp.origin)) {
    return { title: '讲师列表' };
  }
  const slugParams = parseSlug(sp.slug || '');
  const page = parseListPageFromSearchParams(
    new URLSearchParams(sp.page != null ? `page=${sp.page}` : ''),
  );
  return trainerListMetadata({
    city: slugParams.region,
    industry: slugParams.industry,
    field: slugParams.field,
  }, filtersToHtmPath({ ...slugParams, page: slugParams.page ?? page }));
}

export default async function TrainersPage({ searchParams }: TrainersPageProps) {
  const sp = await searchParams;
  const rawExpertiseTreePromise = getCachedTrainerExpertiseTree();
  const expertiseTreePromise = rawExpertiseTreePromise.then(filterStandardTrainerExpertiseTree);
  const industryTreePromise = getCachedTrainerIndustryTree();

  if (isPxbEmbedOrigin(sp.origin)) {
    const urlState = parsePxbTrainerListUrl(embedSearchParams(sp));
    const [initialData, expertiseTree, industryTree] = await Promise.all([
      getTrainerList(pxbTrainerListParams(urlState)).catch(() => ({
        list: [],
        total: 0,
        page: urlState.page,
        size: 15,
        totalPages: 0,
      })),
      expertiseTreePromise,
      industryTreePromise,
    ]);

    return (
      <PxbTrainerListSection
        initialData={initialData}
        expertiseTree={expertiseTree}
        industryTree={industryTree}
      />
    );
  }

  const page = parseListPageFromSearchParams(
    new URLSearchParams(sp.page != null ? `page=${sp.page}` : ''),
  );

  const slugParams = parseSlug(sp.slug || '');
  // .htm SEO URL 把 page 写在 slug 里（/trainer/page=2.htm），优先于 ?page=
  const listPage = slugParams.page ?? page;

  // 旧 field=一级_二级 且二级名唯一 → 301 到仅二级名
  if (slugParams.field?.includes('_')) {
    const expertiseTreeForCanon = await expertiseTreePromise;
    const canonicalField = canonicalizeTrainerSlugField(expertiseTreeForCanon, slugParams.field);
    if (canonicalField) {
      permanentRedirect(
        filtersToHtmPath({
          ...slugParams,
          field: canonicalField,
        }),
      );
    }
  }

  const categoryNavPromise = expertiseTreePromise.then(buildTrainerCategoryNavItems).catch(() => []);
  const needsTreeForFilters = Boolean(slugParams.field || slugParams.industry);

  const listPromise = needsTreeForFilters
    ? Promise.all([expertiseTreePromise, industryTreePromise]).then(
        ([expertiseTree, industryTree]) => {
          const params = slugParamsToTrainerListParams(slugParams, expertiseTree, industryTree, {
            page: listPage,
            size: 16,
            sort: 'default',
          });
          if (slugParams.region) params.region = slugParams.region;
          return getTrainerList(params).catch(() => ({
            list: [],
            total: 0,
            page: listPage,
            size: 16,
            totalPages: 0,
          }));
        },
      )
    : getTrainerList({
        page: listPage,
        size: 16,
        sort: 'default',
        ...(slugParams.region ? { region: slugParams.region } : {}),
      }).catch(() => ({
        list: [],
        total: 0,
        page: listPage,
        size: 16,
        totalPages: 0,
      }));

  const [expertiseTree, industryTree, recommendedTrainers, recentCases, initialData, categoryExpertTrainers] =
    await Promise.all([
      expertiseTreePromise,
      industryTreePromise,
      loadTrainerListRecommended(12),
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
    <main className="max-w-7xl mx-auto px-4 py-6 min-h-screen flex flex-col gap-6 sm:px-8">
      <PageBreadcrumb items={[{ label: '培训专家' }]} />
      <h1 className="sr-only">{listH1}</h1>

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
