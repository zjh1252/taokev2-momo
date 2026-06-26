'use client';

import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { Users, Building2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { TrainerSwitcher } from './trainer-switcher';
import { isDelegatingRole, selfPublishingAllowed } from '@/features/binding/lib/delegating-role';
import { listMyEnterpriseAgents } from '@/features/binding/api/service';
import { BINDING_STATUS, type BindingItem } from '@/features/binding/api/types';

/**
 * 「为谁代发」选择器横幅 — 配合 {@link usePublishingTarget} 在创建表单顶部使用。
 *
 * <p>规则：</p>
 * <ul>
 *   <li>专家角色（TRAINER）：不渲染（仅代表自己）。</li>
 *   <li>机构（INSTITUTION）：默认「我自己」，可切换到代管的专家。</li>
 *   <li>其他代管角色（INSTITUTION_EMPLOYEE / AGENT / ENTERPRISE_AGENT / ASSISTANT）：
 *       必须显式选定一个被代管专家，没有可代管专家时不允许提交。</li>
 *   <li>经纪人（AGENT）+ allowEnterpriseAgentDelegation：可改为代隶属的经纪公司发布。</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-21 19:00
 */
export interface PublishingTargetState {
  /** 当前选中的代管专家 user_id；undefined 表示「我自己」（仅 INSTITUTION 场景下出现）。 */
  trainerUserId: number | undefined;
  setTrainerUserId: (uid: number | undefined) => void;
  /** 当前选中的代发经纪公司 user_id（仅 AGENT + allowEnterpriseAgentDelegation 场景）。 */
  enterpriseAgentUserId: number | undefined;
  /** 表单顶部要渲染的横幅；TRAINER 角色为 null。 */
  banner: ReactNode;
  /** 当前是否可提交：required=true 且未选中专家/经纪公司时返回 false。 */
  valid: boolean;
  /** 是否要求显式选定一个代管专家（hideSelf 角色为 true）。 */
  requiresSelection: boolean;
}

export interface PublishingTargetOptions {
  /** 允许经纪人（AGENT）选择代隶属经纪公司发布（目前仅课程发布开放）。 */
  allowEnterpriseAgentDelegation?: boolean;
}

export function usePublishingTarget(
  resourceLabel = '资源',
  options?: PublishingTargetOptions,
): PublishingTargetState {
  const { activeRole } = useAuth();
  const search = useSearchParams();
  const initial = search.get('trainerUserId');
  const initialEa = search.get('enterpriseAgentUserId');
  const [trainerUserId, setTrainerUserId] = useState<number | undefined>(
    initial ? Number(initial) : undefined,
  );
  const [enterpriseAgentUserId, setEnterpriseAgentUserId] = useState<number | undefined>(
    initialEa ? Number(initialEa) : undefined,
  );

  // AGENT 可代发的经纪公司列表（ACTIVE 成员关系）
  const enableEaDelegation = !!options?.allowEnterpriseAgentDelegation && activeRole === 'AGENT';
  const [enterprises, setEnterprises] = useState<BindingItem[]>([]);
  useEffect(() => {
    if (!enableEaDelegation) return;
    listMyEnterpriseAgents()
      .then((list) => setEnterprises(list.filter((b) => b.status === BINDING_STATUS.ACTIVE)))
      .catch(() => setEnterprises([]));
  }, [enableEaDelegation]);

  const show = isDelegatingRole(activeRole);
  const allowSelf = show && selfPublishingAllowed(activeRole);
  const hideSelf = show && !allowSelf;
  const requiresSelection = hideSelf;
  const valid =
    !requiresSelection || trainerUserId !== undefined || enterpriseAgentUserId !== undefined;

  const banner = useMemo<ReactNode>(() => {
    if (!show) return null;
    return (
      <PublishingTargetBanner
        trainerUserId={trainerUserId}
        onChange={(uid) => {
          setTrainerUserId(uid);
          // 选定专家后清空经纪公司目标，两者互斥
          if (uid !== undefined) setEnterpriseAgentUserId(undefined);
        }}
        hideSelf={hideSelf}
        required={requiresSelection}
        resourceLabel={resourceLabel}
        enterprises={enableEaDelegation ? enterprises : undefined}
        enterpriseAgentUserId={enterpriseAgentUserId}
        onEnterpriseChange={(uid) => {
          setEnterpriseAgentUserId(uid);
          // 选定经纪公司后清空专家目标，两者互斥
          if (uid !== undefined) setTrainerUserId(undefined);
        }}
      />
    );
  }, [
    show,
    trainerUserId,
    hideSelf,
    requiresSelection,
    resourceLabel,
    enableEaDelegation,
    enterprises,
    enterpriseAgentUserId,
  ]);

  return {
    trainerUserId,
    setTrainerUserId,
    enterpriseAgentUserId,
    banner,
    valid,
    requiresSelection,
  };
}

interface PublishingTargetBannerProps {
  trainerUserId: number | undefined;
  onChange: (uid: number | undefined) => void;
  hideSelf: boolean;
  required: boolean;
  resourceLabel: string;
  /** AGENT 可代发的经纪公司（ACTIVE）；undefined 表示不开放该能力 */
  enterprises?: BindingItem[];
  enterpriseAgentUserId?: number;
  onEnterpriseChange?: (uid: number | undefined) => void;
}

function PublishingTargetBanner({
  trainerUserId,
  onChange,
  hideSelf,
  required,
  resourceLabel,
  enterprises,
  enterpriseAgentUserId,
  onEnterpriseChange,
}: PublishingTargetBannerProps) {
  const showEnterprise = !!enterprises && enterprises.length > 0;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Users className="size-4 text-primary" />
        <span>
          为谁代发：
          {required && (
            <span className="text-amber-600 ml-1">
              请选择要代发{resourceLabel}的{showEnterprise ? '专家或经纪公司' : '专家'}（必填）
            </span>
          )}
          {!required && (
            <span className="text-gray-400 ml-1">
              选择「我自己」即以本机构 / 经纪公司主体名义发布
            </span>
          )}
        </span>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <TrainerSwitcher
          value={trainerUserId}
          onChange={(uid) => onChange(uid)}
          hideSelf={hideSelf}
          required={required}
          alwaysShow
          placeholder="请选择代管专家"
        />
        {showEnterprise && onEnterpriseChange && (
          <div className="flex items-center gap-1.5">
            <Building2 className="size-4 text-primary shrink-0" />
            <select
              value={enterpriseAgentUserId ?? 0}
              onChange={(e) => {
                const val = Number(e.target.value);
                onEnterpriseChange(val || undefined);
              }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value={0}>或代经纪公司发布</option>
              {enterprises.map((ea) => (
                <option key={ea.counterpartUserId} value={ea.counterpartUserId}>
                  {ea.counterpartOrgName || ea.counterpartNickname || `经纪公司 ${ea.counterpartUserId}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
