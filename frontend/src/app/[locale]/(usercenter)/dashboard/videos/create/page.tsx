'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import VideoForm from '@/features/video/components/publisher/VideoForm';
import { createVideo } from '@/features/video/api/publisher-service';
import type { SaveVideoRequest } from '@/features/video/api/types';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export default function CreateVideoPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: SaveVideoRequest) => {
    setSubmitting(true);
    try {
      await createVideo(data);
      alert('录播课已保存为草稿');
      router.push(ROUTES.UC_VIDEOS_MANAGE);
    } catch {
      alert('保存失败，请稍后重试');
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
