import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ChevronRight } from 'lucide-react';
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
      <nav className="flex items-center text-xs text-slate-500 py-4">
        <span className="mr-2">你的位置：</span>
        <Link href="/" className="hover:text-primary transition-colors">
          首页
        </Link>
        <ChevronRight className="size-3 mx-1" />
        <Link href="/associations" className="hover:text-primary transition-colors">
          培训协会
        </Link>
        <ChevronRight className="size-3 mx-1" />
        <span className="text-slate-800 font-medium">{institution.orgName}</span>
      </nav>

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
