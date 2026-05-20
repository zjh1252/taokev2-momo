import { notFound } from 'next/navigation';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { getInstitutionDetail } from '@/features/institution/api/service';
import { InstitutionHero } from '@/features/institution/components/detail/InstitutionHero';
import { InstitutionDetailTabs } from '@/features/institution/components/detail/InstitutionDetailTabs';
import { InstitutionDetailSidebar } from '@/features/institution/components/detail/InstitutionDetailSidebar';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  try {
    const institution = await getInstitutionDetail(Number(id));
    return {
      title: `${institution.orgName} - 培训机构 - 淘课网`,
      description: institution.bio || institution.orgName,
    };
  } catch {
    return { title: '培训机构详情 - 淘课网' };
  }
}

/**
 * 机构详情页 — SSR，主数据从 GET /institutions/{id} 获取
 */
export default async function InstitutionDetailPage({ params }: Props) {
  const { id } = await params;
  const institutionId = Number(id);

  if (isNaN(institutionId)) {
    notFound();
  }

  let institution;
  try {
    institution = await getInstitutionDetail(institutionId);
  } catch {
    notFound();
  }

  return (
    <main className="max-w-7xl w-full mx-auto px-8 pb-12">
      {/* 面包屑导航 — 公共组件：首页 > 培训机构 > 当前机构 */}
      <PageBreadcrumb
        className="py-4"
        items={[
          { label: '培训机构', href: '/institutions' },
          { label: institution.orgName || '机构详情' },
        ]}
      />

      <div className="flex flex-col gap-6">
        <InstitutionHero institution={institution} />

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex-1 w-full flex flex-col gap-6">
            <InstitutionDetailTabs institution={institution} />
          </div>
          <InstitutionDetailSidebar institution={institution} />
        </div>
      </div>
    </main>
  );
}
