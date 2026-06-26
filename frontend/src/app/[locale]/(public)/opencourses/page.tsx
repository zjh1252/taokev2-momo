import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { OpenCourseListSection } from '@/features/course/components/open/OpenCourseListSection';
import { getCourseList } from '@/features/course/api/service';
import { getInstitutionDetail } from '@/features/institution/api/service';
import { buildCourseCategoryNavItems } from '@/lib/channel-category-stats';
import { getCachedCourseCategoryTree } from '@/lib/cached-categories';
import { openCourseListMetadata, openCourseListH1 } from '@/lib/seo';
import { normalizeNumberIds, normalizeStringValues } from '@/lib/search-params';

interface Props {
  searchParams: Promise<{
    institutionId?: string;
    /** 锁定城市 ID（来自 /cities/[pinyin] 跳转，单选） */
    cityIds?: string | string[];
    /** 锁定城市展示名（与 cityIds 一一对应） */
    cityName?: string | string[];
    categoryIds?: string | string[];
    categoryName?: string | string[];
    provinceIds?: string | string[];
    provinceName?: string | string[];
  }>;
}

export async function generateMetadata({ searchParams }: Props) {
  const sp = await searchParams;
  const cityNames = normalizeStringValues(sp.cityName);
  const categoryNames = normalizeStringValues(sp.categoryName);
  return openCourseListMetadata({
    city: cityNames[0],
    category: categoryNames[0],
  });
}

export default async function OpenCoursesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const institutionId = sp.institutionId ? Number(sp.institutionId) : undefined;
  const validInstitutionId = institutionId && !isNaN(institutionId) ? institutionId : undefined;
  const cityIds = normalizeNumberIds(sp.cityIds);
  const cityNames = normalizeStringValues(sp.cityName);
  const categoryIds = normalizeNumberIds(sp.categoryIds);
  const categoryNames = normalizeStringValues(sp.categoryName);
  const provinceIds = normalizeNumberIds(sp.provinceIds);
  const provinceNames = normalizeStringValues(sp.provinceName);

  const categoryTreePromise = getCachedCourseCategoryTree();
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
      {/* 面包屑导航 — 公共组件 */}
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
        initialProvinceIds={provinceIds.length > 0 ? provinceIds : undefined}
        initialProvinceNames={provinceNames.length > 0 ? provinceNames : undefined}
        bottomCategoryNav={{
          title: '公开课课程分类',
          countUnit: '门',
          itemsPromise: categoryNavPromise,
        }}
      />
    </main>
  );
}
