import PageContainer from '@/components/layout/page-container';
import { TemplateTable } from '@/features/admin-notifications/components/template-table';

export const metadata = {
  title: '通知模板管理'
};

export default function NotificationTemplatesPage() {
  return (
    <PageContainer
      scrollable
      pageTitle="通知模板管理"
      pageDescription="管理通知模板，支持 {{变量}} 占位符"
    >
      <TemplateTable />
    </PageContainer>
  );
}
