import { Suspense } from 'react';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { InnerCourseListSection } from '@/features/course/components/inner/InnerCourseListSection';
import { PxbInnerCourseListSection } from '@/features/course/components/open/pxb/PxbInnerCourseListSection';
import {
  parsePxbInternalCourseUrl,
  pxbInternalCourseListParams,
} from '@/features/course/components/open/pxb/pxb-internal-course-url';
import { getCourseList } from '@/features/course/api/service';
import { getInstitutionDetail } from '@/features/institution/api/service';
import { buildCourseCategoryNavItems } from '@/lib/channel-category-stats';
import { getCachedCourseCategoryTree } from '@/lib/cached-categories';
import { isPxbEmbedOrigin } from '@/lib/pxb-embed';
import { innerCourseListMetadata, innerCourseListH1 } from '@/lib/seo';
import { firstStringValue, normalizeNumberIds } from '@/lib/search-params';
import type { ChannelCategoryNavItem } from '@/components/layout/channel-category-nav';
import type { CategoryTreeNode } from '@/features/course/api/types';

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
    categoryIds?: string | string[];
    categoryName?: string | string[];
    page?: string;
    keyword?: string;
    categoryId?: string;
    subCategoryId?: string;
    provinceId?: string;
    cityId?: string;
    pricePreset?: string;
    priceMin?: string;
    priceMax?: string;
    minScore?: string;
    sortBy?: string;
  }>;
}

export async function generateMetadata({ searchParams }: Props) {
  const sp = await searchParams;
  if (isPxbEmbedOrigin(sp.origin)) {
    return { title: '内训课列表' };
  }
  return innerCourseListMetadata({
    category: firstStringValue(sp.categoryName),
  });
}

async function InnerCourseListBody({
  validInstitutionId,
  initialCategoryId,
  initialCategoryName,
  categoryNavPromise,
  categoryTreePromise,
}: {
  validInstitutionId?: number;
  initialCategoryId?: number;
  initialCategoryName?: string;
  categoryNavPromise: Promise<ChannelCategoryNavItem[]>;
  categoryTreePromise: Promise<CategoryTreeNode[]>;
}) {
  const [initialData, categoryTree, institution] = await Promise.all([
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
    validInstitutionId
      ? getInstitutionDetail(validInstitutionId).catch(() => null)
      : Promise.resolve(null),
  ]);

  return (
    <InnerCourseListSection
      initialData={initialData}
      categoryTree={categoryTree}
      initialInstitutionId={validInstitutionId}
      initialInstitutionName={institution?.orgName}
      initialCategoryId={initialCategoryId}
      initialCategoryName={initialCategoryName}
      bottomCategoryNav={{
        title: '内训课课程分类',
        countUnit: '门',
        itemsPromise: categoryNavPromise,
      }}
    />
  );
}

export default async function InnerCoursesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const categoryTreePromise = getCachedCourseCategoryTree();

  if (isPxbEmbedOrigin(sp.origin)) {
    const urlState = parsePxbInternalCourseUrl(embedSearchParams(sp));
    const [initialData, categoryTree] = await Promise.all([
      getCourseList(pxbInternalCourseListParams(urlState)).catch(() => ({
        list: [],
        total: 0,
        page: urlState.page,
        size: 15,
        totalPages: 0,
      })),
      categoryTreePromise,
    ]);

    return <PxbInnerCourseListSection initialData={initialData} categoryTree={categoryTree} />;
  }

  const institutionId = sp.institutionId ? Number(sp.institutionId) : undefined;
  const validInstitutionId = institutionId && !isNaN(institutionId) ? institutionId : undefined;
  const categoryIds = normalizeNumberIds(sp.categoryIds);
  const initialCategoryId = categoryIds[0];
  const initialCategoryName = firstStringValue(sp.categoryName);

  const categoryNavPromise = categoryTreePromise
    .then((tree) => buildCourseCategoryNavItems(tree, false, '/inhousecourse'))
    .catch(() => [] as ChannelCategoryNavItem[]);

  const listH1 = innerCourseListH1({
    category: initialCategoryName,
  });

  return (
    <main className="max-w-7xl mx-auto px-8 py-6 min-h-screen flex flex-col gap-6">
      <PageBreadcrumb items={[{ label: '内训课' }]} />
      <h1 className="text-2xl font-bold text-slate-900">{listH1}</h1>

      <Suspense
        fallback={<div className="min-h-[480px] animate-pulse rounded-xl bg-slate-100" />}
      >
        <InnerCourseListBody
          validInstitutionId={validInstitutionId}
          initialCategoryId={initialCategoryId}
          initialCategoryName={initialCategoryName}
          categoryNavPromise={categoryNavPromise}
          categoryTreePromise={categoryTreePromise}
        />
      </Suspense>
    </main>
  );
}
