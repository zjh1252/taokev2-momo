'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import type { AgentFormData } from '../../api/types';
import { FormField } from './FormField';
import type { FormValidationRules } from '@/lib/validation';
import { Validators } from '@/lib/validation';
import {
  lookupEnterpriseAgents,
  type EnterpriseAgentLookupItem,
} from '@/features/agent/api/service';
import { Search, Building2, Loader2, Check } from 'lucide-react';

interface AgentApplyFormProps {
  data: Partial<AgentFormData>;
  onChange: (data: Partial<AgentFormData>) => void;
}

/**
 * 专家经纪人申请表单
 *
 * <p>新流程下，平台不再直接审核经纪人申请。提交时必须选择目标
 * 经纪公司，由该公司在用户中心确认。
 *
 * @author Fangxinxin
 * @date 2026-04-03 16:00
 */
export function AgentApplyForm({ data, onChange }: AgentApplyFormProps) {
  const { user } = useAuth();
  const update = (patch: Partial<AgentFormData>) => onChange({ ...data, ...patch });

  useEffect(() => {
    if (!data.contactPhone && user?.phone) {
      onChange({ ...data, contactPhone: user.phone });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.phone]);

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-slate-100">
          目标经纪公司
        </legend>
        <FormField label="加入经纪公司" required>
          <EnterpriseAgentPicker
            value={data.enterpriseAgentId ?? null}
            onPick={(item) => update({ enterpriseAgentId: item?.id ?? null })}
          />
          <p className="mt-1.5 text-xs text-gray-500">
            提交后将由该经纪公司在用户中心审核您的申请，平台不再做二次审核。
          </p>
        </FormField>
      </fieldset>

      <fieldset>
        <legend className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-slate-100">
          经纪人信息
        </legend>
        <div className="grid grid-cols-1 gap-y-4">
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
          <FormField label="个人简介" required>
            <textarea
              value={data.bio || ''}
              onChange={(e) => update({ bio: e.target.value })}
              placeholder="请介绍您的经纪人从业经历、擅长领域、合作案例等"
              rows={4}
              className="form-input resize-none"
            />
          </FormField>
          <FormField label="擅长方向" required>
            <input
              type="text"
              value={data.specialties || ''}
              onChange={(e) => update({ specialties: e.target.value })}
              placeholder="多个方向用逗号分隔，如：企业管理,领导力,IT培训"
              className="form-input"
            />
          </FormField>
          <FormField label="服务城市">
            <input
              type="text"
              value={data.serviceCityIds || ''}
              onChange={(e) => update({ serviceCityIds: e.target.value })}
              placeholder="多个城市用逗号分隔，如：上海,北京,深圳"
              className="form-input"
            />
          </FormField>
        </div>
      </fieldset>
    </div>
  );
}

/**
 * 经纪公司搜索 / 选择器 — 输入关键字后调用公开接口查找。
 */
function EnterpriseAgentPicker({
  value,
  onPick,
}: {
  value: number | null;
  onPick: (item: EnterpriseAgentLookupItem | null) => void;
}) {
  const [keyword, setKeyword] = useState('');
  const [list, setList] = useState<EnterpriseAgentLookupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<EnterpriseAgentLookupItem | null>(null);
  const [open, setOpen] = useState(false);

  const search = useCallback(async (kw: string) => {
    setLoading(true);
    try {
      const data = await lookupEnterpriseAgents(kw, 20);
      setList(data);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初次加载默认拉一批，便于快速选择
  useEffect(() => {
    search('');
  }, [search]);

  const handlePick = (it: EnterpriseAgentLookupItem) => {
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
              <div className="text-sm font-medium text-gray-800 truncate">{picked.companyName || `公司#${picked.id}`}</div>
              <div className="text-xs text-gray-500 truncate">
                {picked.legalPerson ? `法人：${picked.legalPerson}` : null}
                {picked.legalPerson && picked.contactName ? ' · ' : null}
                {picked.contactName ? `联系人：${picked.contactName}` : null}
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
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), search(keyword), setOpen(true))}
                onFocus={() => setOpen(true)}
                placeholder="按公司名搜索经纪公司"
                className="form-input pl-9"
              />
            </div>
            <button
              type="button"
              onClick={() => { search(keyword); setOpen(true); }}
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
                <div className="text-center text-sm text-gray-400 py-6">未找到匹配的经纪公司</div>
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
                        {it.companyName || `公司#${it.id}`}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {it.legalPerson ? `法人：${it.legalPerson}` : ''}
                        {it.legalPerson && it.contactName ? ' · ' : ''}
                        {it.contactName ? `联系人：${it.contactName}` : ''}
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
 * 专家经纪人表单验证规则
 */
export const AGENT_RULES: FormValidationRules<AgentFormData> = {
  enterpriseAgentId: {
    required: true,
    requiredMessage: '请选择要加入的经纪公司',
  },
  contactPhone: {
    required: true,
    requiredMessage: '请输入联系电话',
    validator: Validators.phone,
  },
  bio: { required: true, requiredMessage: '请输入个人简介' },
  specialties: { required: true, requiredMessage: '请输入擅长方向' },
};
