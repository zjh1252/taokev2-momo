import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getTrainerDetailPageData } from '@/features/trainer/api/trainer-detail-page-data';
import { TrainerDetailPageView } from '@/features/trainer/components/detail/TrainerDetailPageView';
import { getTrainerDetailCached } from '@/features/trainer/api/server';
import { trainerDetailMetadata, fallbackDetailMetadata } from '@/lib/seo';
import {
  getTrainerDetailTabHref,
  trainerTabQueryToId,
} from '@/features/trainer/utils/routes';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  try {
    const trainer = await getTrainerDetailCached(Number(id));
    return trainerDetailMetadata(trainer, `/trainer/${id}.htm`);
  } catch {
    return fallbackDetailMetadata('专家详情', `/trainer/${id}.htm`);
  }
}

/**
 * 专家详情主页（基本信息、简介）— SSR
 * <p>地址栏：/trainer/{id}.htm；旧版 ?tab= 查询参数会 301 到独立子页 URL。</p>
 */
export default async function TrainerDetailPage({ params, searchParams }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const trainerId = Number(id);

  if (isNaN(trainerId)) {
    notFound();
  }

  const { tab } = await searchParams;
  const tabId = trainerTabQueryToId(tab);
  if (tabId && tabId !== 'home') {
    redirect(getTrainerDetailTabHref(trainerId, tabId));
  }

  const data = await getTrainerDetailPageData(trainerId);
  if (!data) {
    notFound();
  }

  return <TrainerDetailPageView {...data} activeTab="home" />;
}
