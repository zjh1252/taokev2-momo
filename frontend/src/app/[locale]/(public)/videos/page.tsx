import { getTranslations } from 'next-intl/server';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { VideoListSection } from '@/features/video/components/list/VideoListSection';
import { getVideoList, getVideoCategoryTree } from '@/features/video/api/service';
import { getInstitutionDetail } from '@/features/institution/api/service';

interface Props {
  searchParams: Promise<{ institutionId?: string }>;
}

export async function generateMetadata() {
  const t = await getTranslations('video');
  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

export default async function VideosPage({ searchParams }: Props) {
  const sp = await searchParams;
  const institutionId = sp.institutionId ? Number(sp.institutionId) : undefined;
  const validInstitutionId = institutionId && !isNaN(institutionId) ? institutionId : undefined;

  const [initialData, categoryTree, institution] = await Promise.all([
    getVideoList({ page: 1, size: 15, institutionId: validInstitutionId }).catch(() => ({
      list: [],
      total: 0,
      page: 1,
      size: 15,
      totalPages: 0,
    })),
    getVideoCategoryTree().catch(() => []),
    validInstitutionId
      ? getInstitutionDetail(validInstitutionId).catch(() => null)
      : Promise.resolve(null),
  ]);

  return (
    <main className="max-w-7xl mx-auto px-8 py-6 min-h-screen flex flex-col gap-6">
      {/* 面包屑导航 — 公共组件 */}
      <PageBreadcrumb items={[{ label: '录播课' }]} />

      <VideoListSection
        initialData={initialData}
        categoryTree={categoryTree}
        initialInstitutionId={validInstitutionId}
        initialInstitutionName={institution?.orgName}
      />
    </main>
  );
}
