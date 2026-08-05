'use client';

import { usePathname } from '@/i18n/navigation';
import { isDetailPagePath } from '@/lib/is-detail-page-path';
import { AppHeader } from './app-header';
import { DetailPageHeader } from './detail-page-header';
import { TopNavBar } from './top-nav-bar';

/** 按路径在列表页双层顶栏与详情页单行顶栏之间切换 */
export function PublicHeader() {
  const pathname = usePathname();

  if (isDetailPagePath(pathname)) {
    return <DetailPageHeader />;
  }

  return (
    <>
      <TopNavBar />
      <AppHeader />
    </>
  );
}
