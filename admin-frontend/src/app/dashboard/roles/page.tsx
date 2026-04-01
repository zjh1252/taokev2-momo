import PageContainer from '@/components/layout/page-container';
import { RoleTable } from '@/features/roles/components/role-table';

export const metadata = {
  title: '角色管理'
};

export default function RolesPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='角色管理'
      pageDescription='管理 RBAC 角色，为角色分配权限'
    >
      <RoleTable />
    </PageContainer>
  );
}
