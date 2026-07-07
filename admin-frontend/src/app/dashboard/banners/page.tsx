import PageContainer from '@/components/layout/page-container';
import { BannerManager } from '@/features/banners/components/banner-manager';

export const metadata = {
  title: '轮播图管理'
};

export default function Page() {
  return (
    <PageContainer
      pageTitle='轮播图管理'
      pageDescription='管理首页顶部轮播图，支持三张图片上传与展示文案维护'
    >
      <BannerManager />
    </PageContainer>
  );
}
