import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { institutionDetailMetadata, fallbackDetailMetadata } from '@/lib/seo';
import { DetailViewRecorder } from '@/components/detail-view-recorder';
import { getInstitutionDetail } from '@/features/institution/api/service';
import { InstitutionHero } from '@/features/institution/components/detail/InstitutionHero';
import { InstitutionDetailTabs } from '@/features/institution/components/detail/InstitutionDetailTabs';
import { InstitutionDetailSidebar } from '@/features/institution/components/detail/InstitutionDetailSidebar';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  try {
    const institution = await getInstitutionDetail(Number(id));
    return institutionDetailMetadata(institution, `/company/${id}.htm`);
  } catch {
    return fallbackDetailMetadata('培训机构详情', `/company/${id}.htm`);
  }
}

/**
 * 机构详情页 — SSR，主数据从 GET /company/{id} 获取
 */
export default async function InstitutionDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
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
    <main className="max-w-7xl w-full mx-auto px-8 pt-6 pb-12">
      <DetailViewRecorder
        resourceType="institution"
        resourceId={institution.id}
        viewCount={institution.viewCount}
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
