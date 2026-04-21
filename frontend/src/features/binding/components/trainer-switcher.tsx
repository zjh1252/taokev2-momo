'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { ChevronDown, User2, Users } from 'lucide-react';
import { listManagedTrainers } from '@/features/binding/api/service';
import type { BindingItem } from '@/features/binding/api/types';

export interface ManagedTrainerOption {
  userId: number;
  nickname: string;
  avatarUrl?: string;
}

interface TrainerSwitcherProps {
  /** 当前选中的专家 user_id；undefined 表示「我自己」（仅 hideSelf=false 时有效） */
  value?: number;
  onChange: (trainerUserId: number | undefined, label: string) => void;
  /** 是否在没有任何代管关系时仍渲染（默认 false：直接不渲染） */
  alwaysShow?: boolean;
  /**
   * 是否隐藏「我自己」选项。
   * <p>
   * 用于自身没有资源主体的代管角色（ASSISTANT / AGENT / ENTERPRISE_AGENT
   * / INSTITUTION_EMPLOYEE）；INSTITUTION 不应传此值。
   * </p>
   */
  hideSelf?: boolean;
  /** 表单场景下要求必须显式选定一个被代管专家（配合 hideSelf 使用最自然）。 */
  required?: boolean;
  /** 占位文案：未选中时按钮上的提示。 */
  placeholder?: string;
}

/**
 * 专家切换器（资源管理页头部 / 创建表单顶部使用）。
 * <p>
 * 通过 <code>GET /me/managed-trainers</code> 拉取我能代管的专家列表；
 * 让操作者在「我自己」与多个专家之间切换，从而切换 trainerUserId 上下文。
 * </p>
 *
 * <p>当 hideSelf=true 时不展示「我自己」入口；若此时没有代管专家，组件
 * 仍会渲染（带 alwaysShow 时）以提示用户「暂无可代管专家」。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-21 18:00
 */
export function TrainerSwitcher({
  value,
  onChange,
  alwaysShow = false,
  hideSelf = false,
  required = false,
  placeholder = '请选择专家',
}: TrainerSwitcherProps) {
  const [items, setItems] = useState<ManagedTrainerOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    listManagedTrainers()
      .then((list: BindingItem[]) => {
        if (!mounted) return;
        const opts: ManagedTrainerOption[] = list
          .filter((b) => b.counterpartUserId)
          .map((b) => ({
            userId: b.counterpartUserId as number,
            nickname: b.counterpartNickname || `专家#${b.counterpartUserId}`,
            avatarUrl: b.counterpartAvatarUrl,
          }));
        const seen = new Set<number>();
        const deduped = opts.filter((o) => (seen.has(o.userId) ? false : (seen.add(o.userId), true)));
        setItems(deduped);
        // hideSelf 场景下，若调用方未指定 value，则默认选中第一项，避免空值
        if (hideSelf && deduped.length > 0 && value === undefined) {
          const first = deduped[0];
          onChange(first.userId, first.nickname);
        }
      })
      .catch(() => {})
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideSelf]);

  const current = useMemo(() => items.find((o) => o.userId === value) ?? null, [items, value]);

  if (!loading && items.length === 0 && !alwaysShow) return null;

  // 必选场景下未选中时高亮提示
  const empty = required && value === undefined && !current;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-2 border rounded-lg px-3 py-1.5 text-sm transition-colors ${
          empty
            ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
            : 'border-slate-200 hover:bg-slate-50'
        }`}
      >
        {current ? (
          <>
            {current.avatarUrl ? (
              <Image
                src={current.avatarUrl}
                alt={current.nickname}
                width={20}
                height={20}
                className="size-5 rounded-full object-cover bg-slate-100"
              />
            ) : (
              <User2 className="size-4 text-gray-400" />
            )}
            <span className="text-gray-700">代管：{current.nickname}</span>
          </>
        ) : hideSelf ? (
          <>
            <Users className="size-4 text-gray-400" />
            <span>{items.length === 0 ? '暂无可代管专家' : placeholder}</span>
          </>
        ) : (
          <>
            <Users className="size-4 text-gray-400" />
            <span className="text-gray-700">我自己</span>
          </>
        )}
        <ChevronDown className={`size-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-56 max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg py-1">
            {!hideSelf && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onChange(undefined, '我自己');
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 ${
                    value === undefined ? 'bg-primary/5 text-primary' : 'text-gray-700'
                  }`}
                >
                  <Users className="size-4" />
                  我自己
                </button>
                <div className="my-1 border-t border-slate-100" />
              </>
            )}
            {items.length === 0 ? (
              <div className="px-3 py-3 text-xs text-gray-400 text-center">
                暂无可代管专家
              </div>
            ) : (
              items.map((opt) => (
                <button
                  type="button"
                  key={opt.userId}
                  onClick={() => {
                    onChange(opt.userId, opt.nickname);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 ${
                    value === opt.userId ? 'bg-primary/5 text-primary' : 'text-gray-700'
                  }`}
                >
                  {opt.avatarUrl ? (
                    <Image
                      src={opt.avatarUrl}
                      alt={opt.nickname}
                      width={20}
                      height={20}
                      className="size-5 rounded-full object-cover bg-slate-100"
                    />
                  ) : (
                    <User2 className="size-4 text-gray-400" />
                  )}
                  <span className="truncate">{opt.nickname}</span>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
