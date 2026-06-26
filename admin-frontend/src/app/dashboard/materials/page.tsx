import PageContainer from '@/components/layout/page-container';
import MaterialListingPage from '@/features/materials/components/material-listing-page';
import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '素材库管理'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function MaterialsPage({ searchParams }: PageProps) {
  searchParamsCache.parse(await searchParams);

  return (
    <PageContainer
      pageTitle='素材库管理'
      pageDescription='维护课程封面与专家/机构头像素材，支持分类、默认素材池与批量操作'
    >
      <MaterialListingPage />
    </PageContainer>
  );
}
