'use client';

import { useEffect, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth/auth-context';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import { getApiBaseUrl } from '@/lib/env/client';
import RegionCascader from '@/components/region-cascader';
import type { RegionValue } from '@/components/region-cascader';
import type { TrainerFormData, TrainerBookFormItem } from '../../api/types';
import { FormField } from './FormField';
import type { FormValidationRules } from '@/lib/validation';
import { Validators } from '@/lib/validation';
import { ResumeUploader } from '../ResumeUploader';
import { CategoryMultiSelect } from '../CategoryMultiSelect';
import { TrainerBooksEditor } from '../TrainerBooksEditor';
import { getMyTrainerProfileAsForm, type ResumeParseResult } from '../../api/service';
import { useProfilePrefill } from '../../hooks/useProfilePrefill';

const GENDER_OPTIONS = [
  { value: 1, label: '男' },
  { value: 2, label: '女' },
];

/** 18 位身份证号格式正则（前 6 位地区码、4 位年份 18/19/20、月份、日期、3 位序号、最后 1 位校验码 0-9 或 X/x） */
const ID_CARD_REGEX =
  /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;

interface TrainerApplyFormProps {
  data: Partial<TrainerFormData>;
  onChange: (data: Partial<TrainerFormData>) => void;
}

async function uploadAvatar(file: File): Promise<string> {
  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  const formData = new FormData();
  formData.append('file', file);
  const resp = await fetch(`${getApiBaseUrl()}/uploads/avatars`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenData?.accessToken || ''}` },
    body: formData,
  });
  if (!resp.ok) throw new Error('头像上传失败');
  const json = (await resp.json()) as { data: { url: string } };
  return json.data.url;
}

/**
 * 专家（培训讲师）申请表单
 *
 * <p>对齐老站 PHP `userprofile` 申请表单字段：真实姓名 + 授课姓名 + 头像 +
 * 一句话介绍 + 擅长行业 / 擅长领域（一级多选） + 我的著作 + 淘课网售价 / 课酬 +
 * 注册专家合作协议；并提供顶部「上传简历（AI 解析）」按钮自动预填表单。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-21 22:30
 */
export function TrainerApplyForm({ data, onChange }: TrainerApplyFormProps) {
  const { user } = useAuth();
  const update = (patch: Partial<TrainerFormData>) => onChange({ ...data, ...patch });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!data.phone && user?.phone) {
      onChange({ ...data, phone: user.phone });
    }
  }, [user?.phone]); // eslint-disable-line react-hooks/exhaustive-deps

  // 已生效（status=1）的专家用户进入「修改资料」流程时自动回填档案
  useProfilePrefill<TrainerFormData>({
    role: 'TRAINER',
    data,
    onChange,
    fetcher: getMyTrainerProfileAsForm,
    isEmpty: (d) => !d.name && !d.teachingName && !d.idCardNo,
  });

  // 简历解析回填：仅覆盖空字段，避免覆盖用户已编辑的内容
  const handleParsed = (result: ResumeParseResult) => {
    const patch: Partial<TrainerFormData> = {};
    const setIfEmpty = <K extends keyof TrainerFormData>(
      key: K,
      value: TrainerFormData[K] | undefined,
    ) => {
      if (value === undefined || value === null || value === '') return;
      const current = data[key];
      const currentEmpty =
        current === undefined ||
        current === null ||
        current === '' ||
        (Array.isArray(current) && current.length === 0);
      if (currentEmpty) {
        (patch as Record<string, unknown>)[key as string] = value;
      }
    };

    setIfEmpty('name', result.realName);
    setIfEmpty('teachingName', result.teachingName ?? result.realName);
    setIfEmpty('oneLineIntro', result.oneLineIntro);
    setIfEmpty('bio', result.bio);
    setIfEmpty('background', result.background);
    setIfEmpty('teachingStyle', result.teachingStyle);
    setIfEmpty('partialClients', result.partialClients);
    setIfEmpty('phone', result.phone);
    setIfEmpty('email', result.email);
    if (result.resumeUrl) {
      patch.resumeUrl = result.resumeUrl;
    }
    onChange({ ...data, ...patch });
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadAvatar(file);
      update({ avatar: url });
      toast.success('头像上传成功');
    } catch {
      toast.error('头像上传失败，请重试');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const books: TrainerBookFormItem[] = data.books || [];
  const expertiseIds: number[] = data.expertiseCategoryIds || [];
  const industryIds: number[] = data.industryCategoryIds || [];

  return (
    <div className="space-y-8">
      {/* 简历上传（顶部突出位置） */}
      <ResumeUploader resumeUrl={data.resumeUrl} onParsed={handleParsed} />

      {/* 基本信息 */}
      <fieldset>
        <legend className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-slate-100">
          基本信息
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-x-6 gap-y-4">
          {/* 头像列 */}
          <div className="md:row-span-3">
            <FormField label="专家头像" required>
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                    {data.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={data.avatar}
                        alt="头像"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Camera className="size-7" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="size-5 text-white animate-spin" />
                    ) : (
                      <Camera className="size-5 text-white" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">点击更换</p>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarSelect}
                />
              </div>
            </FormField>
          </div>

          {/* 字段列 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <FormField label="真实姓名" required>
              <input
                type="text"
                value={data.name || ''}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="请输入真实姓名"
                className="form-input"
              />
            </FormField>
            <FormField label="授课姓名" required>
              <input
                type="text"
                value={data.teachingName || ''}
                onChange={(e) => update({ teachingName: e.target.value })}
                placeholder="对外授课时使用的姓名"
                className="form-input"
              />
            </FormField>
            <FormField label="头衔/职称">
              <input
                type="text"
                value={data.title || ''}
                onChange={(e) => update({ title: e.target.value })}
                placeholder="如：高级培训师、博士"
                className="form-input"
              />
            </FormField>
            <FormField label="性别" required>
              <div className="flex gap-4 pt-2">
                {GENDER_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={data.gender === opt.value}
                      onChange={() => update({ gender: opt.value })}
                      className="size-4 text-primary focus:ring-primary/20"
                    />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </FormField>
            <FormField label="联系电话" required>
              <input
                type="tel"
                value={data.phone || ''}
                onChange={(e) => update({ phone: e.target.value })}
                placeholder="11位手机号"
                maxLength={11}
                className="form-input"
              />
            </FormField>
            <FormField label="常用邮箱" required>
              <input
                type="email"
                value={data.email || ''}
                onChange={(e) => update({ email: e.target.value })}
                placeholder="name@example.com"
                className="form-input"
              />
            </FormField>
            <div className="md:col-span-2">
              <FormField label="身份证号" required>
                <input
                  type="text"
                  value={data.idCardNo || ''}
                  onChange={(e) => update({ idCardNo: e.target.value.trim() })}
                  placeholder="18 位身份证号"
                  maxLength={18}
                  className="form-input"
                  inputMode="text"
                  autoComplete="off"
                />
                <div className="text-xs text-gray-400 mt-1">
                  用于实名认证，提交后将妥善保密
                </div>
              </FormField>
            </div>
          </div>
        </div>
      </fieldset>

      {/* 常驻城市（省/市必填，区县选填） */}
      <fieldset>
        <legend className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-slate-100">
          常驻城市
        </legend>
        <div className="grid grid-cols-1 gap-y-4">
          <FormField label="请选择常驻城市" required>
            <RegionCascader
              maxLevel={3}
              value={{
                provinceId: data.provinceId ?? undefined,
                cityId: data.cityId ?? undefined,
                districtId: data.districtId ?? undefined,
              }}
              onChange={(val: RegionValue) =>
                update({
                  provinceId: val.provinceId ?? null,
                  cityId: val.cityId ?? null,
                  districtId: val.districtId ?? null,
                })
              }
            />
            <div className="text-xs text-gray-400 mt-1">
              省 / 市必选；区 / 县可选
            </div>
          </FormField>
        </div>
      </fieldset>

      {/* 专业信息 */}
      <fieldset>
        <legend className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-slate-100">
          专业信息
        </legend>
        <div className="grid grid-cols-1 gap-y-4">
          <FormField label="一句话介绍" required>
            <input
              type="text"
              value={data.oneLineIntro || ''}
              onChange={(e) => update({ oneLineIntro: e.target.value })}
              placeholder="80 字内简短介绍自己"
              maxLength={80}
              className="form-input"
            />
            <div className="text-xs text-gray-400 mt-1">
              {(data.oneLineIntro || '').length} / 80
            </div>
          </FormField>
          <FormField label="个人简介" required>
            <textarea
              value={data.bio || ''}
              onChange={(e) => update({ bio: e.target.value })}
              placeholder="请简要介绍您的专业背景、从业经历"
              rows={4}
              className="form-input resize-none"
            />
          </FormField>
          <FormField label="擅长行业" required>
            <CategoryMultiSelect
              type="TRAINER_INDUSTRY"
              value={industryIds}
              onChange={(ids) => update({ industryCategoryIds: ids })}
            />
          </FormField>
          <FormField label="擅长领域" required>
            <CategoryMultiSelect
              type="TRAINER_EXPERTISE"
              value={expertiseIds}
              onChange={(ids) => update({ expertiseCategoryIds: ids })}
            />
          </FormField>
          <FormField label="专业标签">
            <input
              type="text"
              value={data.expertiseTags || ''}
              onChange={(e) => update({ expertiseTags: e.target.value })}
              placeholder="多个标签用逗号分隔"
              className="form-input"
            />
          </FormField>
          <FormField label="授课风格">
            <input
              type="text"
              value={data.teachingStyle || ''}
              onChange={(e) => update({ teachingStyle: e.target.value })}
              placeholder="如：互动式、案例教学、实战演练"
              className="form-input"
            />
          </FormField>
          <FormField label="实战经历">
            <textarea
              value={data.background || ''}
              onChange={(e) => update({ background: e.target.value })}
              placeholder="请简要描述您的项目实战经历、典型案例（选填）"
              rows={3}
              className="form-input resize-none"
            />
          </FormField>
          <FormField label="服务过客户">
            <textarea
              value={data.partialClients || ''}
              onChange={(e) => update({ partialClients: e.target.value })}
              placeholder="请简要列举您服务过的代表客户，可一行一个（选填）"
              rows={3}
              className="form-input resize-none"
            />
          </FormField>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <FormField label="从业年限">
              <input
                type="number"
                min={0}
                value={data.experienceYears ?? ''}
                onChange={(e) =>
                  update({ experienceYears: e.target.value ? Number(e.target.value) : null })
                }
                placeholder="年"
                className="form-input"
              />
            </FormField>
            <FormField label="授课年限">
              <input
                type="number"
                min={0}
                value={data.teachingYears ?? ''}
                onChange={(e) =>
                  update({ teachingYears: e.target.value ? Number(e.target.value) : null })
                }
                placeholder="年"
                className="form-input"
              />
            </FormField>
          </div>
        </div>
      </fieldset>

      {/* 我的著作 */}
      <fieldset>
        <legend className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-slate-100">
          我的著作
        </legend>
        <TrainerBooksEditor
          value={books}
          onChange={(next) => update({ books: next })}
        />
      </fieldset>

      {/* 报价信息 — 与「淘课网售价/课酬」语义重合的「最低/最高报价 + 报价单位」三字段已下线，
          数据库列 quote_min / quote_max / quote_unit 保留以兼容历史数据，不再通过表单收集。 */}
      <fieldset>
        <legend className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-slate-100">
          报价信息
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <FormField label="淘课网售价（元/天）" required>
            <input
              type="number"
              min={0}
              step="0.01"
              value={data.taokePrice ?? ''}
              onChange={(e) =>
                update({ taokePrice: e.target.value ? Number(e.target.value) : null })
              }
              placeholder="对外销售单价"
              className="form-input"
            />
          </FormField>
          <FormField label="淘课网合作课酬（元/天）" required>
            <input
              type="number"
              min={0}
              step="0.01"
              value={data.taokeCommission ?? ''}
              onChange={(e) =>
                update({ taokeCommission: e.target.value ? Number(e.target.value) : null })
              }
              placeholder="平台与您的结算单价"
              className="form-input"
            />
          </FormField>
          <div className="md:col-span-2">
            <FormField label="报价备注">
              <input
                type="text"
                value={data.quoteRemark || ''}
                onChange={(e) => update({ quoteRemark: e.target.value })}
                placeholder="如：含差旅费、上海地区可面议"
                className="form-input"
              />
            </FormField>
          </div>
        </div>
      </fieldset>

      {/* 协议 */}
      <fieldset>
        <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-3">
          <input
            id="trainer-agreement"
            type="checkbox"
            checked={!!data.agreementSigned}
            onChange={(e) =>
              update({
                agreementSigned: e.target.checked,
                agreementVersion: data.agreementVersion || 'v1',
              })
            }
            className="mt-0.5 size-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
          />
          <label htmlFor="trainer-agreement" className="text-sm text-gray-700 cursor-pointer">
            我已阅读并同意
            <Link
              href="/legal/trainer-agreement"
              target="_blank"
              className="text-primary hover:underline mx-1"
            >
              《淘课网注册专家合作协议》
            </Link>
            <span className="text-red-500">*</span>
          </label>
        </div>
      </fieldset>
    </div>
  );
}

/**
 * 培训讲师表单验证规则
 */
export const TRAINER_RULES: FormValidationRules<TrainerFormData> = {
  name: { required: true, requiredMessage: '请输入真实姓名' },
  teachingName: { required: true, requiredMessage: '请输入授课姓名' },
  avatar: { required: true, requiredMessage: '请上传专家头像' },
  gender: { required: true, requiredMessage: '请选择性别' },
  phone: {
    required: true,
    requiredMessage: '请输入联系电话',
    validator: Validators.phone,
  },
  email: { required: true, requiredMessage: '请输入常用邮箱' },
  idCardNo: {
    required: true,
    requiredMessage: '请输入身份证号',
    validator: (value) =>
      typeof value === 'string' && ID_CARD_REGEX.test(value)
        ? undefined
        : '身份证号格式不正确，请输入 18 位身份证',
  },
  provinceId: { required: true, requiredMessage: '请选择省份' },
  cityId: { required: true, requiredMessage: '请选择城市' },
  oneLineIntro: { required: true, requiredMessage: '请填写一句话介绍' },
  bio: { required: true, requiredMessage: '请输入个人简介' },
  industryCategoryIds: { required: true, requiredMessage: '请至少选择一个擅长行业' },
  expertiseCategoryIds: { required: true, requiredMessage: '请至少选择一个擅长领域' },
  taokePrice: { required: true, requiredMessage: '请填写淘课网售价' },
  taokeCommission: { required: true, requiredMessage: '请填写淘课网合作课酬' },
  agreementSigned: {
    required: true,
    requiredMessage: '请先勾选并同意《淘课网注册专家合作协议》',
    validator: (value) => (value === true ? undefined : '请先勾选并同意《淘课网注册专家合作协议》'),
  },
};
