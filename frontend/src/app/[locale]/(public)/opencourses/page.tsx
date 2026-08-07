import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
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
import { openCourseListMetadata, pickCanonicalSearchParams, openCourseListH1 } from '@/lib/seo';
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
    /** 锁定城市 ID（来自 /cities/[pinyin] 跳转，单选） */
    cityIds?: string | string[];
    /** 锁定城市展示名（与 cityIds 一一对应） */
    cityName?: string | string[];
    categoryIds?: string | string[];
    categoryName?: string | string[];
    provinceIds?: string | string[];
    provinceName?: string | string[];
    page?: string;
    keyword?: string;
    categoryId?: string;
    subCategoryId?: string;
    provinceId?: string;
    cityId?: string;
    timeQuick?: string;
    timeQuickLabel?: string;
    startTimeFrom?: string;
    startTimeTo?: string;
    pricePreset?: string;
    priceLabel?: string;
    priceMin?: string;
    priceMax?: string;
    isFree?: string;
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
  }, '/opencourse', pickCanonicalSearchParams(sp, ['categoryName', 'cityName', 'page']));
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
  const provinceIds = normalizeNumberIds(sp.provinceIds);
  const provinceNames = normalizeStringValues(sp.provinceName);
  const timeQuick = sp.timeQuick?.trim() || undefined;
  const timeQuickLabel = sp.timeQuickLabel?.trim() || undefined;
  const startTimeFrom = sp.startTimeFrom?.trim() || undefined;
  const startTimeTo = sp.startTimeTo?.trim() || undefined;
  const priceLabel = sp.priceLabel?.trim() || undefined;
  const priceMin = sp.priceMin != null && sp.priceMin !== '' ? Number(sp.priceMin) : undefined;
  const priceMax = sp.priceMax != null && sp.priceMax !== '' ? Number(sp.priceMax) : undefined;
  const isFree = sp.isFree != null && sp.isFree !== '' ? Number(sp.isFree) : undefined;
  const validPriceMin = priceMin != null && Number.isFinite(priceMin) ? priceMin : undefined;
  const validPriceMax = priceMax != null && Number.isFinite(priceMax) ? priceMax : undefined;
  const validIsFree = isFree != null && Number.isFinite(isFree) ? isFree : undefined;

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
      provinceIds: provinceIds.length > 0 ? provinceIds : undefined,
      timeQuick,
      startTimeFrom,
      startTimeTo,
      priceMin: validPriceMin,
      priceMax: validPriceMax,
      isFree: validIsFree,
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
    <main className="max-w-7xl mx-auto px-4 py-6 min-h-screen flex flex-col gap-6 sm:px-8">
      {/* 面包屑导航 — 公共组件 */}
      <PageBreadcrumb items={[{ label: '公开课' }]} />
      <h1 className="sr-only">{listH1}</h1>

      <OpenCourseListSection
        initialData={initialData}
        categoryTree={categoryTree}
        initialInstitutionId={validInstitutionId}
        initialInstitutionName={institution?.orgName}
        initialCityIds={cityIds.length > 0 ? cityIds : undefined}
        initialCityNames={cityNames.length > 0 ? cityNames : undefined}
        initialCategoryIds={categoryIds.length > 0 ? categoryIds : undefined}
        initialCategoryNames={categoryNames.length > 0 ? categoryNames : undefined}
        initialProvinceIds={provinceIds.length > 0 ? provinceIds : undefined}
        initialProvinceNames={provinceNames.length > 0 ? provinceNames : undefined}
        initialTimeQuick={timeQuick}
        initialTimeQuickLabel={timeQuickLabel}
        initialStartTimeFrom={startTimeFrom}
        initialStartTimeTo={startTimeTo}
        initialPriceLabel={priceLabel}
        initialPriceMin={validPriceMin}
        initialPriceMax={validPriceMax}
        initialIsFree={validIsFree}
        bottomCategoryNav={{
          title: '公开课课程分类',
          countUnit: '门',
          itemsPromise: categoryNavPromise,
        }}
      />
    </main>
  );
}
