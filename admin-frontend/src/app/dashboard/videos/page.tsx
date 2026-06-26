import PageContainer from '@/components/layout/page-container';
import VideoListingPage from '@/features/videos/components/video-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: '视频列表'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function VideosPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='视频列表'
      pageDescription='查看和管理平台所有录播课，支持审核、上架、推荐与置顶'
    >
      <VideoListingPage />
    </PageContainer>
  );
}
