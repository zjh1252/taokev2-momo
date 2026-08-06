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
    return trainerDetailMetadata(trainer, `/trainer/${id}/courses.htm`);
  } catch {
    return fallbackDetailMetadata('主讲课程', `/trainer/${id}/courses.htm`);
  }
}

/**
 * 专家主讲课程独立页 — SSR
 * <p>地址栏：/trainer/{id}/courses.htm</p>
 */
export default async function TrainerCoursesPage({ params, searchParams }: Props) {
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
      activeTab="courses"
      trainerListReturnPath={trainerListReturnPath}
    />
  );
}
