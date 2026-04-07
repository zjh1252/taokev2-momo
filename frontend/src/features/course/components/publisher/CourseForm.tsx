'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import RichTextEditor from '@/components/rich-text-editor';
import RegionCascader, { type RegionValue } from '@/components/region-cascader';
import { getCourseCategoryTree } from '@/features/course/api/service';
import { uploadImage } from '@/features/course/api/publisher-service';
import type {
  CourseType,
  CategoryTreeNode,
  SaveCourseRequest,
  CoursePlanDTO,
  CourseDetail,
} from '@/features/course/api/types';
import {
  ImagePlus,
  X,
  Plus,
  Trash2,
  ChevronDown,
  MapPin,
  Monitor,
  CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseFormProps {
  initialData?: CourseDetail;
  onSubmit: (data: SaveCourseRequest) => Promise<void>;
  submitting?: boolean;
}

type PlanModalStep = 'closed' | 'select-type' | 'edit-plans';

/**
 * 课程创建/编辑表单（通用）
 * <p>
 * 课程默认为内训课类型，用户通过「是否有公开课计划」开关来启用公开课，
 * 启用后 Modal 引导：Step1 选择线下/线上 → Step2 填写开课计划列表。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-07 14:00
 */
export default function CourseForm({ initialData, onSubmit, submitting }: CourseFormProps) {
  // ---- 基本信息 ----
  const [title, setTitle] = useState(initialData?.title || '');
  const [categoryId, setCategoryId] = useState<number>(initialData?.categoryId || 0);
  const [subCategoryId, setSubCategoryId] = useState<number>(initialData?.subCategoryId || 0);
  const [coverUrl, setCoverUrl] = useState(initialData?.coverUrl || '');
  const [durationDays, setDurationDays] = useState(initialData?.durationDays || 1);
  const [hoursPerDay, setHoursPerDay] = useState(initialData?.hoursPerDay || 6);
  const [price, setPrice] = useState(initialData?.price || 0);
  const [originalPrice, setOriginalPrice] = useState(initialData?.originalPrice || 0);
  const [isFree, setIsFree] = useState(initialData?.isFree || 0);
  const [keywords, setKeywords] = useState(initialData?.keywords || '');
  const [audience, setAudience] = useState(initialData?.audience || '');
  const [highlights, setHighlights] = useState(initialData?.highlights || '');

  // ---- 公开课计划控制 ----
  const [hasPlan, setHasPlan] = useState(initialData?.hasPlan || 0);
  const [planType, setPlanType] = useState<'OPEN_OFFLINE' | 'OPEN_ONLINE'>(
    initialData?.type === 'OPEN_ONLINE' ? 'OPEN_ONLINE' : 'OPEN_OFFLINE',
  );
  const [modalStep, setModalStep] = useState<PlanModalStep>('closed');

  // Modal 中临时编辑的计划（确认后才写回主状态）
  const [draftPlans, setDraftPlans] = useState<CoursePlanDTO[]>([]);
  const [draftPlanType, setDraftPlanType] = useState<'OPEN_OFFLINE' | 'OPEN_ONLINE'>('OPEN_OFFLINE');

  // ---- 富文本 ----
  const [intro, setIntro] = useState(initialData?.intro || '');
  const [syllabus, setSyllabus] = useState(initialData?.syllabus || '');

  // ---- 已确认的开课计划 ----
  const [plans, setPlans] = useState<CoursePlanDTO[]>(
    initialData?.plans?.map((p) => ({
      id: p.id,
      startTime: p.startTime?.slice(0, 16) || '',
      endTime: p.endTime?.slice(0, 16) || '',
      provinceId: p.provinceId,
      cityId: p.cityId,
      districtId: p.districtId,
      address: p.address,
      onlineUrl: p.onlineUrl,
      sortOrder: p.sortOrder,
    })) || [],
  );

  // ---- 分类树 ----
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);
  const subCategories = categoryTree.find((c) => c.id === categoryId)?.children || [];

  useEffect(() => {
    getCourseCategoryTree().then(setCategoryTree).catch(() => {});
  }, []);

  // ---- 封面上传 ----
  const [uploading, setUploading] = useState(false);
  const handleCoverUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setCoverUrl(url);
    } catch {
      alert('封面上传失败');
    } finally {
      setUploading(false);
    }
  }, []);

  // ---- Modal: 打开 ----
  const openPlanModal = () => {
    setDraftPlanType(planType);
    setDraftPlans(
      plans.length > 0
        ? plans.map((p) => ({ ...p }))
        : [{ startTime: '', endTime: '', address: '', onlineUrl: '', sortOrder: 0 }],
    );
    setModalStep('select-type');
  };

  // ---- Modal: 选择类型后进入编辑 ----
  const handleSelectType = (type: 'OPEN_OFFLINE' | 'OPEN_ONLINE') => {
    setDraftPlanType(type);
    if (draftPlans.length === 0) {
      setDraftPlans([{ startTime: '', endTime: '', address: '', onlineUrl: '', sortOrder: 0 }]);
    }
    setModalStep('edit-plans');
  };

  // ---- Modal: 计划增删改 ----
  const addDraftPlan = () => {
    setDraftPlans((prev) => [
      ...prev,
      { startTime: '', endTime: '', address: '', onlineUrl: '', sortOrder: prev.length },
    ]);
  };
  const removeDraftPlan = (idx: number) => setDraftPlans((prev) => prev.filter((_, i) => i !== idx));
  const updateDraftPlan = (idx: number, patch: Partial<CoursePlanDTO>) => {
    setDraftPlans((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };

  // ---- Modal: 确认保存 ----
  const confirmPlans = () => {
    setPlanType(draftPlanType);
    setPlans(draftPlans);
    setHasPlan(1);
    setModalStep('closed');
  };

  // ---- 关闭 Modal（取消） ----
  const closeModal = () => setModalStep('closed');

  // ---- 开课计划开关 ----
  const handleTogglePlan = (checked: boolean) => {
    if (checked) {
      openPlanModal();
    } else {
      setHasPlan(0);
      setPlans([]);
    }
  };

  // ---- 提交 ----
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { alert('请填写课程标题'); return; }
    if (!intro || intro === '<p><br></p>') { alert('请填写课程介绍'); return; }

    const effectiveType: CourseType = hasPlan ? planType : 'INTERNAL';
    const data: SaveCourseRequest = {
      title: title.trim(),
      type: effectiveType,
      categoryId: categoryId || undefined,
      subCategoryId: subCategoryId || undefined,
      coverUrl: coverUrl || undefined,
      intro,
      syllabus: syllabus || undefined,
      audience: audience.trim() || undefined,
      highlights: highlights.trim() || undefined,
      durationDays: durationDays || undefined,
      hoursPerDay: hoursPerDay || undefined,
      price: isFree ? 0 : price || undefined,
      originalPrice: isFree ? 0 : originalPrice || undefined,
      isFree,
      hasPlan,
      keywords: keywords.trim() || undefined,
      plans: hasPlan ? plans : undefined,
    };
    await onSubmit(data);
  };

  return (
    <>
      <form onSubmit={handleFormSubmit} className="space-y-8">
        {/* ===== 区块1：基本信息 ===== */}
        <FormSection title="基本信息">
          <FieldRow label="课程标题" required>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="输入课程标题，建议 10-40 个字" maxLength={80} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </FieldRow>

          <FieldRow label="课程分类">
            <div className="flex gap-3">
              <div className="relative">
                <select value={categoryId} onChange={(e) => { setCategoryId(Number(e.target.value)); setSubCategoryId(0); }} className="appearance-none border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white min-w-[160px]">
                  <option value={0}>请选择一级分类</option>
                  {categoryTree.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown className="size-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {subCategories.length > 0 && (
                <div className="relative">
                  <select value={subCategoryId} onChange={(e) => setSubCategoryId(Number(e.target.value))} className="appearance-none border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white min-w-[160px]">
                    <option value={0}>请选择二级分类</option>
                    {subCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <ChevronDown className="size-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              )}
            </div>
          </FieldRow>

          <FieldRow label="课程封面">
            <div className="flex items-center gap-4">
              {coverUrl ? (
                <div className="relative w-[200px] h-[125px] rounded-lg overflow-hidden border border-slate-200">
                  <Image src={coverUrl} alt="封面" width={200} height={125} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setCoverUrl('')} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70">
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : (
                <label className="w-[200px] h-[125px] border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-red-50/30 transition-colors">
                  <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                  {uploading ? (
                    <div className="animate-spin rounded-full size-6 border-2 border-primary border-t-transparent" />
                  ) : (
                    <>
                      <ImagePlus className="size-6 text-gray-400" />
                      <span className="text-xs text-gray-400 mt-1">上传封面</span>
                      <span className="text-[10px] text-gray-300 mt-0.5">建议 16:10 比例</span>
                    </>
                  )}
                </label>
              )}
            </div>
          </FieldRow>

          <FieldRow label="课程时长">
            <div className="flex items-center gap-3">
              <input type="number" min={1} value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))} className="w-20 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              <span className="text-sm text-gray-500">天</span>
              <input type="number" min={0} step={0.5} value={hoursPerDay} onChange={(e) => setHoursPerDay(Number(e.target.value))} className="w-20 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              <span className="text-sm text-gray-500">小时/天</span>
            </div>
          </FieldRow>

          <FieldRow label="课程价格">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={isFree === 1} onChange={(e) => setIsFree(e.target.checked ? 1 : 0)} className="rounded border-slate-300 text-primary focus:ring-primary" />
                免费课程
              </label>
              {!isFree && (
                <>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-500">¥</span>
                    <input type="number" min={0} step={0.01} value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-28 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="售价" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-400">原价 ¥</span>
                    <input type="number" min={0} step={0.01} value={originalPrice} onChange={(e) => setOriginalPrice(Number(e.target.value))} className="w-28 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="划线价" />
                  </div>
                </>
              )}
            </div>
          </FieldRow>

          {/* 开课计划 */}
          <FieldRow label="开课计划">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={hasPlan === 1} onChange={(e) => handleTogglePlan(e.target.checked)} className="rounded border-slate-300 text-primary focus:ring-primary" />
                  是否有公开课计划
                </label>
              </div>
              {hasPlan === 1 && (
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays className="size-4 text-primary" />
                      <span className="font-medium text-gray-700">
                        {planType === 'OPEN_OFFLINE' ? '线下公开课' : '线上公开课'}
                      </span>
                      <span className="text-gray-400">· {plans.length} 条计划</span>
                    </div>
                    <button type="button" onClick={openPlanModal} className="text-xs text-primary hover:text-primary/80 transition-colors">
                      编辑计划
                    </button>
                  </div>
                  {plans.map((plan, idx) => (
                    <div key={idx} className="text-xs text-gray-500 py-1.5 border-t border-slate-200 first:border-t-0 flex items-center gap-2">
                      <span className="text-gray-400 w-5">{idx + 1}.</span>
                      <span>{plan.startTime ? plan.startTime.replace('T', ' ') : '未设置'}</span>
                      <span>~</span>
                      <span>{plan.endTime ? plan.endTime.replace('T', ' ') : '未设置'}</span>
                      {planType === 'OPEN_OFFLINE' && plan.address && (
                        <span className="text-gray-400">· {plan.address}</span>
                      )}
                      {planType === 'OPEN_ONLINE' && plan.onlineUrl && (
                        <span className="text-gray-400 truncate max-w-[200px]">· {plan.onlineUrl}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FieldRow>

          <FieldRow label="关键词">
            <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="多个关键词用逗号分隔" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </FieldRow>

          <FieldRow label="适用人群">
            <textarea value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="描述本课程适用的目标人群" rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
          </FieldRow>

          <FieldRow label="课程亮点">
            <textarea value={highlights} onChange={(e) => setHighlights(e.target.value)} placeholder="描述课程核心亮点和收益" rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
          </FieldRow>
        </FormSection>

        {/* ===== 区块2：课程介绍 ===== */}
        <FormSection title="课程介绍" required>
          <RichTextEditor value={intro} onChange={setIntro} placeholder="输入课程详细介绍..." />
        </FormSection>

        {/* ===== 区块3：课程大纲 ===== */}
        <FormSection title="课程大纲">
          <RichTextEditor value={syllabus} onChange={setSyllabus} placeholder="输入课程大纲..." minHeight={200} />
        </FormSection>

        {/* 提交按钮 */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
          <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 bg-primary text-white px-8 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60">
            {submitting && <div className="animate-spin rounded-full size-4 border-2 border-white border-t-transparent" />}
            {initialData ? '保存修改' : '保存草稿'}
          </button>
        </div>
      </form>

      {/* ===== 公开课计划 Modal（两步式） ===== */}
      {modalStep !== 'closed' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeModal}>
          <div
            className="bg-white rounded-xl shadow-2xl w-[560px] max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ---- Step 1: 选择类型 ---- */}
            {modalStep === 'select-type' && (
              <div className="p-6">
                <h3 className="text-base font-bold text-gray-800 mb-1">选择公开课类型</h3>
                <p className="text-xs text-gray-400 mb-5">请选择您要发布的公开课形式</p>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => handleSelectType('OPEN_OFFLINE')}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-3 border-2 rounded-xl py-6 transition-all hover:shadow-md',
                      draftPlanType === 'OPEN_OFFLINE'
                        ? 'border-primary bg-red-50/60 ring-1 ring-primary/30'
                        : 'border-slate-200 hover:border-primary/40',
                    )}
                  >
                    <MapPin className="size-8 text-primary" />
                    <span className="font-medium text-gray-800">线下公开课</span>
                    <span className="text-xs text-gray-400">线下实地授课</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectType('OPEN_ONLINE')}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-3 border-2 rounded-xl py-6 transition-all hover:shadow-md',
                      draftPlanType === 'OPEN_ONLINE'
                        ? 'border-primary bg-red-50/60 ring-1 ring-primary/30'
                        : 'border-slate-200 hover:border-primary/40',
                    )}
                  >
                    <Monitor className="size-8 text-primary" />
                    <span className="font-medium text-gray-800">线上公开课</span>
                    <span className="text-xs text-gray-400">在线直播或录播</span>
                  </button>
                </div>
                <button type="button" onClick={closeModal} className="w-full mt-4 text-sm text-gray-400 hover:text-gray-600 text-center py-2">
                  取消
                </button>
              </div>
            )}

            {/* ---- Step 2: 填写开课计划列表 ---- */}
            {modalStep === 'edit-plans' && (
              <>
                <div className="px-6 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="text-base font-bold text-gray-800">
                      {draftPlanType === 'OPEN_OFFLINE' ? '线下公开课' : '线上公开课'} · 开课计划
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">填写开课时间、地点等信息，可添加多条计划</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalStep('select-type')}
                    className="text-xs text-primary hover:underline"
                  >
                    切换类型
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  {draftPlans.map((plan, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 relative">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-gray-600">计划 {idx + 1}</span>
                        {draftPlans.length > 1 && (
                          <button type="button" onClick={() => removeDraftPlan(idx)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">开始时间 <span className="text-red-400">*</span></label>
                          <input type="datetime-local" value={plan.startTime} onChange={(e) => updateDraftPlan(idx, { startTime: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">结束时间 <span className="text-red-400">*</span></label>
                          <input type="datetime-local" value={plan.endTime} onChange={(e) => updateDraftPlan(idx, { endTime: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                        {draftPlanType === 'OPEN_OFFLINE' && (
                          <>
                            <div className="col-span-2">
                              <label className="block text-xs text-gray-500 mb-1">省/市/区 <span className="text-red-400">*</span></label>
                              <RegionCascader
                                value={{
                                  provinceId: plan.provinceId || undefined,
                                  cityId: plan.cityId || undefined,
                                  districtId: plan.districtId || undefined,
                                }}
                                onChange={(region: RegionValue) => {
                                  updateDraftPlan(idx, {
                                    provinceId: region.provinceId || 0,
                                    cityId: region.cityId || 0,
                                    districtId: region.districtId || 0,
                                  });
                                }}
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs text-gray-500 mb-1">详细地址</label>
                              <input type="text" value={plan.address || ''} onChange={(e) => updateDraftPlan(idx, { address: e.target.value })} placeholder="街道门牌号等详细地址" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                            </div>
                          </>
                        )}
                        {draftPlanType === 'OPEN_ONLINE' && (
                          <div className="col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">直播/回放地址 <span className="text-red-400">*</span></label>
                            <input type="text" value={plan.onlineUrl || ''} onChange={(e) => updateDraftPlan(idx, { onlineUrl: e.target.value })} placeholder="https://..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addDraftPlan}
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors w-full justify-center border border-dashed border-primary/30 rounded-lg py-2.5 hover:bg-red-50/30"
                  >
                    <Plus className="size-4" />
                    继续添加开课计划
                  </button>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                  <button type="button" onClick={closeModal} className="px-5 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={confirmPlans}
                    className="px-6 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    确认保存
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ---- 表单区块容器 ---- */
function FormSection({ title, required, children }: { title: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-sm font-bold text-gray-700">
          {title}
          {required && <span className="text-red-500 ml-1">*</span>}
        </h3>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

/* ---- 表单行 ---- */
function FieldRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 mb-5 last:mb-0">
      <div className="sm:w-[100px] shrink-0 pt-2">
        <label className="text-sm text-gray-600">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
