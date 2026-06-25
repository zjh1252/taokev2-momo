import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { ChannelCategoryNavSection } from '@/components/layout/channel-category-nav-section';
import { OpenCourseListSection } from '@/features/course/components/open/OpenCourseListSection';
import { PxbOpenCourseListSection } from '@/features/course/components/open/pxb/PxbOpenCourseListSection';
import {
  parsePxbOpenCourseUrl,
  pxbOpenCourseListParams,
} from '@/features/course/components/open/pxb/pxb-open-course-url';
import { getCourseList } from '@/features/course/api/service';
import { getInstitutionDetail } from '@/features/institution/api/service';
import { buildCourseCategoryNavItems } from '@/lib/channel-category-stats';
import { getCachedCourseCategoryTree } from '@/lib/cached-categories';
import { isPxbEmbedOrigin } from '@/lib/pxb-embed';
import { openCourseListMetadata, openCourseListH1 } from '@/lib/seo';
import { normalizeNumberIds, normalizeStringValues } from '@/lib/search-params';

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

interface Props {
  searchParams: Promise<{
    origin?: string;
    institutionId?: string;
    cityIds?: string | string[];
    cityName?: string | string[];
    categoryIds?: string | string[];
    categoryName?: string | string[];
    page?: string;
    keyword?: string;
    categoryId?: string;
    subCategoryId?: string;
    provinceId?: string;
    cityId?: string;
    timeQuick?: string;
    startTimeFrom?: string;
    startTimeTo?: string;
    pricePreset?: string;
    priceMin?: string;
    priceMax?: string;
    minScore?: string;
    enrollStatus?: string;
    sortBy?: string;
  }>;
}

export async function generateMetadata({ searchParams }: Props) {
  const sp = await searchParams;
  if (isPxbEmbedOrigin(sp.origin)) {
    return { title: '公开课列表' };
  }
  const cityNames = normalizeStringValues(sp.cityName);
  const categoryNames = normalizeStringValues(sp.categoryName);
  return openCourseListMetadata({
    city: cityNames[0],
    category: categoryNames[0],
  });
}

export default async function OpenCoursesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const categoryTreePromise = getCachedCourseCategoryTree();

  if (isPxbEmbedOrigin(sp.origin)) {
    const urlState = parsePxbOpenCourseUrl(embedSearchParams(sp));
    const [initialData, categoryTree] = await Promise.all([
      getCourseList(pxbOpenCourseListParams(urlState)).catch(() => ({
        list: [],
        total: 0,
        page: urlState.page,
        size: 15,
        totalPages: 0,
      })),
      categoryTreePromise,
    ]);

    return <PxbOpenCourseListSection initialData={initialData} categoryTree={categoryTree} />;
  }

  const institutionId = sp.institutionId ? Number(sp.institutionId) : undefined;
  const validInstitutionId = institutionId && !isNaN(institutionId) ? institutionId : undefined;
  const cityIds = normalizeNumberIds(sp.cityIds);
  const cityNames = normalizeStringValues(sp.cityName);
  const categoryIds = normalizeNumberIds(sp.categoryIds);
  const categoryNames = normalizeStringValues(sp.categoryName);

  const categoryNavPromise = categoryTreePromise
    .then((tree) => buildCourseCategoryNavItems(tree, true, '/opencourse'))
    .catch(() => []);

  const [initialData, categoryTree, institution] = await Promise.all([
    getCourseList({
      page: 1,
      size: 15,
      isOpen: true,
      institutionId: validInstitutionId,
      cityIds: cityIds.length > 0 ? cityIds : undefined,
      categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
    }).catch(() => ({
      list: [],
      total: 0,
      page: 1,
      size: 15,
      totalPages: 0,
    })),
    categoryTreePromise,
    validInstitutionId
      ? getInstitutionDetail(validInstitutionId).catch(() => null)
      : Promise.resolve(null),
  ]);

  const listH1 = openCourseListH1({
    city: cityNames[0],
    category: categoryNames[0],
  });

  return (
    <main className="max-w-7xl mx-auto px-8 py-6 min-h-screen flex flex-col gap-6">
      <PageBreadcrumb items={[{ label: '公开课' }]} />
      <h1 className="text-2xl font-bold text-slate-900">{listH1}</h1>

      <OpenCourseListSection
        initialData={initialData}
        categoryTree={categoryTree}
        initialInstitutionId={validInstitutionId}
        initialInstitutionName={institution?.orgName}
        initialCityIds={cityIds.length > 0 ? cityIds : undefined}
        initialCityNames={cityNames.length > 0 ? cityNames : undefined}
        initialCategoryIds={categoryIds.length > 0 ? categoryIds : undefined}
        initialCategoryNames={categoryNames.length > 0 ? categoryNames : undefined}
      />

      <ChannelCategoryNavSection
        title="公开课课程分类"
        countUnit="门"
        itemsPromise={categoryNavPromise}
      />
    </main>
  );
}
