import { Suspense } from 'react';
import { ChannelCategoryNav, type ChannelCategoryNavItem } from './channel-category-nav';

function NavSkeleton() {
  return (
    <div
      className="h-40 animate-pulse rounded-xl bg-slate-100/80 border border-slate-100"
      aria-hidden
    />
  );
}

async function ChannelCategoryNavAsync({
  title,
  countUnit,
  itemsPromise,
}: {
  title: string;
  countUnit: string;
  itemsPromise: Promise<ChannelCategoryNavItem[]>;
}) {
  const items = await itemsPromise;
  return <ChannelCategoryNav title={title} items={items} countUnit={countUnit} />;
}

/** 底部分类导航 — Suspense 流式渲染，不阻塞首屏列表 */
export function ChannelCategoryNavSection({
  title,
  countUnit,
  itemsPromise,
}: {
  title: string;
  countUnit: string;
  itemsPromise: Promise<ChannelCategoryNavItem[]>;
}) {
  return (
    <Suspense fallback={<NavSkeleton />}>
      <ChannelCategoryNavAsync title={title} countUnit={countUnit} itemsPromise={itemsPromise} />
    </Suspense>
  );
}
