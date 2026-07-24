import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getPublicCaseDetail } from '@/features/trainer-case/api/service';
import { CaseDetailView } from '@/features/trainer-case/components/CaseDetailView';
import { caseDetailMetadata, fallbackDetailMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  try {
    const caseData = await getPublicCaseDetail(Number(id));
    return caseDetailMetadata(caseData, caseData.trainerName);
  } catch {
    return fallbackDetailMetadata('培训案例详情');
  }
}

export default async function CaseDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const caseId = Number(id);

  if (isNaN(caseId)) {
    notFound();
  }

  let caseData;
  try {
    caseData = await getPublicCaseDetail(caseId);
  } catch {
    notFound();
  }

  const trainerName = caseData.trainerName?.trim() || '培训专家';

  return (
    <main className="max-w-4xl mx-auto px-6 lg:px-8 py-6 min-h-screen flex flex-col gap-6">
      <CaseDetailView caseData={caseData} trainerName={trainerName} />
    </main>
  );
}
