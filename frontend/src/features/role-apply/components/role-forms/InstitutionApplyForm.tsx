'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import RegionCascader from '@/components/region-cascader';
import type { InstitutionFormData } from '../../api/types';
import { FormField } from './FormField';
import type { FormValidationRules } from '@/lib/validation';
import { Validators } from '@/lib/validation';
import AgreementCheckbox from '../AgreementCheckbox';
import SingleImageUploader from '../SingleImageUploader';
import { CategoryMultiSelect } from '../CategoryMultiSelect';
import { useProfilePrefill } from '../../hooks/useProfilePrefill';
import { getMyInstitutionProfileAsForm } from '../../api/service';

const ORG_TYPE_OPTIONS = [
  { value: 1, label: '综合培训机构' },
  { value: 2, label: '专业培训机构' },
  { value: 3, label: '企业大学' },
  { value: 4, label: '教育科技公司' },
  { value: 5, label: '其他' },
];

const YES_NO_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 1, label: '是' },
  { value: 0, label: '否' },
];

interface InstitutionApplyFormProps {
  data: Partial<InstitutionFormData>;
  onChange: (data: Partial<InstitutionFormData>) => void;
}

/**
 * 培训机构申请表单 — 重构后包含机构信息（含分类多选 / Logo / 法人 / 成立时间 /
 * 是否有场地、专家）+ 联系信息（4 级地区 + 详细地址）+ 合作协议。
 *
 * @author Fangxinxin
 * @date 2026-04-22 17:30
 */
