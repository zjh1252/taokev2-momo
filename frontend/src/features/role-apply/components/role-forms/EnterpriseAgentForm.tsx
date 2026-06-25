'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import RegionCascader from '@/components/region-cascader';
import type { EnterpriseAgentFormData } from '../../api/types';
import { FormField } from './FormField';
import type { FormValidationRules } from '@/lib/validation';
import { Validators } from '@/lib/validation';
import AgreementCheckbox from '../AgreementCheckbox';
import SingleImageUploader from '../SingleImageUploader';
import { useProfilePrefill } from '../../hooks/useProfilePrefill';
import { getMyEnterpriseAgentProfileAsForm } from '../../api/service';

const COMPANY_SIZE_OPTIONS = ['1-50人', '51-200人', '201-500人', '501-1000人', '1000人以上'];

interface EnterpriseAgentFormProps {
  data: Partial<EnterpriseAgentFormData>;
  onChange: (data: Partial<EnterpriseAgentFormData>) => void;
}

/**
 * 专家经纪公司申请表单 — 公司信息 + 联系信息（含 4 级地区）+
 * 营业执照图片上传 + 合作协议。
 *
 * @author Fangxinxin
 * @date 2026-04-22 15:00
 */
export function EnterpriseAgentForm({ data, onChange }: EnterpriseAgentFormProps) {
  const { user } = useAuth();
  const update = (patch: Partial<EnterpriseAgentFormData>) => onChange({ ...data, ...patch });

  // 已生效（status=1）的经纪公司用户进入「修改资料」流程时自动回填档案
  useProfilePrefill<EnterpriseAgentFormData>({
    role: 'ENTERPRISE_AGENT',
    data,
    onChange,
    fetcher: getMyEnterpriseAgentProfileAsForm,
    isEmpty: (d) => !d.companyName && !d.licenseNo,
  });

  useEffect(() => {
    if (!data.contactPhone && user?.phone) {
      onChange({ ...data, contactPhone: user.phone });
    }
  }, [user?.phone]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-slate-100">
          公司信息
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <FormField label="公司名称" required>
            <input
              type="text"
              value={data.companyName || ''}
              onChange={(e) => update({ companyName: e.target.value })}
              placeholder="请输入公司全称"
              className="form-input"
              maxLength={128}
            />
          </FormField>
          <FormField label="营业执照号" required>
            <input
              type="text"
              inputMode="numeric"
              value={data.licenseNo || ''}
              onChange={(e) => update({ licenseNo: e.target.value.replace(/[^\dA-Za-z]/g, '').toUpperCase() })}
              placeholder="15位或18位数字"
              className="form-input"
              maxLength={18}
            />
          </FormField>
          <FormField label="法定代表人">
            <input
              type="text"
              value={data.legalPerson || ''}
              onChange={(e) => update({ legalPerson: e.target.value })}
              placeholder="请输入法人姓名"
              className="form-input"
              maxLength={64}
            />
          </FormField>
          <FormField label="所属行业">
            <input
              type="text"
              value={data.industry || ''}
              onChange={(e) => update({ industry: e.target.value })}
              placeholder="如：教育培训、人力资源"
              className="form-input"
              maxLength={64}
            />
          </FormField>
          <FormField label="公司规模">
            <select
              value={data.companySize || ''}
              onChange={(e) => update({ companySize: e.target.value })}
              className="form-input"
            >
              <option value="">请选择</option>
              {COMPANY_SIZE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </FormField>
          <div className="md:col-span-2">
            <FormField label="公司简介">
              <textarea
                value={data.bio || ''}
                onChange={(e) => update({ bio: e.target.value })}
                placeholder="请简要介绍公司业务、团队规模、合作专家及客户案例等"
                rows={4}
                className="form-input resize-none"
              />
            </FormField>
          </div>
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

          <div className="md:col-span-2">
            <FormField label="公司地址" required>
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
        <legend className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-slate-100">
          资质文件
        </legend>
        <FormField label="营业执照" required>
          <SingleImageUploader
            label="营业执照"
            value={data.qualificationDocUrl || ''}
            onChange={(url) => update({ qualificationDocUrl: url })}
          />
          <p className="mt-1.5 text-xs text-gray-500">
            请上传清晰的营业执照照片，支持 JPG / PNG / JPEG 格式。
          </p>
        </FormField>
      </fieldset>

      <fieldset>
        <AgreementCheckbox
          id="enterprise-agent-agreement"
          title="淘课网注册专家经纪公司合作协议"
          href="/legal/enterprise-agent-agreement"
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
 * 专家经纪公司表单验证规则
 */
export const ENTERPRISE_AGENT_RULES: FormValidationRules<EnterpriseAgentFormData> = {
  companyName: { required: true, requiredMessage: '请输入公司名称' },
  licenseNo: {
    required: true,
    requiredMessage: '请输入营业执照号',
    validator: Validators.businessLicenseNo,
  },
  contactName: { required: true, requiredMessage: '请输入联系人姓名' },
  contactPhone: {
    required: true,
    requiredMessage: '请输入联系电话',
    validator: Validators.phone,
  },
  qualificationDocUrl: {
    required: true,
    requiredMessage: '请上传营业执照',
  },
  agreementSigned: {
    required: true,
    requiredMessage: '请先勾选并同意《淘课网注册专家经纪公司合作协议》',
    validator: (value) =>
      value === true ? undefined : '请先勾选并同意《淘课网注册专家经纪公司合作协议》',
  },
};
