import PageContainer from '@/components/layout/page-container';
import { CaseCreateForm } from '@/features/trainer-cases/components/case-create-form';

export const metadata = {
  title: '添加案例'
};

export default function CaseNewPage() {
  return (
    <PageContainer
      pageTitle='添加案例'
      pageDescription='运营代专家发布培训案例，提交后进入审核流程'
    >
      <CaseCreateForm />
    </PageContainer>
  );
}
