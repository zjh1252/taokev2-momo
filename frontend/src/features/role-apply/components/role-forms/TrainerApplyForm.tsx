'use client';

import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import RegionCascader from '@/components/region-cascader';
import type { RegionValue } from '@/components/region-cascader';
import type { TrainerFormData } from '../../api/types';

const GENDER_OPTIONS = [
  { value: 1, label: '男' },
  { value: 2, label: '女' },
];

const QUOTE_UNIT_OPTIONS = ['元/天', '元/半天', '元/小时', '面议'];

interface TrainerApplyFormProps {
  data: Partial<TrainerFormData>;
  onChange: (data: Partial<TrainerFormData>) => void;
}

/**
 * 专家（培训讲师）申请表单
 *
 * @author Fangxinxin
 * @date 2026-04-03 16:00
 */
export function TrainerApplyForm({ data, onChange }: TrainerApplyFormProps) {
  const update = (patch: Partial<TrainerFormData>) => onChange({ ...data, ...patch });

  return (
    <div className="space-y-8">
      {/* 基本信息 */}
      <fieldset>
        <legend className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-slate-100">
          基本信息
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <FormField label="姓名" required>
            <input
              type="text"
              value={data.name || ''}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="请输入真实姓名"
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
          <FormField label="邮箱">
            <input
              type="email"
              value={data.email || ''}
              onChange={(e) => update({ email: e.target.value })}
              placeholder="name@example.com"
              className="form-input"
            />
          </FormField>
        </div>
      </fieldset>

      {/* 常驻城市 */}
      <fieldset>
        <legend className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-slate-100">
          常驻城市
        </legend>
        <div className="grid grid-cols-1 gap-y-4">
          <FormField label="请选择常驻城市" required>
            <RegionCascader
              maxLevel={2}
              value={{
                provinceId: data.provinceId ?? undefined,
                cityId: data.cityId ?? undefined,
              }}
              onChange={(val: RegionValue) =>
                update({
                  provinceId: val.provinceId ?? null,
                  cityId: val.cityId ?? null,
                })
              }
            />
          </FormField>
        </div>
      </fieldset>

      {/* 专业信息 */}
      <fieldset>
        <legend className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-slate-100">
          专业信息
        </legend>
        <div className="grid grid-cols-1 gap-y-4">
          <FormField label="个人简介" required>
            <textarea
              value={data.bio || ''}
              onChange={(e) => update({ bio: e.target.value })}
              placeholder="请简要介绍您的专业背景、从业经历"
              rows={4}
              className="form-input resize-none"
            />
            <button
              type="button"
              onClick={() => toast.info('AI 解析功能即将上线')}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary border border-primary/40 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Upload className="size-4" />
              上传文档（AI解析）
            </button>
          </FormField>
          <FormField label="擅长领域" required>
            <input
              type="text"
              value={data.goodAt || ''}
              onChange={(e) => update({ goodAt: e.target.value })}
              placeholder="多个领域用逗号分隔，如：领导力,团队管理"
              className="form-input"
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

      {/* 报价信息 */}
      <fieldset>
        <legend className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-slate-100">
          报价信息
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
          <FormField label="最低报价">
            <input
              type="number"
              min={0}
              value={data.quoteMin ?? ''}
              onChange={(e) =>
                update({ quoteMin: e.target.value ? Number(e.target.value) : null })
              }
              placeholder="￥"
              className="form-input"
            />
          </FormField>
          <FormField label="最高报价">
            <input
              type="number"
              min={0}
              value={data.quoteMax ?? ''}
              onChange={(e) =>
                update({ quoteMax: e.target.value ? Number(e.target.value) : null })
              }
              placeholder="￥"
              className="form-input"
            />
          </FormField>
          <FormField label="报价单位">
            <select
              value={data.quoteUnit || ''}
              onChange={(e) => update({ quoteUnit: e.target.value })}
              className="form-input"
            >
              <option value="">请选择</option>
              {QUOTE_UNIT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </FormField>
          <div className="md:col-span-3">
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
