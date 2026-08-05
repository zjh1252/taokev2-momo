import PageContainer from '@/components/layout/page-container';
import { TrainerCreateForm } from '@/features/trainers/components/trainer-create-form';

export const metadata = {
  title: '添加专家'
};

export default function TrainerNewPage() {
  return (
    <PageContainer
      pageTitle='添加专家'
      pageDescription='运营代填专家入驻资料，与前台专家注册表单字段一致，提交后自动审核通过'
    >
      <TrainerCreateForm />
    </PageContainer>
  );
}
