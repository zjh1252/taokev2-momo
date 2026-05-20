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
import { Building2, Loader2, Check } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import ServiceCitiesEditor from '../ServiceCitiesEditor';
import AgreementCheckbox from '../AgreementCheckbox';
import { useProfilePrefill } from '../../hooks/useProfilePrefill';
import { getMyAgentProfileAsForm } from '../../api/service';

interface AgentApplyFormProps {
  data: Partial<AgentFormData>;
  onChange: (data: Partial<AgentFormData>) => void;
}

/**
 * 专家经纪人申请表单 — 单段平铺：真实姓名 / 联系电话 / 常用邮箱 / 服务城市 /
 * 所属经纪公司 / 合作协议。
 *
 * <p>新流程下平台不再直接审核经纪人申请；提交时由所选经纪公司在用户中心确认。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-22 15:00
 */
export function AgentApplyForm({ data, onChange }: AgentApplyFormProps) {
  const { user } = useAuth();
  const update = (patch: Partial<AgentFormData>) => onChange({ ...data, ...patch });

  // 已生效（status=1）的经纪人用户进入「修改资料」流程时自动回填档案
  useProfilePrefill<AgentFormData>({
    role: 'AGENT',
    data,
    onChange,
    fetcher: getMyAgentProfileAsForm,
    isEmpty: (d) => !d.realName && !d.email,
  });

  // 自动以用户注册手机号兜底「联系电话」
  useEffect(() => {
    if (!data.contactPhone && user?.phone) {
      onChange({ ...data, contactPhone: user.phone });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.phone]);

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-slate-100">
          经纪人信息
        </legend>
        <div className="grid grid-cols-1 gap-y-4">
          <FormField label="真实姓名" required>
            <input
              type="text"
              value={data.realName || ''}
              onChange={(e) => update({ realName: e.target.value })}
              placeholder="请输入您的真实姓名"
              maxLength={64}
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

          <FormField label="常用邮箱" required>
            <input
              type="email"
              value={data.email || ''}
              onChange={(e) => update({ email: e.target.value })}
              placeholder="example@domain.com"
              maxLength={128}
              className="form-input"
            />
          </FormField>

          <FormField label="服务城市">
            <ServiceCitiesEditor
              value={data.serviceCities || []}
              onChange={(value) => update({ serviceCities: value })}
            />
          </FormField>

          <FormField label="所属经纪公司" required>
            <EnterpriseAgentPicker
              value={data.enterpriseAgentId ?? null}
              onPick={(item) => update({ enterpriseAgentId: item?.id ?? null })}
            />
            <p className="mt-1.5 text-xs text-gray-500">
              提交后将由该经纪公司在用户中心审核您的申请，平台不再做二次审核。
            </p>
          </FormField>
        </div>
      </fieldset>

      <fieldset>
        <AgreementCheckbox
          id="agent-agreement"
          title="淘课网注册专家经纪人合作协议"
          href="/legal/agent-agreement"
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
 * 经纪公司搜索 / 选择器 — 输入「公司编号」或「公司名称」皆可：
 * 后端 lookup 接口会自动按数字 ID 精确查找，否则按名称模糊匹配。
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
  /** 是否至少触发过一次搜索，用于决定是否展示「未匹配 → 去申请」CTA */
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (kw: string) => {
    setLoading(true);
    setSearched(true);
    try {
      const data = await lookupEnterpriseAgents(kw, 20);
      setList(data);
    } finally {
      setLoading(false);
    }
  }, []);

  // 取消默认 useEffect 自动搜索 — 只在用户点搜索按钮或回车时才发起请求

  const handlePick = (it: EnterpriseAgentLookupItem) => {
    setPicked(it);
    onPick(it);
    setOpen(false);
  };

  // 已搜索过 + 列表为空 → 显示「申请专家经纪公司」CTA
  const showEmptyCta = open && !loading && searched && list.length === 0;

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
              setOpen(false);
              setSearched(false);
              setList([]);
            }}
            className="text-xs text-primary hover:underline shrink-0"
          >
            重新选择
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  search(keyword);
                  setOpen(true);
                }
              }}
              placeholder="输入公司名称，点击搜索"
              className="form-input flex-1"
            />
            <button
              type="button"
              onClick={() => { search(keyword); setOpen(true); }}
              disabled={loading}
              className="inline-flex items-center gap-1 bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              搜索
            </button>
          </div>

          {open && (
            <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
              {loading ? (
                <div className="flex items-center justify-center py-6 text-gray-400 text-sm">
                  <Loader2 className="size-4 animate-spin mr-2" /> 加载中…
                </div>
              ) : showEmptyCta ? (
                <div className="px-4 py-5 flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-sm text-gray-500">未找到匹配的经纪公司</div>
                  <Link
                    href="/dashboard/apply/ENTERPRISE_AGENT"
                    className="inline-flex items-center gap-1 bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90"
                  >
                    申请专家经纪公司
                  </Link>
                </div>
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
  realName: { required: true, requiredMessage: '请输入真实姓名' },
  contactPhone: {
    required: true,
    requiredMessage: '请输入联系电话',
    validator: Validators.phone,
  },
  email: {
    required: true,
    requiredMessage: '请输入常用邮箱',
    validator: Validators.email,
  },
  enterpriseAgentId: {
    required: true,
    requiredMessage: '请选择要加入的经纪公司',
  },
  agreementSigned: {
    required: true,
    requiredMessage: '请先勾选并同意《淘课网注册专家经纪人合作协议》',
    validator: (value) =>
      value === true ? undefined : '请先勾选并同意《淘课网注册专家经纪人合作协议》',
  },
};
