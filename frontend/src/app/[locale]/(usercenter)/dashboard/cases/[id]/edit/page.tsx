'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import {
  getMyCaseDetail,
  updateCase,
  addCaseFile,
  deleteCaseFile,
} from '@/features/trainer-case/api/service';
import { uploadImage } from '@/features/course/api/publisher-service';
import type { SaveTrainerCaseRequest } from '@/features/trainer-case/api/types';
import { validateForm, getFirstError, getTodayDateValue, Validators } from '@/lib/validation';
import { CASE_RULES, traineeCountValidator } from '@/features/trainer-case/lib/case-form-rules';
import { ArrowLeft, Upload } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { MultiFileUploader, type UploadedFile } from '@/components/multi-file-uploader';
import { FormField } from '@/components/FormField';
import RegionCascader, { type RegionValue } from '@/components/region-cascader';
import { toast } from 'sonner';
import { OwnedTrainerBanner } from '@/features/binding/components/owned-trainer-banner';
import { BoundPublisherGuard } from '@/features/binding/components/BoundPublisherGuard';

export default function EditCasePage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const caseId = Number(params.id);
  const searchParams = useSearchParams();
  const trainerUserIdFromUrl = searchParams.get('trainerUserId');
  const initialTrainerUserId = trainerUserIdFromUrl ? Number(trainerUserIdFromUrl) : undefined;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  // 使用 Partial 以便 ID 在初始/未选择时保持 undefined，便于必填校验
  const [form, setForm] = useState<Partial<SaveTrainerCaseRequest>>({
    caseTitle: '',
    enterpriseName: '',
    industry: '',
    trainingTopic: '',
    trainingEffect: '',
    traineeCount: undefined,
    provinceId: undefined,
    cityId: undefined,
    districtId: undefined,
    townId: undefined,
    trainingAddress: '',
    trainingDate: '',
    description: '',
    coverImage: '',
  });

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [trainerUserId, setTrainerUserId] = useState<number | undefined>(undefined);
  const [trainerName, setTrainerName] = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      try {
        const detail = await getMyCaseDetail(caseId, initialTrainerUserId);
        setTrainerUserId(detail.trainerUserId);
        setTrainerName(detail.trainerName);
        setForm({
          caseTitle: detail.caseTitle,
          enterpriseName: detail.enterpriseName,
          industry: detail.industry || '',
          trainingTopic: detail.trainingTopic || '',
          trainingEffect: detail.trainingEffect || '',
          traineeCount: detail.traineeCount ?? undefined,
          provinceId: detail.provinceId ?? undefined,
          cityId: detail.cityId ?? undefined,
          districtId: detail.districtId ?? undefined,
          townId: detail.townId ?? undefined,
          trainingAddress: detail.trainingAddress || '',
          trainingDate: detail.trainingDate || '',
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
      } catch {
        // 平台层已统一处理错误提示
      } finally {
        setLoading(false);
      }
    })();
  }, [caseId, initialTrainerUserId]);

  const updateField = <K extends keyof SaveTrainerCaseRequest>(
    key: K,
    value: SaveTrainerCaseRequest[K] | undefined,
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleTrainingDateChange = (value: string) => {
    const error = Validators.notFutureDate('培训日期不能晚于今天')(value);
    if (error) {
      toast.error(error);
      return;
    }
    updateField('trainingDate', value);
  };

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
        const saved = await addCaseFile(caseId, {
          fileType: file.fileType,
          fileUrl: file.fileUrl,
          thumbnailUrl: file.thumbnailUrl || '',
          title: file.title || '',
          fileSize: file.fileSize,
          sortOrder: file.sortOrder,
        }, trainerUserId);
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
    [caseId, trainerUserId],
  );

  const handleRemoveFile = useCallback(
    async (index: number, file: UploadedFile) => {
      if (file.id) {
        try {
          await deleteCaseFile(caseId, file.id, trainerUserId);
        } catch {
          // 平台层已统一处理错误提示
          return;
        }
      }
      setFiles((prev) => prev.filter((_, i) => i !== index));
    },
    [caseId, trainerUserId],
  );

  const handleSubmit = async () => {
    // 表单验证
    const validation = validateForm(form as SaveTrainerCaseRequest, CASE_RULES);
    if (!validation.valid) {
      const firstError = getFirstError(validation.errors);
      toast.error(firstError || '请完善必填信息');
      return;
    }

    setSubmitting(true);
    try {
      await updateCase(caseId, form as SaveTrainerCaseRequest, trainerUserId);
      toast.success('案例已更新');
      router.push(ROUTES.UC_CASES_MANAGE);
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
        <Link href={ROUTES.UC_CASES_MANAGE} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="size-5" />
        </Link>
        <h2 className="text-lg font-bold text-gray-800">编辑案例</h2>
      </div>

      <div className="px-6 py-6 max-w-2xl space-y-5">
        <BoundPublisherGuard>
        <OwnedTrainerBanner trainerUserId={trainerUserId} trainerNameHint={trainerName} />
        <FormField label="标题" required>
          <input
            type="text"
            value={form.caseTitle}
            onChange={(e) => updateField('caseTitle', e.target.value)}
            placeholder="请输入标题"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </FormField>

        <FormField label="企业名称" required>
          <input
            type="text"
            value={form.enterpriseName}
            onChange={(e) => updateField('enterpriseName', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="行业">
            <input
              type="text"
              value={form.industry || ''}
              onChange={(e) => updateField('industry', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </FormField>
          <FormField label="培训主题">
            <input
              type="text"
              value={form.trainingTopic || ''}
              onChange={(e) => updateField('trainingTopic', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </FormField>
        </div>

        <FormField label="培训地点" required>
          <RegionCascader
            value={{
              provinceId: form.provinceId,
              cityId: form.cityId,
              districtId: form.districtId,
              townId: form.townId,
            }}
            onChange={(v: RegionValue) =>
              setForm((prev) => ({
                ...prev,
                provinceId: v.provinceId,
                cityId: v.cityId,
                districtId: v.districtId,
                townId: v.townId,
              }))
            }
            maxLevel={4}
            requireDistrict
          />
        </FormField>

        <FormField label="详细地址">
          <input
            type="text"
            value={form.trainingAddress || ''}
            onChange={(e) => updateField('trainingAddress', e.target.value)}
            maxLength={200}
            placeholder="街道、楼宇号等（选填）"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="培训日期">
            <input
              type="date"
              value={form.trainingDate || ''}
              max={getTodayDateValue()}
              onChange={(e) => handleTrainingDateChange(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </FormField>
          <FormField label="受训人数">
            <input
              type="number"
              min={1}
              step={1}
              value={form.traineeCount ?? ''}
              onChange={(e) =>
                updateField('traineeCount', e.target.value ? Number(e.target.value) : undefined)
              }
              onBlur={() => {
                const err = traineeCountValidator(form.traineeCount);
                if (err) toast.warning(err);
              }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </FormField>
        </div>

        <FormField label="培训效果">
          <textarea
            value={form.trainingEffect || ''}
            onChange={(e) => updateField('trainingEffect', e.target.value)}
            rows={3}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
        </FormField>

        <FormField label="描述">
          <textarea
            value={form.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
            rows={4}
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
            {submitting ? '提交中...' : '保存修改'}
          </button>
          <Link
            href={ROUTES.UC_CASES_MANAGE}
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
