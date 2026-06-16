'use client';

import { useState, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import {
  createHighlight,
  addHighlightFile,
} from '@/features/trainer-highlight/api/service';
import { uploadImage } from '@/features/course/api/publisher-service';
import type { SaveTrainerHighlightRequest } from '@/features/trainer-highlight/api/types';
import { ArrowLeft, Upload } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { MultiFileUploader, type UploadedFile } from '@/components/multi-file-uploader';
import { FormField } from '@/components/FormField';
import { toast } from 'sonner';
import { usePublishingTarget } from '@/features/binding/components/publishing-target-banner';
import { BoundPublisherGuard } from '@/features/binding/components/BoundPublisherGuard';

export default function CreateHighlightPage() {
  const router = useRouter();
  const { trainerUserId, banner, valid } = usePublishingTarget('精彩瞬间');
  const [submitting, setSubmitting] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  const [form, setForm] = useState<SaveTrainerHighlightRequest>({
    title: '',
    description: '',
    coverImage: '',
  });

  const [files, setFiles] = useState<UploadedFile[]>([]);

  const updateField = <K extends keyof SaveTrainerHighlightRequest>(
    key: K,
    value: SaveTrainerHighlightRequest[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const url = await uploadImage(file);
      updateField('coverImage', url);
    } catch {
      toast.error('封面上传失败');
    } finally {
      setCoverUploading(false);
    }
  };

  const handleAddFile = useCallback((file: UploadedFile) => {
    setFiles((prev) => [...prev, file]);
  }, []);

  const handleRemoveFile = useCallback((_index: number, _file: UploadedFile) => {
    setFiles((prev) => prev.filter((_, i) => i !== _index));
  }, []);

  const handleSubmit = async () => {
    if (!valid) {
      toast.error('请先在顶部选择要代发精彩瞬间的专家');
      return;
    }
    setSubmitting(true);
    try {
      const highlight = await createHighlight(form, trainerUserId);

      // 逐个上传文件到子表
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        await addHighlightFile(highlight.id, {
          fileType: f.fileType,
          fileUrl: f.fileUrl,
          thumbnailUrl: f.thumbnailUrl || '',
          title: f.title || '',
          fileSize: f.fileSize,
          sortOrder: i,
        }, trainerUserId);
      }

      toast.success('精彩瞬间已创建');
      router.push(
        trainerUserId
          ? `${ROUTES.UC_HIGHLIGHTS_MANAGE}?trainerUserId=${trainerUserId}`
          : ROUTES.UC_HIGHLIGHTS_MANAGE,
      );
    } catch {
      // 平台层已统一处理错误提示
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 px-6 py-4 flex items-center gap-3">
        <Link href={ROUTES.UC_HIGHLIGHTS_MANAGE} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="size-5" />
        </Link>
        <h2 className="text-lg font-bold text-gray-800">发布精彩瞬间</h2>
      </div>

      <BoundPublisherGuard>
        {banner}

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 px-6 py-6 max-w-2xl space-y-5">
        <FormField label="标题">
          <input
            type="text"
            value={form.title || ''}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="请输入标题（可选）"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </FormField>

        <FormField label="描述">
          <textarea
            value={form.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
            rows={3}
            placeholder="请输入描述（可选）"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
        </FormField>

        <FormField label="封面图">
          {form.coverImage ? (
            <div className="relative w-[240px] h-[180px] rounded-lg overflow-hidden border border-slate-200">
              <Image
                src={form.coverImage}
                alt="封面"
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => updateField('coverImage', '')}
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full size-5 flex items-center justify-center text-xs hover:bg-black/70"
              >
                ×
              </button>
            </div>
          ) : (
            <label className="w-[240px] h-[180px] rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-colors">
              <Upload className="size-6 text-slate-400" />
              <span className="text-sm text-slate-400">
                {coverUploading ? '上传中...' : '上传封面图'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
                disabled={coverUploading}
              />
            </label>
          )}
        </FormField>

        <FormField label="媒体文件（图片/视频）">
          <MultiFileUploader
            files={files}
            onAdd={handleAddFile}
            onRemove={handleRemoveFile}
          />
        </FormField>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-primary text-white text-sm px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting ? '提交中...' : '提交发布'}
          </button>
          <Link
            href={ROUTES.UC_HIGHLIGHTS_MANAGE}
            className="border border-slate-200 text-gray-600 text-sm px-6 py-2.5 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center"
          >
            取消
          </Link>
        </div>
        </div>
      </BoundPublisherGuard>
    </section>
  );
}
