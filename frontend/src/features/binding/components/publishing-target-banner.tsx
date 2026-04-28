'use client';

import { useState, useMemo, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { Users } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { TrainerSwitcher } from './trainer-switcher';
import { isDelegatingRole, selfPublishingAllowed } from '@/features/binding/lib/delegating-role';

/**
 * 「为谁代发」选择器横幅 — 配合 {@link usePublishingTarget} 在创建表单顶部使用。
 *
 * <p>规则：</p>
 * <ul>
 *   <li>专家角色（TRAINER）：不渲染（仅代表自己）。</li>
 *   <li>机构（INSTITUTION）：默认「我自己」，可切换到代管的专家。</li>
 *   <li>其他代管角色（INSTITUTION_EMPLOYEE / AGENT / ENTERPRISE_AGENT / ASSISTANT）：
 *       必须显式选定一个被代管专家，没有可代管专家时不允许提交。</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-21 19:00
 */
export interface PublishingTargetState {
  /** 当前选中的代管专家 user_id；undefined 表示「我自己」（仅 INSTITUTION 场景下出现）。 */
  trainerUserId: number | undefined;
  setTrainerUserId: (uid: number | undefined) => void;
  /** 表单顶部要渲染的横幅；TRAINER 角色为 null。 */
  banner: ReactNode;
  /** 当前是否可提交：required=true 且未选中专家时返回 false。 */
  valid: boolean;
  /** 是否要求显式选定一个代管专家（hideSelf 角色为 true）。 */
  requiresSelection: boolean;
}

export function usePublishingTarget(resourceLabel = '资源'): PublishingTargetState {
  const { activeRole } = useAuth();
  const search = useSearchParams();
  const initial = search.get('trainerUserId');
  const [trainerUserId, setTrainerUserId] = useState<number | undefined>(
    initial ? Number(initial) : undefined,
  );

  const show = isDelegatingRole(activeRole);
  const allowSelf = show && selfPublishingAllowed(activeRole);
  const hideSelf = show && !allowSelf;
  const requiresSelection = hideSelf;
  const valid = !requiresSelection || trainerUserId !== undefined;

  const banner = useMemo<ReactNode>(() => {
    if (!show) return null;
    return (
      <PublishingTargetBanner
        trainerUserId={trainerUserId}
        onChange={setTrainerUserId}
        hideSelf={hideSelf}
        required={requiresSelection}
        resourceLabel={resourceLabel}
      />
    );
  }, [show, trainerUserId, hideSelf, requiresSelection, resourceLabel]);

  return { trainerUserId, setTrainerUserId, banner, valid, requiresSelection };
}

interface PublishingTargetBannerProps {
  trainerUserId: number | undefined;
  onChange: (uid: number | undefined) => void;
  hideSelf: boolean;
  required: boolean;
  resourceLabel: string;
}

function PublishingTargetBanner({
  trainerUserId,
  onChange,
  hideSelf,
  required,
  resourceLabel,
}: PublishingTargetBannerProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Users className="size-4 text-primary" />
        <span>
          为谁代发：
          {required && (
            <span className="text-amber-600 ml-1">
              请选择要代发{resourceLabel}的专家（必填）
            </span>
          )}
          {!required && (
            <span className="text-gray-400 ml-1">
              选择「我自己」即以本机构 / 经纪公司主体名义发布
            </span>
          )}
        </span>
      </div>
      <TrainerSwitcher
        value={trainerUserId}
        onChange={(uid) => onChange(uid)}
        hideSelf={hideSelf}
        required={required}
        alwaysShow
        placeholder="请选择代管专家"
      />
    </div>
  );
}
