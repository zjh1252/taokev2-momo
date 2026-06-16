import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { ChannelCategoryNavSection } from '@/components/layout/channel-category-nav-section';
import { InnerCourseListSection } from '@/features/course/components/inner/InnerCourseListSection';
import { getCourseList } from '@/features/course/api/service';
import { getInstitutionDetail } from '@/features/institution/api/service';
import { buildCourseCategoryNavItems } from '@/lib/channel-category-stats';
import {
  getCachedCourseCategoryTree,
  getCachedTrainerIndustryTree,
} from '@/lib/cached-categories';
import { innerCourseListMetadata, innerCourseListH1 } from '@/lib/seo';
import { firstStringValue, normalizeNumberIds } from '@/lib/search-params';

interface Props {
  searchParams: Promise<{
    institutionId?: string;
    categoryIds?: string | string[];
    categoryName?: string | string[];
  }>;
}

export async function generateMetadata({ searchParams }: Props) {
  const sp = await searchParams;
  return innerCourseListMetadata({
    category: firstStringValue(sp.categoryName),
  });
}

export default async function InnerCoursesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const institutionId = sp.institutionId ? Number(sp.institutionId) : undefined;
  const validInstitutionId = institutionId && !isNaN(institutionId) ? institutionId : undefined;
  const categoryIds = normalizeNumberIds(sp.categoryIds);
  const initialCategoryId = categoryIds[0];
  const initialCategoryName = firstStringValue(sp.categoryName);

  const categoryTreePromise = getCachedCourseCategoryTree();
  const categoryNavPromise = categoryTreePromise
    .then((tree) => buildCourseCategoryNavItems(tree, false, '/inhousecourse'))
    .catch(() => []);

  const [initialData, categoryTree, industryTree, institution] = await Promise.all([
    getCourseList({
      page: 1,
      size: 15,
      isOpen: false,
      institutionId: validInstitutionId,
      categoryIds: initialCategoryId ? [initialCategoryId] : undefined,
    }).catch(() => ({
      list: [],
      total: 0,
      page: 1,
      size: 15,
      totalPages: 0,
    })),
    categoryTreePromise,
    getCachedTrainerIndustryTree(),
    validInstitutionId
      ? getInstitutionDetail(validInstitutionId).catch(() => null)
      : Promise.resolve(null),
  ]);

  const listH1 = innerCourseListH1({
    category: initialCategoryName,
  });

  return (
    <main className="max-w-7xl mx-auto px-8 py-6 min-h-screen flex flex-col gap-6">
      {/* 面包屑导航 — 公共组件 */}
      <PageBreadcrumb items={[{ label: '内训课' }]} />
      <h1 className="text-2xl font-bold text-slate-900">{listH1}</h1>

      <InnerCourseListSection
        initialData={initialData}
        categoryTree={categoryTree}
        industryTree={industryTree}
        initialInstitutionId={validInstitutionId}
        initialInstitutionName={institution?.orgName}
        initialCategoryId={initialCategoryId}
        initialCategoryName={initialCategoryName}
      />

      <ChannelCategoryNavSection
        title="内训课课程分类"
        countUnit="门"
        itemsPromise={categoryNavPromise}
      />
    </main>
  );
}
