import PageContainer from '@/components/layout/page-container';
import { HighlightCreateForm } from '@/features/trainer-highlights/components/highlight-create-form';

export const metadata = {
  title: '添加精彩瞬间'
};

export default function HighlightNewPage() {
  return (
    <PageContainer
      pageTitle='添加精彩瞬间'
      pageDescription='运营代专家发布精彩瞬间，提交后进入审核流程'
    >
      <HighlightCreateForm />
    </PageContainer>
  );
}
