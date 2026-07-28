import { notFound } from 'next/navigation';
import { videoDetailMetadata, fallbackDetailMetadata } from '@/lib/seo';
import { getVideoDetail } from '@/features/video/api/service';
import { VideoDetailShell } from '@/features/video/components/detail/VideoDetailShell';
import { VideoPlayPageContent } from '@/features/video/components/play/VideoPlayPageContent';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const video = await getVideoDetail(Number(id));
    return videoDetailMetadata(video);
  } catch {
    return fallbackDetailMetadata('视频播放');
  }
}

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ chapter?: string }>;
};

/**
 * 录播课视频播放页 — 独立观看界面，支持断点续播与倍速控制
 *
 * @author Fangxinxin
 * @date 2026-06-11 14:00
 */
export default async function VideoPlayPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { chapter } = await searchParams;
  const numId = Number(id);

  if (!numId || numId <= 0) {
    notFound();
  }

  const preferredChapterId = chapter ? Number(chapter) : undefined;
  if (chapter && (!preferredChapterId || preferredChapterId <= 0)) {
    notFound();
  }

  let video;
  try {
    video = await getVideoDetail(numId);
  } catch {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100/80 via-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col gap-6 md:gap-8">
        <VideoDetailShell video={video} preferredChapterId={preferredChapterId}>
          <VideoPlayPageContent video={video} />
        </VideoDetailShell>
      </div>
    </main>
  );
}
