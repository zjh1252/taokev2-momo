import PageContainer from '@/components/layout/page-container';
import { VideoCreateForm } from '@/features/videos/components/video-create-form';

export const metadata = {
  title: '添加视频'
};

export default function VideoNewPage() {
  return (
    <PageContainer
      pageTitle='添加视频'
      pageDescription='发布新录播课，填写基本信息、定价与发布主体后提交审核或直接上架'
    >
      <VideoCreateForm />
    </PageContainer>
  );
}
