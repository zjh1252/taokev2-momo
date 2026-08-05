import PageContainer from '@/components/layout/page-container';
import UserListingPage from '@/features/users/components/user-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';
import { UserFormSheetTrigger } from '@/features/users/components/user-form-sheet';

export const metadata = {
  title: '个人学员'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function UsersPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='个人学员'
      pageDescription='查询与管理个人学员账号；可按角色筛选查看不同用户类型'
      pageHeaderAction={<UserFormSheetTrigger />}
    >
      <UserListingPage />
    </PageContainer>
  );
}
