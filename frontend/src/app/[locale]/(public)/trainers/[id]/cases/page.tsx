import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getTrainerDetailPageData } from '@/features/trainer/api/trainer-detail-page-data';
import { TrainerDetailPageView } from '@/features/trainer/components/detail/TrainerDetailPageView';
import { getTrainerDetailCached } from '@/features/trainer/api/server';
import { trainerDetailMetadata, fallbackDetailMetadata } from '@/lib/seo';
import { parseTrainerListReturnParam } from '@/features/trainer/utils/list-return';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ from?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  try {
    const trainer = await getTrainerDetailCached(Number(id));
    return trainerDetailMetadata(trainer, `/trainer/${id}/cases.htm`);
  } catch {
    return fallbackDetailMetadata('授课案例', `/trainer/${id}/cases.htm`);
  }
}

/**
 * 专家授课案例独立页 — SSR
 * <p>地址栏：/trainer/{id}/cases.htm</p>
 */
export default async function TrainerCasesPage({ params, searchParams }: Props) {
  const { locale, id } = await params;
  const { from } = await searchParams;
  setRequestLocale(locale);
  const trainerListReturnPath = parseTrainerListReturnParam(from);

  const trainerId = Number(id);
  if (isNaN(trainerId)) {
    notFound();
  }

  const data = await getTrainerDetailPageData(trainerId);
  if (!data) {
    notFound();
  }

  return (
    <TrainerDetailPageView
      {...data}
      activeTab="cases"
      trainerListReturnPath={trainerListReturnPath}
    />
  );
}
