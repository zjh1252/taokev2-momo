import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { getCityHomeCached } from '@/features/city/api/server';
import {
  CityBlockSkeleton,
  CityHotInnerBlock,
  CityInstitutionsBlock,
  CityLatestBlock,
  CityNavBlock,
  CityTrainersBlock,
  CityUpcomingOpenBlock,
} from '@/features/city/components/CityChannelBlocks';
import { buildCityChannelMetadata } from '@/lib/seo';

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { city } = await params;
  const home = await getCityHomeCached(city).catch(() => null);
  if (!home?.detail) {
    return {
      title: '城市培训频道 - 淘课网',
      robots: { index: false, follow: false },
    };
  }
  return buildCityChannelMetadata(home.detail.cityName, `/city/${city}`);
}

/**
 * 城市综合频道页 — /cities/[city]（SEO 别名 /city/{拼音}）
 * <p>同请求内 metadata / 页面 / 各 Suspense 块共享一次 GET /cities/{en}/home。</p>
 */
export default async function CityChannelPage({ params }: Props) {
  const { city } = await params;
  const home = await getCityHomeCached(city).catch(() => null);

  if (!home?.detail) {
    notFound();
  }

  const { cityName, enName } = home.detail;
  const blockProps = { enName: city };

  return (
    <main className="max-w-7xl mx-auto px-8 py-6 min-h-screen flex flex-col gap-6">
      <PageBreadcrumb items={[{ label: `${cityName}培训频道` }]} />

      <section className="rounded-lg border border-slate-100 bg-gradient-to-r from-primary/5 to-orange-50/80 px-6 py-5">
        <h1 className="text-2xl font-bold text-slate-900 m-0">
          {cityName}培训课程与资源汇总
        </h1>
      </section>

      <Suspense fallback={<CityBlockSkeleton title={`最近开课${cityName}公开课`} />}>
        <CityUpcomingOpenBlock {...blockProps} />
      </Suspense>

      <Suspense fallback={<CityBlockSkeleton title={`${cityName}本月热门内训课`} />}>
        <CityHotInnerBlock {...blockProps} />
      </Suspense>

      <Suspense fallback={<CityBlockSkeleton title={`最新${cityName}培训课程`} />}>
        <CityLatestBlock {...blockProps} />
      </Suspense>

      <Suspense fallback={<CityBlockSkeleton title={`最新${cityName}培训机构`} />}>
        <CityInstitutionsBlock {...blockProps} />
      </Suspense>

      <Suspense fallback={<CityBlockSkeleton title={`最新${cityName}授课专家`} />}>
        <CityTrainersBlock {...blockProps} />
      </Suspense>

      <Suspense fallback={null}>
        <CityNavBlock currentEnName={enName} />
      </Suspense>
    </main>
  );
}
