'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Lock, User2, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { listManagedTrainers } from '@/features/binding/api/service';
import { isDelegatingRole, selfPublishingAllowed } from '@/features/binding/lib/delegating-role';

/**
 * 编辑场景下「归属专家」的只读横幅。
 *
 * <p>用于代管角色（INSTITUTION / INSTITUTION_EMPLOYEE / AGENT /
 * ENTERPRISE_AGENT / ASSISTANT）在编辑既有资源时清晰提示该资源归属于哪位
 * 专家。一旦资源已落库，归属关系不可在编辑页内修改。</p>
 *
 * <ul>
 *   <li>当前激活角色为 TRAINER（或非代管角色）：不渲染。</li>
 *   <li>提供 trainerNameHint 时直接展示，避免额外请求；否则通过
 *       listManagedTrainers 兜底查询昵称。</li>
 *   <li>未传 trainerUserId 且当前角色允许「以自身主体发布」（INSTITUTION）：
 *       展示「以本机构主体名义发布」。</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-21 19:00
 */
interface OwnedTrainerBannerProps {
  /** 资源所归属的专家 user_id，未提供则视作以自身主体发布。 */
  trainerUserId?: number;
  /** 已知的专家昵称，可省去再次拉取。 */
  trainerNameHint?: string;
  /** 已知的专家头像 URL，仅用于展示。 */
  trainerAvatarHint?: string;
}

export function OwnedTrainerBanner({
  trainerUserId,
  trainerNameHint,
  trainerAvatarHint,
}: OwnedTrainerBannerProps) {
  const { activeRole } = useAuth();
  const [name, setName] = useState<string | undefined>(trainerNameHint);
  const [avatar, setAvatar] = useState<string | undefined>(trainerAvatarHint);

  useEffect(() => {
    if (!trainerUserId) return;
    if (trainerNameHint) {
      setName(trainerNameHint);
      setAvatar(trainerAvatarHint);
      return;
    }
    listManagedTrainers()
      .then((list) => {
        const matched = list.find((b) => b.counterpartUserId === trainerUserId);
        if (matched) {
          setName(matched.counterpartNickname || `专家#${trainerUserId}`);
          setAvatar(matched.counterpartAvatarUrl);
        } else {
          setName(`专家#${trainerUserId}`);
        }
      })
      .catch(() => setName(`专家#${trainerUserId}`));
  }, [trainerUserId, trainerNameHint, trainerAvatarHint]);

  if (!isDelegatingRole(activeRole)) return null;

  // 未指定 trainerUserId：仅当角色允许「自身主体发布」时显示自身归属提示
  if (!trainerUserId) {
    if (!selfPublishingAllowed(activeRole)) return null;
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-gray-600">
        <Users className="size-4 text-primary" />
        <span>归属：以本机构主体名义发布</span>
        <Lock className="size-3.5 text-gray-300 ml-auto" />
        <span className="text-xs text-gray-400">编辑时归属不可修改</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-gray-600">
      {avatar ? (
        <Image
          src={avatar}
          alt={name ?? '专家'}
          width={24}
          height={24}
          className="size-6 rounded-full object-cover bg-slate-100"
        />
      ) : (
        <User2 className="size-4 text-gray-400" />
      )}
      <span>
        归属专家：<span className="text-gray-800 font-medium">{name ?? `专家#${trainerUserId}`}</span>
      </span>
      <Lock className="size-3.5 text-gray-300 ml-auto" />
      <span className="text-xs text-gray-400">编辑时归属不可修改</span>
    </div>
  );
}
