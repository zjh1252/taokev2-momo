import PageContainer from '@/components/layout/page-container';
import AllianceLecturer721ApplicationListing from '@/features/alliance-lecturers721/components/application-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '721讲师合作'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function AllianceLecturer721ApplicationsPage({
  searchParams
}: PageProps) {
  searchParamsCache.parse(await searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='721讲师合作'
      pageDescription='审核淘课联盟721讲师合作入驻申请'
    >
      <AllianceLecturer721ApplicationListing />
    </PageContainer>
  );
}
