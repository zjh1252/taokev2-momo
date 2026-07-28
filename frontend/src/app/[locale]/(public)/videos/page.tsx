import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { VideoListSection } from '@/features/video/components/list/VideoListSection';
import { getVideoList } from '@/features/video/api/service';
import { getInstitutionDetail } from '@/features/institution/api/service';
import { buildVideoCategoryNavItems } from '@/lib/channel-category-stats';
import { getCachedVideoCategoryTree } from '@/lib/cached-categories';
import { videoListMetadata, videoListH1 } from '@/lib/seo';
import { firstStringValue, normalizeNumberIds } from '@/lib/search-params';
import type { CategoryTreeNode } from '@/features/video/api/types';

interface Props {
  searchParams: Promise<{
    institutionId?: string;
    categoryId?: string;
    categoryName?: string;
    sortBy?: string;
  }>;
}

function resolveVideoCategoryByName(
  categoryTree: CategoryTreeNode[],
  categoryName?: string,
): CategoryTreeNode | undefined {
  if (!categoryName) return undefined;
  return categoryTree.find((category) => category.name === categoryName);
}

export async function generateMetadata({ searchParams }: Props) {
  const sp = await searchParams;
  return videoListMetadata({
    category: firstStringValue(sp.categoryName),
  });
}

export default async function VideosPage({ searchParams }: Props) {
  const sp = await searchParams;
  const institutionId = sp.institutionId ? Number(sp.institutionId) : undefined;
  const validInstitutionId = institutionId && !isNaN(institutionId) ? institutionId : undefined;
  const requestedCategoryId = normalizeNumberIds(sp.categoryId ? [sp.categoryId] : undefined)[0];
  const requestedCategoryName = firstStringValue(sp.categoryName);
  const sortBy = firstStringValue(sp.sortBy);

  const categoryTreePromise = getCachedVideoCategoryTree();
  const categoryTree = await categoryTreePromise;
  const resolvedCategory = requestedCategoryId
    ? undefined
    : resolveVideoCategoryByName(categoryTree, requestedCategoryName);
  const categoryId = requestedCategoryId ?? resolvedCategory?.id;
  const categoryName = resolvedCategory?.name ?? requestedCategoryName;
  const categoryNavPromise = categoryTreePromise.then(buildVideoCategoryNavItems).catch(() => []);

  const [initialData, institution] = await Promise.all([
    getVideoList({
      page: 1,
      size: 15,
      institutionId: validInstitutionId,
      categoryId,
      sortBy: sortBy || undefined,
    }).catch(() => ({
      list: [],
      total: 0,
      page: 1,
      size: 15,
      totalPages: 0,
    })),
    validInstitutionId
      ? getInstitutionDetail(validInstitutionId).catch(() => null)
      : Promise.resolve(null),
  ]);

  const listH1 = videoListH1({ category: categoryName });

  return (
    <main className="max-w-7xl mx-auto px-8 py-6 min-h-screen flex flex-col gap-6">
      {/* 面包屑导航 — 公共组件 */}
      <PageBreadcrumb items={[{ label: '录播课' }]} />
      <h1 className="sr-only">{listH1}</h1>

      <VideoListSection
        initialData={initialData}
        categoryTree={categoryTree}
        initialInstitutionId={validInstitutionId}
        initialInstitutionName={institution?.orgName}
        initialCategoryId={categoryId}
        initialCategoryName={categoryName}
        initialSortBy={sortBy}
        bottomCategoryNav={{
          title: '可播放视频分类',
          countUnit: '门',
          itemsPromise: categoryNavPromise,
        }}
      />
    </main>
  );
}