export function InstitutionApplyForm({ data, onChange }: InstitutionApplyFormProps) {
  const { user } = useAuth();
  const update = (patch: Partial<InstitutionFormData>) => onChange({ ...data, ...patch });

  // 已生效（status=1）的机构用户进入「修改资料」流程时自动回填档案
  useProfilePrefill<InstitutionFormData>({
    role: 'INSTITUTION',
    data,
    onChange,
    fetcher: getMyInstitutionProfileAsForm,
    isEmpty: (d) => !d.orgName && !d.licenseNo,
  });

  useEffect(() => {
    if (!data.contactPhone && user?.phone) {
      onChange({ ...data, contactPhone: user.phone });
    }
  }, [user?.phone]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-slate-100">
          机构信息
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <FormField label="机构名称" required>
            <input
              type="text"
              value={data.orgName || ''}
              onChange={(e) => update({ orgName: e.target.value })}
              placeholder="请输入机构全称"
              className="form-input"
              maxLength={128}
            />
          </FormField>
          <FormField label="机构类型" required>
            <select
              value={data.orgType ?? ''}
              onChange={(e) =>
                update({ orgType: e.target.value ? Number(e.target.value) : (undefined as unknown as number) })
              }
              className="form-input"
            >
              <option value="">请选择</option>
              {ORG_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="法人代表">
            <input
              type="text"
              value={data.legalRepresentative || ''}
              onChange={(e) => update({ legalRepresentative: e.target.value })}
              placeholder="请输入法人姓名"
              className="form-input"
              maxLength={64}
            />
          </FormField>
          <FormField label="营业执照号" required>
            <input
              type="text"
              value={data.licenseNo || ''}
              onChange={(e) => update({ licenseNo: e.target.value })}
              placeholder="统一社会信用代码"
              className="form-input"
              maxLength={64}
            />
          </FormField>
          <FormField label="成立时间">
            <input
              type="date"
              value={data.establishedAt || ''}
              onChange={(e) => update({ establishedAt: e.target.value })}
              className="form-input"
            />
          </FormField>

          <div className="md:col-span-2">
            <FormField label="公司 Logo" required>
              <SingleImageUploader
                label="机构 Logo"
                value={data.logoUrl || ''}
                onChange={(url) => update({ logoUrl: url })}
              />
              <p className="mt-1.5 text-xs text-gray-500">
                建议上传 1:1 正方形图片，支持 JPG / PNG / JPEG 格式。
              </p>
            </FormField>
          </div>

          <div className="md:col-span-2">
            <FormField label="机构简介" required>
              <textarea
                value={data.bio || ''}
                onChange={(e) => update({ bio: e.target.value })}
                placeholder="请介绍机构的主要业务方向、核心优势、师资规模等"
                rows={4}
                className="form-input resize-none"
              />
            </FormField>
          </div>

          <div className="md:col-span-2">
            <FormField label="擅长行业" required>
              <CategoryMultiSelect
                type="TRAINER_INDUSTRY"
                value={data.industryCategoryIds || []}
                onChange={(ids) => update({ industryCategoryIds: ids })}
              />
            </FormField>
          </div>

          <div className="md:col-span-2">
            <FormField label="擅长领域" required>
              <CategoryMultiSelect
                type="TRAINER_EXPERTISE"
                value={data.expertiseCategoryIds || []}
                onChange={(ids) => update({ expertiseCategoryIds: ids })}
              />
            </FormField>
          </div>

          <div className="md:col-span-2">
            <FormField label="我的客户">
              <textarea
                value={data.clientCases || ''}
                onChange={(e) => update({ clientCases: e.target.value })}
                placeholder="请简要列举服务过的代表性客户（每行一个或以顿号分隔）"
                rows={3}
                className="form-input resize-none"
              />
            </FormField>
          </div>

          <FormField label="是否有场地">
            <div className="flex gap-4 pt-2">
              {YES_NO_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="hasVenue"
                    checked={data.hasVenue === opt.value}
                    onChange={() => update({ hasVenue: opt.value })}
                    className="size-4 text-primary focus:ring-primary/20"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </FormField>
          <FormField label="是否有专家">
            <div className="flex gap-4 pt-2">
              {YES_NO_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="hasExperts"
                    checked={data.hasExperts === opt.value}
                    onChange={() => update({ hasExperts: opt.value })}
                    className="size-4 text-primary focus:ring-primary/20"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </FormField>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-slate-100">
          联系信息
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <FormField label="联系人姓名" required>
            <input
              type="text"
              value={data.contactName || ''}
              onChange={(e) => update({ contactName: e.target.value })}
              placeholder="请输入联系人姓名"
              className="form-input"
              maxLength={64}
            />
          </FormField>
          <FormField label="联系电话" required>
            <input
              type="tel"
              value={data.contactPhone || ''}
              onChange={(e) => update({ contactPhone: e.target.value })}
              placeholder="11位手机号"
              maxLength={11}
              className="form-input"
            />
          </FormField>
          <FormField label="是否公开联系方式">
            <div className="flex gap-4 pt-2">
              {[
                { value: 1, label: '公开' },
                { value: 0, label: '不公开' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="showContact"
                    checked={data.showContact === opt.value}
                    onChange={() => update({ showContact: opt.value })}
                    className="size-4 text-primary focus:ring-primary/20"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </FormField>

          <div className="md:col-span-2">
            <FormField label="机构地址">
              <RegionCascader
                maxLevel={4}
                onChange={(region) =>
                  update({
                    provinceId: region.provinceId ?? null,
                    cityId: region.cityId ?? null,
                    districtId: region.districtId ?? null,
                    townId: region.townId ?? null,
                  })
                }
              />
              <input
                type="text"
                value={data.address || ''}
                onChange={(e) => update({ address: e.target.value })}
                placeholder="街道门牌号等详细地址"
                className="form-input mt-2"
                maxLength={200}
              />
            </FormField>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <AgreementCheckbox
          id="institution-agreement"
          title="淘课网注册培训机构合作协议"
          href="/legal/institution-agreement"
          checked={!!data.agreementSigned}
          version={data.agreementVersion || 'v1'}
          onChange={(checked, version) =>
            update({ agreementSigned: checked, agreementVersion: version })
          }
        />
      </fieldset>
    </div>
  );
}

/**
 * 培训机构表单验证规则
 */
export const INSTITUTION_RULES: FormValidationRules<InstitutionFormData> = {
  orgName: { required: true, requiredMessage: '请输入机构名称' },
  orgType: { required: true, requiredMessage: '请选择机构类型' },
  licenseNo: { required: true, requiredMessage: '请输入营业执照号' },
  logoUrl: { required: true, requiredMessage: '请上传机构 Logo' },
  bio: { required: true, requiredMessage: '请输入机构简介' },
  industryCategoryIds: { required: true, requiredMessage: '请至少选择一个擅长行业' },
  expertiseCategoryIds: { required: true, requiredMessage: '请至少选择一个擅长领域' },
  contactName: { required: true, requiredMessage: '请输入联系人姓名' },
  contactPhone: {
    required: true,
    requiredMessage: '请输入联系电话',
    validator: Validators.phone,
  },
  agreementSigned: {
    required: true,
    requiredMessage: '请先勾选并同意《淘课网注册培训机构合作协议》',
    validator: (value) =>
      value === true ? undefined : '请先勾选并同意《淘课网注册培训机构合作协议》',
  },
};
