'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { apiGet } from '@/lib/http/client';
import RegionCascader from '@/components/region-cascader';
import type { RegionValue } from '@/components/region-cascader';
import type { EnterpriseBuyerFormData } from '../../api/types';

const COMPANY_SIZE_OPTIONS = ['1-50人', '51-200人', '201-500人', '501-1000人', '1000人以上'];

interface CategoryNode {
  id: number;
  name: string;
  children?: CategoryNode[];
}

interface EnterpriseBuyerFormProps {
  data: Partial<EnterpriseBuyerFormData>;
  onChange: (data: Partial<EnterpriseBuyerFormData>) => void;
}

/**
 * 企业培训采购方申请表单
 *
 * @author Fangxinxin
 * @date 2026-04-03 16:00
 */
export function EnterpriseBuyerForm({ data, onChange }: EnterpriseBuyerFormProps) {
  const { user } = useAuth();
  const update = (patch: Partial<EnterpriseBuyerFormData>) => onChange({ ...data, ...patch });
  const [industryCategories, setIndustryCategories] = useState<CategoryNode[]>([]);

  // 自动填入注册手机号
  useEffect(() => {
    if (!data.contactPhone && user?.phone) {
      onChange({ ...data, contactPhone: user.phone });
    }
  }, [user?.phone]); // eslint-disable-line react-hooks/exhaustive-deps

  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);

  // 加载行业分类（二级树）
  useEffect(() => {
    apiGet<{ data: CategoryNode[] }>('/categories/tree?type=TRAINER_INDUSTRY')
      .then((res) => {
        const cats = res.data || [];
        setIndustryCategories(cats);
        // 如果已有值，回溯选中的父级
        if (data.industry && cats.length > 0) {
          for (const parent of cats) {
            if (parent.name === data.industry) {
              setSelectedParentId(parent.id);
              break;
            }
            if (parent.children?.some((c) => c.name === data.industry)) {
              setSelectedParentId(parent.id);
              break;
            }
          }
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const childCategories = industryCategories.find((c) => c.id === selectedParentId)?.children || [];

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-slate-100">
          企业信息
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <FormField label="企业名称" required>
            <input
              type="text"
              value={data.companyName || ''}
              onChange={(e) => update({ companyName: e.target.value })}
              placeholder="请输入企业全称"
              className="form-input"
            />
          </FormField>
          <FormField label="所属行业" required>
            <div className="flex gap-3">
              <select
                value={selectedParentId ?? ''}
                onChange={(e) => {
                  const pid = e.target.value ? Number(e.target.value) : null;
                  setSelectedParentId(pid);
                  const parent = industryCategories.find((c) => c.id === pid);
                  if (parent && (!parent.children || parent.children.length === 0)) {
                    update({ industry: parent.name });
                  } else {
                    update({ industry: '' });
                  }
                }}
                className="form-input flex-1"
              >
                <option value="">请选择行业大类</option>
                {industryCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {childCategories.length > 0 && (
                <select
                  value={data.industry || ''}
                  onChange={(e) => update({ industry: e.target.value })}
                  className="form-input flex-1"
                >
                  <option value="">请选择子行业</option>
                  {childCategories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              )}
            </div>
          </FormField>
          <FormField label="企业规模">
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
          联系人信息
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
          <div className="md:col-span-2">
            <FormField label="所在地区">
              <RegionCascader
                maxLevel={4}
                value={{
                  provinceId: data.provinceId ?? undefined,
                  cityId: data.cityId ?? undefined,
                  districtId: data.districtId ?? undefined,
                  townId: data.townId ?? undefined,
                }}
                onChange={(val: RegionValue) =>
                  update({
                    provinceId: val.provinceId ?? null,
                    cityId: val.cityId ?? null,
                    districtId: val.districtId ?? null,
                    townId: val.townId ?? null,
                  })
                }
              />
            </FormField>
          </div>
          <div className="md:col-span-2">
            <FormField label="详细地址">
              <input
                type="text"
                value={data.address || ''}
                onChange={(e) => update({ address: e.target.value })}
                placeholder="请输入详细地址（街道门牌号等）"
                className="form-input"
              />
            </FormField>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-slate-100">
          培训需求
        </legend>
        <FormField label="培训标签/方向">
          <input
            type="text"
            value={data.trainingTags || ''}
            onChange={(e) => update({ trainingTags: e.target.value })}
            placeholder="多个标签用逗号分隔，如：领导力,团队建设,沟通技巧"
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
