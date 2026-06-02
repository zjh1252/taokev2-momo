'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ROUTES } from '@/config/routes';
import { createDemand } from '@/features/demand/api/service';
import { DemandType, COURSE_TYPE_OPTIONS, type CreateDemandRequest } from '@/features/demand/api/types';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import RegionCascader, { type RegionValue } from '@/components/region-cascader';

/**
 * 发布需求页
 */
export default function CreateDemandPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const initialType = searchParams.get('type') || DemandType.DEFAULT;
  const sourceCourseId = searchParams.get('courseid');
  const initialCourseType = searchParams.get('courseType') || undefined;
  const initialIntendedTrainer = searchParams.get('intendedTrainer') || '';

  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateDemandRequest>({
    demandType: initialType,
    title: '',
    trainingTopic: '',
    traineeCount: undefined,
    budgetMin: undefined,
    budgetMax: undefined,
    expectedStartDate: undefined,
    courseType: initialCourseType,
    intendedTrainer: initialIntendedTrainer,
    description: '',
    sourceCaseId: undefined,
    sourceCourseId: sourceCourseId ? Number(sourceCourseId) : undefined,
    contactName: '',
    contactPhone: '',
    provinceId: undefined,
    cityId: undefined,
    districtId: undefined,
  });

  useEffect(() => {
    if (!form.contactPhone && user?.phone) {
      setForm((prev) => ({ ...prev, contactPhone: user.phone }));
    }
  }, [user?.phone]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateField = <K extends keyof CreateDemandRequest>(key: K, value: CreateDemandRequest[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegionChange = (val: RegionValue) => {
    setForm((prev) => ({
      ...prev,
      provinceId: val.provinceId,
      cityId: val.cityId,
      districtId: val.districtId,
    }));
  };

  const handleSubmit = async () => {
    if (!form.trainingTopic?.trim() && !form.title?.trim()) {
      toast.error('请填写培训主题或需求标题');
      return;
    }
    setSubmitting(true);
    try {
      await createDemand(form);
      toast.success('需求发布成功！');
      router.push(ROUTES.UC_DEMANDS);
    } catch {
      // apiClient 已弹 toast
    } finally {
      setSubmitting(false);
    }
  };

  const isReservation = form.demandType === DemandType.INTERNAL_RESERVATION;

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
        <Link href={ROUTES.UC_DEMANDS} className="text-gray-400 hover:text-primary">
          <ArrowLeft className="size-5" />
        </Link>
        <h2 className="font-bold text-gray-800">
          {isReservation ? '内训课预约' : '发布培训需求'}
        </h2>
      </div>

      <div className="p-6 max-w-2xl">
        <div className="space-y-5">
          {/* 培训主题 */}
          <fieldset>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              培训主题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.trainingTopic || ''}
              onChange={(e) => updateField('trainingTopic', e.target.value)}
              placeholder="请输入培训主题，如：销售技巧提升培训"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </fieldset>

          {/* 需求标题（非预约时显示） */}
          {!isReservation && (
            <fieldset>
              <label className="block text-sm font-medium text-gray-700 mb-1">需求标题</label>
              <input
                type="text"
                value={form.title || ''}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="给需求起个标题（选填）"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </fieldset>
          )}

          {/* 联系人 */}
          <fieldset>
            <label className="block text-sm font-medium text-gray-700 mb-1">联系人</label>
            <input
              type="text"
              value={form.contactName || ''}
              onChange={(e) => updateField('contactName', e.target.value)}
              placeholder="请输入联系人姓名"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </fieldset>

          {/* 联系电话 */}
          <fieldset>
            <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
            <input
              type="tel"
              value={form.contactPhone || ''}
              onChange={(e) => updateField('contactPhone', e.target.value)}
              placeholder="请输入联系电话"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </fieldset>

          {/* 培训人数 */}
          <fieldset>
            <label className="block text-sm font-medium text-gray-700 mb-1">培训人数</label>
            <input
              type="number"
              value={form.traineeCount ?? ''}
              onChange={(e) => updateField('traineeCount', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="预计参训人数"
              min={1}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </fieldset>

          {/* 预算范围 */}
          <fieldset>
            <label className="block text-sm font-medium text-gray-700 mb-1">预算范围</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={form.budgetMin ?? ''}
                onChange={(e) => updateField('budgetMin', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="最低预算"
                min={0}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <span className="text-gray-400">—</span>
              <input
                type="number"
                value={form.budgetMax ?? ''}
                onChange={(e) => updateField('budgetMax', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="最高预算"
                min={0}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <span className="text-gray-500 text-sm shrink-0">元</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">留空表示面议</p>
          </fieldset>

          {/* 期望开始时间 */}
          <fieldset>
            <label className="block text-sm font-medium text-gray-700 mb-1">期望开始时间</label>
            <input
              type="date"
              value={form.expectedStartDate || ''}
              onChange={(e) => updateField('expectedStartDate', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </fieldset>

          {/* 培训类型 */}
          <fieldset>
            <label className="block text-sm font-medium text-gray-700 mb-1">培训类型</label>
            <div className="flex gap-3">
              {COURSE_TYPE_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="courseType"
                    value={opt.value}
                    checked={form.courseType === opt.value}
                    onChange={(e) => updateField('courseType', e.target.value)}
                    className="accent-primary"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* 意向专家 */}
          <fieldset>
            <label className="block text-sm font-medium text-gray-700 mb-1">意向专家</label>
            <input
              type="text"
              value={form.intendedTrainer || ''}
              onChange={(e) => updateField('intendedTrainer', e.target.value)}
              placeholder="如有意向专家请填写其姓名（选填）"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </fieldset>

          {/* 培训地区 */}
          <fieldset>
            <label className="block text-sm font-medium text-gray-700 mb-1">培训地区</label>
            <RegionCascader
              maxLevel={3}
              value={{
                provinceId: form.provinceId,
                cityId: form.cityId,
                districtId: form.districtId,
              }}
              onChange={handleRegionChange}
            />
          </fieldset>

          {/* 详细描述 */}
          <fieldset>
            <label className="block text-sm font-medium text-gray-700 mb-1">详细描述</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="请描述您的具体需求，如培训目标、时间要求、特殊需求等"
              rows={5}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y"
            />
          </fieldset>

          {/* 提交 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-2.5 rounded-md text-sm font-medium transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              提交需求
            </button>
            <Link
              href={ROUTES.UC_DEMANDS}
              className="px-6 py-2.5 rounded-md text-sm border border-slate-300 text-gray-600 hover:bg-slate-50 transition-colors"
            >
              取消
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
