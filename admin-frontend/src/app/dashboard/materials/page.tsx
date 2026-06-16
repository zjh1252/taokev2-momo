import PageContainer from '@/components/layout/page-container';
import { MaterialListing } from '@/features/materials/components/material-listing';

export const metadata = {
  title: '素材库管理'
};

export default function MaterialsPage() {
  return (
    <PageContainer
      pageTitle='素材库管理'
      pageDescription='维护课程封面与专家/机构头像素材，支持分类、默认素材池与批量操作'
    >
      <MaterialListing />
    </PageContainer>
  );
}
