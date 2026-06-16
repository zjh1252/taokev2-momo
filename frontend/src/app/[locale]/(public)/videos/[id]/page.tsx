import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { videoDetailMetadata, fallbackDetailMetadata } from '@/lib/seo';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { getVideoDetail } from '@/features/video/api/service';
import { VideoDetailShell } from '@/features/video/components/detail/VideoDetailShell';
import { VideoHero } from '@/features/video/components/detail/VideoHero';
import { VideoDetailTabs } from '@/features/video/components/detail/VideoDetailTabs';
import { VideoSidebar } from '@/features/video/components/detail/VideoSidebar';
import { VideoPurchaseSection } from '@/features/video/components/detail/VideoPurchaseSection';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const video = await getVideoDetail(Number(id));
    return videoDetailMetadata(video);
  } catch {
    return fallbackDetailMetadata('录播课详情');
  }
}

export default async function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = Number(id);

  if (!numId || numId <= 0) {
    notFound();
  }

  let video;
  try {
    video = await getVideoDetail(numId);
  } catch {
    notFound();
  }

  return (
    <main className="max-w-7xl mx-auto px-8 py-6 min-h-screen flex flex-col gap-6">
      {/* 面包屑导航 — 公共组件：首页 > 录播课 > 当前视频 */}
      <PageBreadcrumb
        items={[
          { label: '录播课', href: '/videos' },
          { label: video.title || '录播课详情' },
        ]}
      />

      <VideoDetailShell video={video}>
        {/* Hero：内嵌 Video.js，与目录共用播放源 */}
        <VideoHero video={video} />

        <div className="lg:hidden bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <VideoPurchaseSection video={video} />
        </div>

        {/* 主体：左侧内容 + 右侧侧边栏 */}
        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            <Suspense fallback={<div className="h-96 bg-white rounded-xl animate-pulse" />}>
              <VideoDetailTabs video={video} />
            </Suspense>
          </div>
          <div className="w-[320px] shrink-0 hidden lg:block">
            <VideoSidebar video={video} />
          </div>
        </div>
      </VideoDetailShell>
    </main>
  );
}
