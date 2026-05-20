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
      title: `${institution.orgName} - 培训协会 - 淘课网`,
      description: institution.bio || institution.orgName,
    };
  } catch {
    return { title: '培训协会详情 - 淘课网' };
  }
}

/**
 * 培训协会详情页 — 复用机构详情组件
 */
export default async function AssociationDetailPage({ params }: Props) {
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
      {/* 面包屑导航 — 公共组件：首页 > 培训协会 > 当前协会 */}
      <PageBreadcrumb
        className="py-4"
        items={[
          { label: '培训协会', href: '/associations' },
          { label: institution.orgName || '协会详情' },
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
