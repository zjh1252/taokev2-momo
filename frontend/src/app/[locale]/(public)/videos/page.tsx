import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { ChannelCategoryNavSection } from '@/components/layout/channel-category-nav-section';
import { VideoListSection } from '@/features/video/components/list/VideoListSection';
import { getVideoList } from '@/features/video/api/service';
import { getInstitutionDetail } from '@/features/institution/api/service';
import { buildVideoCategoryNavItems } from '@/lib/channel-category-stats';
import { getCachedVideoCategoryTree } from '@/lib/cached-categories';
import { videoListMetadata, videoListH1 } from '@/lib/seo';
import { firstStringValue, normalizeNumberIds } from '@/lib/search-params';

interface Props {
  searchParams: Promise<{
    institutionId?: string;
    categoryId?: string;
    categoryName?: string;
  }>;
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
  const categoryId = normalizeNumberIds(sp.categoryId ? [sp.categoryId] : undefined)[0];

  const categoryTreePromise = getCachedVideoCategoryTree();
  const categoryNavPromise = categoryTreePromise.then(buildVideoCategoryNavItems).catch(() => []);

  const [initialData, categoryTree, institution] = await Promise.all([
    getVideoList({
      page: 1,
      size: 15,
      institutionId: validInstitutionId,
      categoryId,
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

  const categoryName = firstStringValue(sp.categoryName);
  const listH1 = videoListH1({ category: categoryName });

  return (
    <main className="max-w-7xl mx-auto px-8 py-6 min-h-screen flex flex-col gap-6">
      {/* 面包屑导航 — 公共组件 */}
      <PageBreadcrumb items={[{ label: '录播课' }]} />
      <h1 className="text-2xl font-bold text-slate-900">{listH1}</h1>

      <VideoListSection
        initialData={initialData}
        categoryTree={categoryTree}
        initialInstitutionId={validInstitutionId}
        initialInstitutionName={institution?.orgName}
        initialCategoryId={categoryId}
      />

      <ChannelCategoryNavSection
        title="视频分类"
        countUnit="门"
        itemsPromise={categoryNavPromise}
      />
    </main>
  );
}
