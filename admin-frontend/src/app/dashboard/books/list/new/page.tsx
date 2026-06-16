import PageContainer from '@/components/layout/page-container';
import { BookCreateForm } from '@/features/books/components/book-create-form';

export const metadata = {
  title: '添加著作'
};

export default function BookNewPage() {
  return (
    <PageContainer
      pageTitle='添加著作'
      pageDescription='为专家添加著作信息，提交后进入审核流程'
    >
      <BookCreateForm />
    </PageContainer>
  );
}
