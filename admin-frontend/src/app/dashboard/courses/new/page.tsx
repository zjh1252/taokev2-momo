import PageContainer from '@/components/layout/page-container';
import { CourseCreateForm } from '@/features/courses/components/course-create-form';

export const metadata = {
  title: '添加课程'
};

export default function CourseNewPage() {
  return (
    <PageContainer
      pageTitle='添加课程'
      pageDescription='创建新课程（当前为占位表单，待后台创建 API 对接）'
    >
      <CourseCreateForm />
    </PageContainer>
  );
}
