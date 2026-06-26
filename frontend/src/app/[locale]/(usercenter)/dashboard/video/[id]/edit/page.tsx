'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useParams } from 'next/navigation';
import { ROUTES } from '@/config/routes';
import VideoForm from '@/features/video/components/publisher/VideoForm';
import type { UploadedVideoItem } from '@/features/video/components/publisher/VideoForm';
import {
  batchCreateVideoChapters,
  getMyVideoDetail,
  updateVideo,
} from '@/features/video/api/publisher-service';
import type { SaveVideoRequest, VideoDetail } from '@/features/video/api/types';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { toast } from 'sonner';
import { ApiException } from '@/lib/http/client';
import { OwnedTrainerBanner } from '@/features/binding/components/owned-trainer-banner';
import { BoundPublisherGuard } from '@/features/binding/components/BoundPublisherGuard';

export default function EditVideoPage() {
  const router = useRouter();
  const params = useParams();
  const videoId = Number(params.id);

  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!videoId) return;
    setLoading(true);
    getMyVideoDetail(videoId)
      .then(setVideo)
      .catch(() => setError('录播课不存在或无权访问'))
      .finally(() => setLoading(false));
  }, [videoId]);

  const handleSubmit = async (data: SaveVideoRequest, videoFiles?: UploadedVideoItem[]) => {
    setSubmitting(true);
    try {
      await updateVideo(videoId, data);

      if (data.videoType === 'SERIES' && videoFiles && videoFiles.length > 0) {
        const existingCount = video?.totalEpisodes ?? 0;
        const chapterRequests = videoFiles.map((v, idx) => ({
          title: `${data.title} - 章节${existingCount + idx + 1}`,
          videoUrl: v.url,
          sortOrder: existingCount + idx + 1,
        }));
        await batchCreateVideoChapters(videoId, chapterRequests);
      }

      toast.success(
        data.draft
          ? '草稿已保存，可在「管理录播课-草稿」中继续编辑'
          : '已保存并提交审核，请等待平台审核',
      );
      router.push(ROUTES.UC_VIDEOS_MANAGE);
    } catch (err) {
      // ApiException 已由 http client 弹出后端具体失败原因，这里只兜底未知错误
      if (!(err instanceof ApiException)) {
        toast.error('保存失败，请稍后重试');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <div className="animate-spin rounded-full size-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>{error || '录播课不存在'}</p>
        <Link href={ROUTES.UC_VIDEOS_MANAGE} className="text-primary hover:underline mt-4 inline-block">
          返回管理录播课
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href={ROUTES.UC_VIDEOS_MANAGE}
          className="text-gray-400 hover:text-primary transition-colors"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-bold text-gray-800">编辑录播课</h1>
      </div>
      <BoundPublisherGuard>
        <OwnedTrainerBanner
          trainerUserId={video.publisherType === 'TRAINER' ? video.publisherId : undefined}
          trainerNameHint={video.trainerName}
        />
        <VideoForm initialData={video} onSubmit={handleSubmit} submitting={submitting} />
      </BoundPublisherGuard>
    </section>
  );
}
