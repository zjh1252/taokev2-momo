'use client';

import { Suspense, use } from 'react';
import {
  ChannelCategoryNav,
  type ChannelCategoryNavItem
} from './channel-category-nav';

function NavSkeleton() {
  return (
    <div
      className="h-40 animate-pulse rounded-xl bg-slate-100/80 border border-slate-100"
      aria-hidden
    />
  );
}

function ResolvedNav({
  title,
  countUnit,
  itemsPromise,
  onItemClick
}: {
  title: string;
  countUnit: string;
  itemsPromise: Promise<ChannelCategoryNavItem[]>;
  onItemClick?: (item: ChannelCategoryNavItem) => void;
}) {
  const items = use(itemsPromise);
  return (
    <ChannelCategoryNav
      title={title}
      items={items}
      countUnit={countUnit}
      onItemClick={onItemClick}
    />
  );
}

/** 列表页底部分类导航 — 支持页内筛选（与侧栏同款效果） */
export function ListBottomCategoryNav({
  title,
  countUnit,
  itemsPromise,
  onItemClick
}: {
  title: string;
  countUnit: string;
  itemsPromise: Promise<ChannelCategoryNavItem[]>;
  onItemClick?: (item: ChannelCategoryNavItem) => void;
}) {
  return (
    <Suspense fallback={<NavSkeleton />}>
      <ResolvedNav
        title={title}
        countUnit={countUnit}
        itemsPromise={itemsPromise}
        onItemClick={onItemClick}
      />
    </Suspense>
  );
}
