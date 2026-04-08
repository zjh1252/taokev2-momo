import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { ChevronRight } from 'lucide-react';
import { getVideoDetail } from '@/features/video/api/service';
import { VideoDetailShell } from '@/features/video/components/detail/VideoDetailShell';
import { VideoHero } from '@/features/video/components/detail/VideoHero';
import { VideoDetailTabs } from '@/features/video/components/detail/VideoDetailTabs';
import { VideoSidebar } from '@/features/video/components/detail/VideoSidebar';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations('video');
  try {
    const video = await getVideoDetail(Number(id));
    return {
      title: `${video.title} - ${t('meta.title')}`,
      description: video.intro?.replace(/<[^>]+>/g, '').slice(0, 160),
    };
  } catch {
    return { title: t('meta.title') };
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
      {/* 面包屑 */}
      <nav className="flex text-sm text-slate-500 gap-2 items-center">
        <span>你的位置：</span>
        <Link href="/" className="hover:text-primary transition-colors">
          首页
        </Link>
        <ChevronRight className="size-4" />
        <Link href="/videos" className="hover:text-primary transition-colors">
          录播课
        </Link>
        <ChevronRight className="size-4" />
        <span className="text-slate-800 font-medium line-clamp-1">{video.title}</span>
      </nav>

      <VideoDetailShell video={video}>
        {/* Hero：内嵌 Video.js，与目录共用播放源 */}
        <VideoHero video={video} />

        {/* 主体：左侧内容 + 右侧侧边栏 */}
        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            <VideoDetailTabs video={video} />
          </div>
          <div className="w-[320px] shrink-0 hidden lg:block">
            <VideoSidebar video={video} />
          </div>
        </div>
      </VideoDetailShell>
    </main>
  );
}
