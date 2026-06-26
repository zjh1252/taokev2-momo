import PageContainer from '@/components/layout/page-container';
import { SendNotificationForm } from '@/features/admin-notifications/components/send-notification-form';

export const metadata = {
  title: '发送通知消息'
};

export default function SendNotificationPage() {
  return (
    <PageContainer
      scrollable
      pageTitle="发送通知消息"
      pageDescription="向全部用户、指定角色或特定用户发送站内通知"
    >
      <SendNotificationForm />
    </PageContainer>
  );
}
