import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { getCityByEnNameCached } from '@/features/city/api/server';
import {
  CityBlockSkeleton,
  CityHotInnerBlock,
  CityInstitutionsBlock,
  CityLatestBlock,
  CityNavBlock,
  CityTrainersBlock,
  CityUpcomingOpenBlock,
} from '@/features/city/components/CityChannelBlocks';
import { resolveCityFilterId } from '@/features/city/lib/filter-city-id';
import { buildCityChannelMetadata } from '@/lib/seo';

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { city } = await params;
  const detail = await getCityByEnNameCached(city).catch(() => null);
  if (!detail) return { title: '城市培训频道 - 淘课网' };
  return buildCityChannelMetadata(detail.cityName);
}

/**
 * 城市综合频道页 — /cities/[city]（SEO 别名 /city/{拼音}）
 * <p>各城市共用同一实现；区块 Suspense 流式输出，避免等齐全部列表才结束 RSC。</p>
 */
export default async function CityChannelPage({ params }: Props) {
  const { city } = await params;
  const detail = await getCityByEnNameCached(city).catch(() => null);

  if (!detail) {
    notFound();
  }

  const cityId = resolveCityFilterId(detail);
  const { cityName } = detail;
  const blockProps = { detail, cityId };

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
        <CityNavBlock currentEnName={detail.enName} />
      </Suspense>
    </main>
  );
}
