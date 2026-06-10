import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getTrainerDetailPageData } from '@/features/trainer/api/trainer-detail-page-data';
import { TrainerDetailPageView } from '@/features/trainer/components/detail/TrainerDetailPageView';
import { getTrainerDetailCached } from '@/features/trainer/api/server';
import { trainerDetailMetadata, fallbackDetailMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  try {
    const trainer = await getTrainerDetailCached(Number(id));
    return trainerDetailMetadata(trainer);
  } catch {
    return fallbackDetailMetadata('主讲课程');
  }
}

/**
 * 专家主讲课程独立页 — SSR
 * <p>地址栏：/trainer/{id}/courses.htm</p>
 */
export default async function TrainerCoursesPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const trainerId = Number(id);
  if (isNaN(trainerId)) {
    notFound();
  }

  const data = await getTrainerDetailPageData(trainerId);
  if (!data) {
    notFound();
  }

  return <TrainerDetailPageView {...data} activeTab="courses" />;
}
