'use client';

import type { InstitutionFormData } from '../../api/types';

const ORG_TYPE_OPTIONS = [
  { value: 1, label: '综合培训机构' },
  { value: 2, label: '专业培训机构' },
  { value: 3, label: '企业大学' },
  { value: 4, label: '教育科技公司' },
  { value: 5, label: '其他' },
];

interface InstitutionApplyFormProps {
  data: Partial<InstitutionFormData>;
  onChange: (data: Partial<InstitutionFormData>) => void;
}

/**
 * 培训机构申请表单
 *
 * @author Fangxinxin
 * @date 2026-04-03 16:00
 */
export function InstitutionApplyForm({ data, onChange }: InstitutionApplyFormProps) {
  const update = (patch: Partial<InstitutionFormData>) => onChange({ ...data, ...patch });

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
            />
          </FormField>
          <FormField label="机构类型" required>
            <select
              value={data.orgType ?? ''}
              onChange={(e) => update({ orgType: e.target.value ? Number(e.target.value) : undefined as any })}
              className="form-input"
            >
              <option value="">请选择</option>
              {ORG_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="营业执照号">
            <input
              type="text"
              value={data.licenseNo || ''}
              onChange={(e) => update({ licenseNo: e.target.value })}
              placeholder="统一社会信用代码"
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
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-slate-100">
          机构简介
        </legend>
        <FormField label="机构介绍" required>
          <textarea
            value={data.bio || ''}
            onChange={(e) => update({ bio: e.target.value })}
            placeholder="请介绍机构的主要业务方向、核心优势、师资规模等"
            rows={4}
            className="form-input resize-none"
          />
        </FormField>
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
            <FormField label="机构地址">
              <input
                type="text"
                value={data.address || ''}
                onChange={(e) => update({ address: e.target.value })}
                placeholder="请输入机构详细地址"
                className="form-input"
              />
            </FormField>
          </div>
        </div>
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
