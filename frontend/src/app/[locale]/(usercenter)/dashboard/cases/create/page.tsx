'use client';

import { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { createCase, addCaseFile } from '@/features/trainer-case/api/service';
import { uploadImage } from '@/features/course/api/publisher-service';
import type { SaveTrainerCaseRequest } from '@/features/trainer-case/api/types';
import { validateForm, getFirstError, type ValidationError, type FormValidationRules } from '@/lib/validation';
import { ArrowLeft, Upload } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { MultiFileUploader, type UploadedFile } from '@/components/multi-file-uploader';
import { FormField } from '@/components/FormField';
import { toast } from 'sonner';

export default function CreateCasePage() {
  const router = useRouter();
  const search = useSearchParams();
  const trainerUserIdParam = search.get('trainerUserId');
  const trainerUserId = trainerUserIdParam ? Number(trainerUserIdParam) : undefined;
  const [submitting, setSubmitting] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  const [form, setForm] = useState<SaveTrainerCaseRequest>({
    caseTitle: '',
    enterpriseName: '',
    industry: '',
    trainingTopic: '',
    trainingEffect: '',
    traineeCount: undefined,
    trainingDate: '',
    description: '',
    coverImage: '',
  });

  const [files, setFiles] = useState<UploadedFile[]>([]);

  const updateField = <K extends keyof SaveTrainerCaseRequest>(
    key: K,
    value: SaveTrainerCaseRequest[K],
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
    // 表单验证
    const validation = validateForm(form, CASE_RULES);
    if (!validation.valid) {
      const firstError = getFirstError(validation.errors);
      toast.error(firstError || '请完善必填信息');
      return;
    }

    setSubmitting(true);
    try {
      const created = await createCase(form, trainerUserId);

      // 逐个上传附件到子表
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        await addCaseFile(created.id, {
          fileType: f.fileType,
          fileUrl: f.fileUrl,
          thumbnailUrl: f.thumbnailUrl || '',
          title: f.title || '',
          fileSize: f.fileSize,
          sortOrder: i,
        }, trainerUserId);
      }

      toast.success('案例已创建');
      router.push(
        trainerUserId
          ? `${ROUTES.UC_CASES_MANAGE}?trainerUserId=${trainerUserId}`
          : ROUTES.UC_CASES_MANAGE,
      );
    } catch {
      // 平台层已统一处理错误提示
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
        <Link href={ROUTES.UC_CASES_MANAGE} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="size-5" />
        </Link>
        <h2 className="text-lg font-bold text-gray-800">发布案例</h2>
      </div>

      <div className="px-6 py-6 max-w-2xl space-y-5">
        <FormField label="案例标题" required>
          <input
            type="text"
            value={form.caseTitle}
            onChange={(e) => updateField('caseTitle', e.target.value)}
            placeholder="请输入案例标题"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </FormField>

        <FormField label="企业名称" required>
          <input
            type="text"
            value={form.enterpriseName}
            onChange={(e) => updateField('enterpriseName', e.target.value)}
            placeholder="请输入企业名称"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="行业">
            <input
              type="text"
              value={form.industry || ''}
              onChange={(e) => updateField('industry', e.target.value)}
              placeholder="如：金融、互联网"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </FormField>
          <FormField label="培训主题">
            <input
              type="text"
              value={form.trainingTopic || ''}
              onChange={(e) => updateField('trainingTopic', e.target.value)}
              placeholder="如：领导力提升"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="培训日期">
            <input
              type="date"
              value={form.trainingDate || ''}
              onChange={(e) => updateField('trainingDate', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </FormField>
          <FormField label="受训人数">
            <input
              type="number"
              value={form.traineeCount ?? ''}
              onChange={(e) =>
                updateField('traineeCount', e.target.value ? Number(e.target.value) : undefined)
              }
              placeholder="如：50"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </FormField>
        </div>

        <FormField label="培训效果">
          <textarea
            value={form.trainingEffect || ''}
            onChange={(e) => updateField('trainingEffect', e.target.value)}
            rows={3}
            placeholder="请描述培训效果"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
        </FormField>

        <FormField label="案例描述">
          <textarea
            value={form.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
            rows={4}
            placeholder="请详细描述案例内容"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
        </FormField>

        <FormField label="封面图">
          <div className="flex items-center gap-4">
            {form.coverImage ? (
              <div className="relative w-[160px] h-[100px] rounded-lg overflow-hidden border border-slate-200">
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
              <label className="w-[160px] h-[100px] rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="size-5 text-slate-400" />
                <span className="text-xs text-slate-400">
                  {coverUploading ? '上传中...' : '上传封面'}
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
          </div>
        </FormField>

        <FormField label="案例附件（图片/视频）">
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
            {submitting ? '提交中...' : '提交案例'}
          </button>
          <Link
            href={ROUTES.UC_CASES_MANAGE}
            className="border border-slate-200 text-gray-600 text-sm px-6 py-2.5 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center"
          >
            取消
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * 案例表单验证规则
 */
export const CASE_RULES: FormValidationRules<SaveTrainerCaseRequest> = {
  caseTitle: { required: true, requiredMessage: '请输入案例标题' },
  enterpriseName: { required: true, requiredMessage: '请输入企业名称' },
};
