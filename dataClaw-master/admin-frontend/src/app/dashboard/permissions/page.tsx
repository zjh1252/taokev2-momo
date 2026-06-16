import PageContainer from '@/components/layout/page-container';
import { PermissionTable } from '@/features/permissions/components/permission-table';

export const metadata = {
  title: '权限管理'
};

export default function PermissionsPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='权限管理'
      pageDescription='管理系统权限节点（树形结构）'
    >
      <PermissionTable />
    </PageContainer>
  );
}
