'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import {
  getMyHighlights,
  updateHighlight,
} from '@/features/trainer-highlight/api/service';
import { uploadImage } from '@/features/course/api/publisher-service';
import {
  MediaType,
  type SaveTrainerHighlightRequest,
} from '@/features/trainer-highlight/api/types';
import { ArrowLeft, Upload, ImageIcon, Video } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

/**
 * 编辑精彩瞬间
 *
 * @author Fangxinxin
 * @date 2026-04-11 18:30
 */
export default function EditHighlightPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const highlightId = Number(params.id);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState<SaveTrainerHighlightRequest>({
    mediaType: MediaType.IMAGE,
    title: '',
    description: '',
    mediaUrl: '',
    thumbnailUrl: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const list = await getMyHighlights();
        const detail = list.find((h) => h.id === highlightId);
        if (detail) {
          setForm({
            mediaType: detail.mediaType,
            title: detail.title || '',
            description: detail.description || '',
            mediaUrl: detail.mediaUrl,
            thumbnailUrl: detail.thumbnailUrl || '',
            duration: detail.duration ?? undefined,
            fileSize: detail.fileSize ?? undefined,
          });
        }
      } catch {
        alert('加载详情失败');
      } finally {
        setLoading(false);
      }
    })();
  }, [highlightId]);

  const updateField = <K extends keyof SaveTrainerHighlightRequest>(
    key: K,
    value: SaveTrainerHighlightRequest[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      updateField('mediaUrl', url);
      if (form.mediaType === MediaType.IMAGE) {
        updateField('thumbnailUrl', url);
      }
    } catch {
      alert('上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.mediaUrl) {
      alert('请上传媒体文件');
      return;
    }
    setSubmitting(true);
    try {
      await updateHighlight(highlightId, form);
      alert('已更新');
      router.push(ROUTES.UC_HIGHLIGHTS_MANAGE);
    } catch {
      alert('更新失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-center py-20 text-gray-400">
          <div className="animate-spin rounded-full size-8 border-2 border-primary border-t-transparent" />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
        <Link href={ROUTES.UC_HIGHLIGHTS_MANAGE} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="size-5" />
        </Link>
        <h2 className="text-lg font-bold text-gray-800">编辑精彩瞬间</h2>
      </div>

      <div className="px-6 py-6 max-w-2xl space-y-5">
        <FormField label="媒体类型">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => updateField('mediaType', MediaType.IMAGE)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm transition-colors',
                form.mediaType === MediaType.IMAGE
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-slate-200 text-gray-600 hover:bg-slate-50',
              )}
            >
              <ImageIcon className="size-4" />
              图片
            </button>
            <button
              type="button"
              onClick={() => updateField('mediaType', MediaType.VIDEO)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm transition-colors',
                form.mediaType === MediaType.VIDEO
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-slate-200 text-gray-600 hover:bg-slate-50',
              )}
            >
              <Video className="size-4" />
              视频
            </button>
          </div>
        </FormField>

        <FormField label="媒体文件" required>
          {form.mediaUrl ? (
            <div className="relative w-[240px] h-[180px] rounded-lg overflow-hidden border border-slate-200">
              <Image
                src={form.thumbnailUrl || form.mediaUrl}
                alt="预览"
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  updateField('mediaUrl', '');
                  updateField('thumbnailUrl', '');
                }}
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full size-5 flex items-center justify-center text-xs hover:bg-black/70"
              >
                ×
              </button>
            </div>
          ) : (
            <label className="w-[240px] h-[180px] rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-colors">
              <Upload className="size-6 text-slate-400" />
              <span className="text-sm text-slate-400">
                {uploading ? '上传中...' : '重新上传'}
              </span>
              <input
                type="file"
                accept={form.mediaType === MediaType.IMAGE ? 'image/*' : 'video/*'}
                onChange={handleMediaUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          )}
        </FormField>

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

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-primary text-white text-sm px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting ? '提交中...' : '保存修改'}
          </button>
          <Link
            href={ROUTES.UC_HIGHLIGHTS_MANAGE}
            className="border border-slate-200 text-gray-600 text-sm px-6 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            取消
          </Link>
        </div>
      </div>
    </section>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
