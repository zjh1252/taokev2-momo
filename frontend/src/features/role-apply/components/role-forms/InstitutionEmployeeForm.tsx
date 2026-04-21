'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import type { InstitutionEmployeeFormData } from '../../api/types';
import { FormField } from './FormField';
import type { FormValidationRules } from '@/lib/validation';
import { Validators } from '@/lib/validation';
import {
  lookupInstitutions,
  type InstitutionLookupItem,
} from '@/features/institution-employee/api/service';
import { Search, Building2, Loader2, Check } from 'lucide-react';

interface InstitutionEmployeeFormProps {
  data: Partial<InstitutionEmployeeFormData>;
  onChange: (data: Partial<InstitutionEmployeeFormData>) => void;
}

/**
 * 机构员工申请表单
 *
 * <p>新流程下平台不再审核员工入驻：申请提交后会创建一条
 * INSTITUTION_EMPLOYEE 绑定（PENDING），由所选机构在用户中心
 * 「我的员工 → 待我审核」处通过 / 拒绝。
 *
 * @author Fangxinxin
 * @date 2026-04-03 16:00
 */
export function InstitutionEmployeeForm({ data, onChange }: InstitutionEmployeeFormProps) {
  const { user } = useAuth();
  const update = (patch: Partial<InstitutionEmployeeFormData>) => onChange({ ...data, ...patch });

  useEffect(() => {
    if (!data.contactPhone && user?.phone) {
      onChange({ ...data, contactPhone: user.phone });
    }
  }, [user?.phone]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-slate-100">
          目标机构
        </legend>
        <FormField label="加入机构" required>
          <InstitutionPicker
            value={data.orgId ?? null}
            onPick={(item) => update({ orgId: item?.id ?? null })}
          />
          <p className="mt-1.5 text-xs text-gray-500">
            提交后将由该机构在用户中心审核您的申请，平台不再做二次审核。
          </p>
        </FormField>
      </fieldset>

      <fieldset>
        <legend className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-slate-100">
          联系信息
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
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
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-slate-100">
          岗位信息
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <FormField label="部门">
            <input
              type="text"
              value={data.department || ''}
              onChange={(e) => update({ department: e.target.value })}
              placeholder="如：教学部、运营部"
              className="form-input"
            />
          </FormField>
          <FormField label="职位">
            <input
              type="text"
              value={data.position || ''}
              onChange={(e) => update({ position: e.target.value })}
              placeholder="如：课程运营、教务主管"
              className="form-input"
            />
          </FormField>
        </div>
      </fieldset>
    </div>
  );
}

/**
 * 机构搜索 / 选择器 — 输入关键字后调用公开接口模糊匹配机构名。
 */
function InstitutionPicker({
  value,
  onPick,
}: {
  value: number | null;
  onPick: (item: InstitutionLookupItem | null) => void;
}) {
  const [keyword, setKeyword] = useState('');
  const [list, setList] = useState<InstitutionLookupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<InstitutionLookupItem | null>(null);
  const [open, setOpen] = useState(false);

  const search = useCallback(async (kw: string) => {
    setLoading(true);
    try {
      const data = await lookupInstitutions(kw, 20);
      setList(data);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初次加载默认拉一批，便于快速选择
  useEffect(() => {
    search('');
  }, [search]);

  const handlePick = (it: InstitutionLookupItem) => {
    setPicked(it);
    onPick(it);
    setOpen(false);
  };

  return (
    <div>
      {picked && picked.id === value ? (
        <div className="flex items-center justify-between border border-primary/30 bg-primary/5 rounded-lg px-3 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="size-5 text-primary shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">
                {picked.orgName || `机构#${picked.id}`}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {picked.association ? '培训协会 · ' : ''}
                {picked.address || ''}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setPicked(null);
              onPick(null);
              setOpen(true);
            }}
            className="text-xs text-primary hover:underline shrink-0"
          >
            重新选择
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), search(keyword), setOpen(true))
                }
                onFocus={() => setOpen(true)}
                placeholder="按机构名搜索"
                className="form-input pl-9"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                search(keyword);
                setOpen(true);
              }}
              disabled={loading}
              className="inline-flex items-center gap-1 bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              搜索
            </button>
          </div>

          {open && (
            <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
              {loading ? (
                <div className="flex items-center justify-center py-6 text-gray-400 text-sm">
                  <Loader2 className="size-4 animate-spin mr-2" /> 加载中…
                </div>
              ) : list.length === 0 ? (
                <div className="text-center text-sm text-gray-400 py-6">未找到匹配的机构</div>
              ) : (
                list.map((it) => (
                  <button
                    type="button"
                    key={it.id}
                    onClick={() => handlePick(it)}
                    className="w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <Building2 className="size-4 text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {it.orgName || `机构#${it.id}`}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {it.association ? '培训协会 · ' : ''}
                        {it.address || ''}
                      </div>
                    </div>
                    {value === it.id && <Check className="size-4 text-primary shrink-0" />}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 机构员工表单验证规则
 */
export const INSTITUTION_EMPLOYEE_RULES: FormValidationRules<InstitutionEmployeeFormData> = {
  contactPhone: {
    required: true,
    requiredMessage: '请输入联系电话',
    validator: Validators.phone,
  },
  orgId: { required: true, requiredMessage: '请选择要加入的机构' },
};
