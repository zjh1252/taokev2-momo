'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import {
  getMyHighlights,
  updateHighlight,
  updateHighlightDraft,
  addHighlightFile,
  deleteHighlightFile,
} from '@/features/trainer-highlight/api/service';
import { uploadImage } from '@/features/course/api/publisher-service';
import type { SaveTrainerHighlightRequest } from '@/features/trainer-highlight/api/types';
import { ArrowLeft, Upload } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { MultiFileUploader, type UploadedFile } from '@/components/multi-file-uploader';
import { FormField } from '@/components/FormField';
import { toast } from 'sonner';
import { OwnedTrainerBanner } from '@/features/binding/components/owned-trainer-banner';
import { BoundPublisherGuard } from '@/features/binding/components/BoundPublisherGuard';

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
  const [coverUploading, setCoverUploading] = useState(false);

  const [form, setForm] = useState<SaveTrainerHighlightRequest>({
    title: '',
    description: '',
    coverImage: '',
  });

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [trainerUserId, setTrainerUserId] = useState<number | undefined>(undefined);
  const [trainerName, setTrainerName] = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      try {
        const list = await getMyHighlights();
        const detail = list.find((h) => h.id === highlightId);
        if (detail) {
          setTrainerUserId(detail.trainerUserId);
          setTrainerName(detail.trainerName);
          setForm({
            title: detail.title || '',
            description: detail.description || '',
            coverImage: detail.coverImage || '',
          });
          setFiles(
            (detail.files || []).map((f) => ({
              id: f.id,
              fileType: f.fileType,
              fileUrl: f.fileUrl,
              thumbnailUrl: f.thumbnailUrl || undefined,
              title: f.title || undefined,
              fileSize: f.fileSize ?? undefined,
              sortOrder: f.sortOrder,
            })),
          );
        }
      } catch {
        // 平台层已统一处理错误提示
      } finally {
        setLoading(false);
      }
    })();
  }, [highlightId]);

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

  const handleAddFile = useCallback(
    async (file: UploadedFile) => {
      try {
        const saved = await addHighlightFile(highlightId, {
          fileType: file.fileType,
          fileUrl: file.fileUrl,
          thumbnailUrl: file.thumbnailUrl || '',
          title: file.title || '',
          fileSize: file.fileSize,
          sortOrder: file.sortOrder,
        });
        setFiles((prev) => [
          ...prev,
          {
            id: saved.id,
            fileType: saved.fileType,
            fileUrl: saved.fileUrl,
            thumbnailUrl: saved.thumbnailUrl || undefined,
            title: saved.title || undefined,
            fileSize: saved.fileSize ?? undefined,
            sortOrder: saved.sortOrder,
          },
        ]);
      } catch {
        // 平台层已统一处理错误提示
      }
    },
    [highlightId],
  );

  const handleRemoveFile = useCallback(
    async (index: number, file: UploadedFile) => {
      if (file.id) {
        try {
          await deleteHighlightFile(highlightId, file.id);
        } catch {
          // 平台层已统一处理错误提示
          return;
        }
      }
      setFiles((prev) => prev.filter((_, i) => i !== index));
    },
    [highlightId],
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await updateHighlight(highlightId, form);
      toast.success('已更新');
      router.push(ROUTES.UC_HIGHLIGHTS_MANAGE);
    } catch {
      // 平台层已统一处理错误提示
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setSubmitting(true);
    try {
      await updateHighlightDraft(highlightId, form);
      toast.success('草稿已保存');
      router.push(ROUTES.UC_HIGHLIGHTS_MANAGE);
    } catch {
      // 平台层已统一处理错误提示
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
        <BoundPublisherGuard>
        <OwnedTrainerBanner trainerUserId={trainerUserId} trainerNameHint={trainerName} />
        <FormField label="标题">
          <input
            type="text"
            value={form.title || ''}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="请输入标题"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </FormField>

        <FormField label="描述">
          <textarea
            value={form.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
            rows={3}
            placeholder="请输入描述"
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
            onClick={handleSaveDraft}
            disabled={submitting}
            className="border border-slate-200 text-gray-700 text-sm px-6 py-2.5 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {submitting ? '保存中...' : '保存草稿'}
          </button>
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
            className="border border-slate-200 text-gray-600 text-sm px-6 py-2.5 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center"
          >
            取消
          </Link>
        </div>
        </BoundPublisherGuard>
      </div>
    </section>
  );
}
