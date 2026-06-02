'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import RichTextEditor from '@/components/rich-text-editor';
import RegionCascader, { type RegionValue } from '@/components/region-cascader';
import { ImageCropperUploader } from '@/components/image-cropper-uploader';
import { getCourseCategoryTree } from '@/features/course/api/service';
import { parseCourseMaterial } from '@/features/course/api/publisher-service';
import type {
  CourseType,
  CategoryTreeNode,
  SaveCourseRequest,
  CoursePlanDTO,
  CourseDetail,
  AiParsedFields,
} from '@/features/course/api/types';
import {
  Plus,
  Trash2,
  ChevronDown,
  MapPin,
  Monitor,
  CalendarDays,
  Sparkles,
  Upload,
  FileText,
  Loader2,
  X,
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
  // 课程总时长（小时），与课程天数为两个独立字段
  const [totalHours, setTotalHours] = useState<number>(initialData?.totalHours || 6);
  const [price, setPrice] = useState(initialData?.price || 0);
  const [originalPrice, setOriginalPrice] = useState(initialData?.originalPrice || 0);

  /**
   * 价格 / 原价联动：仅当「另一个」字段还是 0（未填写）时，输入会自动填充到另一个，
   * 方便「无折扣」课程一次填写；一旦另一字段已有非 0 值则不再覆盖，可独立设置划线价。
   */
  const handlePriceChange = (v: number) => {
    setPrice(v);
    if (originalPrice === 0) setOriginalPrice(v);
  };
  const handleOriginalPriceChange = (v: number) => {
    setOriginalPrice(v);
    if (price === 0) setPrice(v);
  };

  const [isFree, setIsFree] = useState(initialData?.isFree || 0);
  const [isFeatured, setIsFeatured] = useState<number>(initialData?.isFeatured || 0);
  const [keywords, setKeywords] = useState(initialData?.keywords || '');
  const [audience, setAudience] = useState(initialData?.audience || '');
  const [highlights, setHighlights] = useState(initialData?.highlights || '');
  // 课程资料上传后保存的 URL（来源于「AI 解析课程资料」按钮）
  const [materialUrl, setMaterialUrl] = useState(initialData?.materialUrl || '');
  // AI 抽取后的全文，提交时随 SaveCourseRequest 一起回传，供后端持久化
  const [materialText, setMaterialText] = useState(initialData?.materialText || '');

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

  /**
   * 校验单条开课计划的时间是否合法。
   *
   * <p>规则：</p>
   * <ol>
   *   <li>开始时间、结束时间均必填</li>
   *   <li>结束时间必须晚于开始时间</li>
   *   <li>结束时间不能早于当前时刻（已结束的计划不允许保存）</li>
   * </ol>
   *
   * @return null 表示通过，否则返回错误提示
   */
  const validatePlanTime = (plan: CoursePlanDTO, idx: number): string | null => {
    const label = `计划 ${idx + 1}`;
    if (!plan.startTime) return `${label}：请填写开始时间`;
    if (!plan.endTime) return `${label}：请填写结束时间`;
    const start = new Date(plan.startTime);
    const end = new Date(plan.endTime);
    if (Number.isNaN(start.getTime())) return `${label}：开始时间格式无效`;
    if (Number.isNaN(end.getTime())) return `${label}：结束时间格式无效`;
    if (end.getTime() <= start.getTime()) {
      return `${label}：结束时间必须晚于开始时间`;
    }
    if (end.getTime() < Date.now()) {
      return `${label}：结束时间不能早于当前时刻`;
    }
    return null;
  };

  // ---- Modal: 确认保存 ----
  const confirmPlans = () => {
    for (let i = 0; i < draftPlans.length; i++) {
      const err = validatePlanTime(draftPlans[i], i);
      if (err) {
        toast.error(err);
        return;
      }
    }
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

  /**
   * 接收「AI 解析课程资料」返回的字段并回填表单。
   *
   * <p>策略：仅在 AI 返回非空时覆盖对应字段；用户主动点击 AI 解析意味着接受自动填充。
   * AI 抽取出的全文同时写入 {@code materialText} state，提交表单时随 SaveCourseRequest 一起回传后端。</p>
   *
   * <p>课程大纲（syllabus）不在 AI 回填范围内，由用户自行撰写。</p>
   */
  const handleAiParsed = (parsed: AiParsedFields, fullText: string) => {
    setMaterialText(fullText);
    if (parsed.title) setTitle(parsed.title);
    if (parsed.durationDays && parsed.durationDays >= 1) setDurationDays(parsed.durationDays);
    if (parsed.totalHours && parsed.totalHours >= 1) setTotalHours(parsed.totalHours);
    if (parsed.categoryId) {
      setCategoryId(parsed.categoryId);
      setSubCategoryId(0);
    }
    if (parsed.keywords && parsed.keywords.length > 0) {
      setKeywords(parsed.keywords.slice(0, 3).join('，'));
    }
    if (parsed.audience) setAudience(parsed.audience);
  };

  // ---- 提交 ----
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('请填写课程标题'); return; }
    if (!durationDays || durationDays < 1) { toast.error('课程天数至少 1 天'); return; }
    if (!totalHours || totalHours < 1) { toast.error('课程总时长至少 1 小时'); return; }
    if (!intro || intro === '<p><br></p>') { toast.error('请填写课程介绍'); return; }

    const effectiveType: CourseType = hasPlan ? planType : 'INTERNAL';
    const data: SaveCourseRequest = {
      title: title.trim(),
      type: effectiveType,
      categoryId: categoryId || undefined,
      subCategoryId: subCategoryId || undefined,
      coverUrl: coverUrl || undefined,
      intro,
      syllabus: syllabus || undefined,
      materialUrl: materialUrl || undefined,
      materialText: materialText || undefined,
      audience: audience.trim() || undefined,
      highlights: highlights.trim() || undefined,
      durationDays,
      totalHours,
      price: isFree ? 0 : price || undefined,
      originalPrice: isFree ? 0 : originalPrice || undefined,
      isFree,
      isFeatured,
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
        <FormSection
          title="基本信息"
          headerRight={
            <MaterialUploadButton
              value={materialUrl}
              onChange={setMaterialUrl}
              onAiParsed={handleAiParsed}
            />
          }
        >
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
            <ImageCropperUploader
              value={coverUrl}
              onChange={setCoverUrl}
              aspect={16 / 9}
              allowFreeAspect
              previewClassName="w-[200px] h-[125px] rounded-lg"
            />
          </FieldRow>

          <FieldRow label="课程时长" required>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={durationDays}
                onChange={(e) => setDurationDays(Math.max(1, Number(e.target.value) || 1))}
                className="w-20 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <span className="text-sm text-gray-500">天 等于</span>
              <input
                type="number"
                min={1}
                step={0.5}
                value={totalHours}
                onChange={(e) => setTotalHours(Math.max(1, Number(e.target.value) || 1))}
                className="w-20 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <span className="text-sm text-gray-500">小时</span>
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
                    <input type="number" min={0} step={0.01} value={price} onChange={(e) => handlePriceChange(Number(e.target.value))} className="w-28 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="售价" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-400">原价 ¥</span>
                    <input type="number" min={0} step={0.01} value={originalPrice} onChange={(e) => handleOriginalPriceChange(Number(e.target.value))} className="w-28 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="划线价" />
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

          <FieldRow label="是否主打课程">
            <input
              type="checkbox"
              checked={isFeatured === 1}
              onChange={(e) => setIsFeatured(e.target.checked ? 1 : 0)}
              className="rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
            />
          </FieldRow>

          <FieldRow label="关键词">
            <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="多个关键词用逗号分隔" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </FieldRow>

          <FieldRow label="目标受众">
            <textarea value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="描述本课程适用的目标人群" rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
          </FieldRow>

          <FieldRow label="课程收益">
            <textarea value={highlights} onChange={(e) => setHighlights(e.target.value)} placeholder="描述课程核心亮点和收益" rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
          </FieldRow>
        </FormSection>

        {/* ===== 区块2：课程介绍（富文本详细） ===== */}
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
            {initialData ? '保存并提交审核' : '提交审核'}
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
function FormSection({
  title,
  required,
  headerRight,
  children,
}: {
  title: string;
  required?: boolean;
  /** 标题行右侧自定义内容（如 AI 解析按钮） */
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-gray-700">
          {title}
          {required && <span className="text-red-500 ml-1">*</span>}
        </h3>
        {headerRight && <div className="flex items-center">{headerRight}</div>}
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

/* ---- 「AI 解析课程资料」上传按钮 ----
 *
 * <p>支持 doc / docx / pdf 文件上传。后端会：</p>
 * <ol>
 *   <li>把文件落到对象存储并返回 URL（写入 materialUrl）</li>
 *   <li>抽取全文（写入 materialText，前端缓存后随表单回传）</li>
 *   <li>调用 LLM 提取课程标题/时长/分类/关键词/受众/简介/大纲</li>
 *   <li>用 AI 返回的 categoryName 在 COURSE_CATEGORY 中精确匹配并填 categoryId</li>
 * </ol>
 *
 * <p>解析结果通过 {@code onAiParsed} 回调返回给父组件回填表单。</p>
 */
function MaterialUploadButton({
  value,
  onChange,
  onAiParsed,
}: {
  value: string;
  onChange: (url: string) => void;
  onAiParsed: (parsed: AiParsedFields, fullText: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);

  const accept = '.doc,.docx,.pdf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  const handleFile = async (file: File) => {
    setParsing(true);
    try {
      const result = await parseCourseMaterial(file);
      onChange(result.materialUrl);
      onAiParsed(result.parsed, result.materialText);
      toast.success('AI 解析完成，请检查并补充表单');
    } catch (err) {
      const e = err as Error & { code?: string };
      if (e?.code === 'AI_NOT_ENABLED') {
        toast.error(e.message || 'AI 能力暂未启用，请联系管理员配置');
      } else {
        toast.error(e?.message ? `解析失败：${e.message}` : '解析失败，请稍后重试');
      }
    } finally {
      setParsing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  // 已上传：展示文件名 + 重新解析 / 移除
  if (value) {
    const fileName = decodeURIComponent(value.split('/').pop() || '课程资料');
    return (
      <div className="flex items-center gap-2">
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 max-w-[180px]"
        >
          <FileText className="size-3.5 text-slate-500 shrink-0" />
          <span className="truncate">{fileName}</span>
        </a>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={parsing}
          className="text-xs text-primary hover:underline disabled:opacity-50"
        >
          {parsing ? 'AI 解析中…' : '重新解析'}
        </button>
        <button
          type="button"
          onClick={() => onChange('')}
          disabled={parsing}
          className="text-gray-400 hover:text-red-500 disabled:opacity-50"
          aria-label="移除已上传的课程资料"
        >
          <X className="size-3.5" />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={parsing}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-primary/30 text-primary hover:bg-primary/5 text-xs font-medium transition-colors disabled:opacity-50"
      >
        {parsing ? (
          <>
            <Loader2 className="size-3.5 animate-spin" />
            <span>AI 解析中…</span>
          </>
        ) : (
          <>
            <Sparkles className="size-3.5" />
            <span>AI 解析课程资料</span>
            <Upload className="size-3.5" />
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </>
  );
}
