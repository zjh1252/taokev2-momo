import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getTrainerDetailPageData } from '@/features/trainer/api/trainer-detail-page-data';
import { TrainerDetailPageView } from '@/features/trainer/components/detail/TrainerDetailPageView';
import { getTrainerDetailCached } from '@/features/trainer/api/server';
import { trainerDetailMetadata, fallbackDetailMetadata } from '@/lib/seo';
import {
  isTrainerTabSlug,
  trainerTabSlugToId,
  getTrainerDetailTabHref,
  type TrainerTabId,
} from '@/features/trainer/utils/routes';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string; id: string; section: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id, section } = await params;
  if (!isTrainerTabSlug(section)) {
    return fallbackDetailMetadata('专家详情');
  }

  try {
    const trainer = await getTrainerDetailCached(Number(id));
    return trainerDetailMetadata(trainer);
  } catch {
    return fallbackDetailMetadata('专家详情');
  }
}

/** 旧版单数 slug → 新版复数 slug 映射 */
const OLD_SLUG_REDIRECT: Record<string, TrainerTabId> = {
  course: 'courses',
  case: 'cases',
};

/**
 * 专家详情子页 — SSR（video / comment / book）
 * <p>地址栏：/trainer/{id}/{section}.htm（courses / cases 有独立目录）</p>
 */
export default async function TrainerDetailTabPage({ params }: Props) {
  const { locale, id, section } = await params;
  setRequestLocale(locale);

  const trainerId = Number(id);
  if (isNaN(trainerId)) {
    notFound();
  }

  // 旧版单数 slug 重定向到新版复数独立页
  const redirectTab = OLD_SLUG_REDIRECT[section];
  if (redirectTab) {
    redirect(getTrainerDetailTabHref(trainerId, redirectTab));
  }

  if (!isTrainerTabSlug(section)) {
    notFound();
  }

  const data = await getTrainerDetailPageData(trainerId);
  if (!data) {
    notFound();
  }

  return (
    <TrainerDetailPageView
      {...data}
      activeTab={trainerTabSlugToId(section)}
    />
  );
}
