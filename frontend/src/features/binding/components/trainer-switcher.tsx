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
  /** 当前选中的专家 user_id；undefined 表示「我自己」 */
  value?: number;
  onChange: (trainerUserId: number | undefined, label: string) => void;
  /** 是否在没有任何代管关系时仍渲染（默认 false：直接不渲染） */
  alwaysShow?: boolean;
}

/**
 * 专家切换器（资源管理页头部使用）。
 * <p>
 * 通过 <code>GET /me/managed-trainers</code> 拉取我能代管的专家列表；
 * 让操作者在「我自己」与多个专家之间切换，从而切换 trainerUserId 上下文。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-21 18:00
 */
export function TrainerSwitcher({ value, onChange, alwaysShow = false }: TrainerSwitcherProps) {
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
        // 去重（不同绑定来源的同一专家只显示一次）
        const seen = new Set<number>();
        setItems(opts.filter((o) => (seen.has(o.userId) ? false : (seen.add(o.userId), true))));
      })
      .catch(() => {})
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const current = useMemo(() => items.find((o) => o.userId === value) ?? null, [items, value]);

  if (!loading && items.length === 0 && !alwaysShow) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-1.5 text-sm hover:bg-slate-50 transition-colors"
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
            {items.map((opt) => (
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
            ))}
          </div>
        </>
      )}
    </div>
  );
}
