'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import type { EnterpriseAgentFormData } from '../../api/types';

const COMPANY_SIZE_OPTIONS = ['1-50人', '51-200人', '201-500人', '501-1000人', '1000人以上'];

interface EnterpriseAgentFormProps {
  data: Partial<EnterpriseAgentFormData>;
  onChange: (data: Partial<EnterpriseAgentFormData>) => void;
}

/**
 * 专家经纪公司申请表单
 *
 * @author Fangxinxin
 * @date 2026-04-03 16:00
 */
export function EnterpriseAgentForm({ data, onChange }: EnterpriseAgentFormProps) {
  const { user } = useAuth();
  const update = (patch: Partial<EnterpriseAgentFormData>) => onChange({ ...data, ...patch });

  useEffect(() => {
    if (!data.contactPhone && user?.phone) {
      onChange({ ...data, contactPhone: user.phone });
    }
  }, [user?.phone]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-8">
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
            />
          </FormField>
          <FormField label="营业执照号" required>
            <input
              type="text"
              value={data.licenseNo || ''}
              onChange={(e) => update({ licenseNo: e.target.value })}
              placeholder="统一社会信用代码"
              className="form-input"
            />
          </FormField>
          <FormField label="法定代表人">
            <input
              type="text"
              value={data.legalPerson || ''}
              onChange={(e) => update({ legalPerson: e.target.value })}
              placeholder="请输入法人姓名"
              className="form-input"
            />
          </FormField>
          <FormField label="所属行业">
            <input
              type="text"
              value={data.industry || ''}
              onChange={(e) => update({ industry: e.target.value })}
              placeholder="如：教育培训、人力资源"
              className="form-input"
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
          {/* TODO: 接入省市区三级联动组件 */}
          <div className="md:col-span-2">
            <FormField label="公司地址">
              <input
                type="text"
                value={data.address || ''}
                onChange={(e) => update({ address: e.target.value })}
                placeholder="请输入公司详细地址"
                className="form-input"
              />
            </FormField>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-slate-100">
          资质文件
        </legend>
        <FormField label="资质证明文件">
          {/* TODO: 接入文件上传组件 */}
          <input
            type="text"
            value={data.qualificationDocUrl || ''}
            onChange={(e) => update({ qualificationDocUrl: e.target.value })}
            placeholder="资质文件 URL（暂用文本输入，后续接入上传组件）"
            className="form-input"
          />
        </FormField>
      </fieldset>
    </div>
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
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
