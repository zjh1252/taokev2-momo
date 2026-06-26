'use client';

import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import VideoForm from '@/features/video/components/publisher/VideoForm';
import type { UploadedVideoItem } from '@/features/video/components/publisher/VideoForm';
import {
  batchCreateVideoChapters,
  getMyVideoDetail,
  updateVideo,
} from '@/features/video/api/publisher-service';
import type { SaveVideoRequest, VideoDetail } from '@/features/video/api/types';
import { ApiException } from '@/lib/http/client';

type VideoEditDialogProps = {
  videoId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function VideoEditDialog({
  videoId,
  open,
  onOpenChange,
  onSaved,
}: VideoEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [video, setVideo] = useState<VideoDetail | null>(null);

  useEffect(() => {
    if (!open || !videoId) {
      setVideo(null);
      return;
    }
    setLoading(true);
    getMyVideoDetail(videoId)
      .then(setVideo)
      .catch(() => {
        toast.error('加载录播课失败');
        onOpenChange(false);
      })
      .finally(() => setLoading(false));
  }, [open, videoId, onOpenChange]);

  const handleSubmit = async (data: SaveVideoRequest, videoFiles?: UploadedVideoItem[]) => {
    if (!videoId) return;
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
          ? '草稿已保存'
          : '已保存并提交审核，请等待平台审核',
      );
      onOpenChange(false);
      onSaved();
    } catch (err) {
      if (!(err instanceof ApiException)) {
        toast.error('保存失败，请稍后重试');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0">
          <div>
            <h3 className="text-base font-bold text-gray-800">编辑录播课</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              保存后将进入待审核状态，由平台管理员审核后上架
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : video ? (
            <VideoForm
              key={video.id}
              initialData={video}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
