'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import VideoForm from '@/features/video/components/publisher/VideoForm';
import type { UploadedVideoItem } from '@/features/video/components/publisher/VideoForm';
import { createVideo, batchCreateVideoChapters } from '@/features/video/api/publisher-service';
import type { SaveVideoRequest } from '@/features/video/api/types';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { toast } from 'sonner';
import { ApiException } from '@/lib/http/client';

export default function CreateVideoPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: SaveVideoRequest, videoFiles?: UploadedVideoItem[]) => {
    setSubmitting(true);
    try {
      const video = await createVideo(data);

      // SERIES 类型：批量创建章节
      if (data.videoType === 'SERIES' && videoFiles && videoFiles.length > 0) {
        const chapterRequests = videoFiles.map((v, idx) => ({
          title: `${data.title} - 章节${idx + 1}`,
          videoUrl: v.url,
          sortOrder: idx + 1,
        }));
        await batchCreateVideoChapters(video.id, chapterRequests);
      }

      toast.success('录播课已提交，等待管理员审核');
      router.push(ROUTES.UC_VIDEOS_MANAGE);
    } catch (err) {
      if (!(err instanceof ApiException)) {
        toast.error('保存失败，请检查网络连接');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href={ROUTES.UC_VIDEOS_MANAGE}
          className="text-gray-400 hover:text-primary transition-colors"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-bold text-gray-800">发布录播课</h1>
      </div>
      <VideoForm onSubmit={handleSubmit} submitting={submitting} />
    </section>
  );
}
