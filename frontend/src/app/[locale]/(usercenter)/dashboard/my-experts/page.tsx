'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  Users, Plus, Search, X, Loader2, AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import {
  listInstitutionTrainers,
  listEnterpriseAgentTrainers,
  listAgentTrainers,
  listAssistantTrainers,
  listManagedTrainers,
  initiateBinding,
  unbind,
  lookupUserByPhone,
  type LookupUserResult,
} from '@/features/binding/api/service';
import {
  BINDING_STATUS,
  type BindingItem,
  type BindingType,
} from '@/features/binding/api/types';

const STATUS_TABS: { label: string; value: number | undefined }[] = [
  { label: '全部', value: undefined },
  { label: '已生效', value: BINDING_STATUS.ACTIVE },
  { label: '待确认', value: BINDING_STATUS.PENDING },
  { label: '已拒绝', value: BINDING_STATUS.REJECTED },
  { label: '已解绑', value: BINDING_STATUS.UNBOUND },
];

const STATUS_BADGE: Record<number, string> = {
  [BINDING_STATUS.ACTIVE]: 'bg-green-50 text-green-600 border-green-100',
  [BINDING_STATUS.PENDING]: 'bg-amber-50 text-amber-600 border-amber-100',
  [BINDING_STATUS.REJECTED]: 'bg-red-50 text-red-600 border-red-100',
  [BINDING_STATUS.UNBOUND]: 'bg-slate-100 text-slate-500 border-slate-200',
};

/**
 * 我的专家 — 培训机构 / 经纪公司 / 经纪人 / 专家助理 视角
 *
 * @author Fangxinxin
 * @date 2026-04-21 17:30
 */
export default function MyExpertsPage() {
  const { activeRole } = useAuth();
  const [items, setItems] = useState<BindingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<number | undefined>(undefined);
  const [adding, setAdding] = useState(false);

  const role = activeRole;
  const bindingType: BindingType = mapRoleToType(role);
  const readOnly = role === 'INSTITUTION_EMPLOYEE';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const fetcher = pickListFetcher(role);
      const list = fetcher ? await fetcher() : [];
      setItems(list);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = tab == null ? items : items.filter((b) => b.status === tab);

  const handleUnbind = async (item: BindingItem) => {
    if (!confirm('确定要解除与该专家的绑定吗？')) return;
    try {
      await unbind(item.bindingType, item.id);
      toast.success('已解除绑定');
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    }
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-800">我的专家</h2>
          <span className="text-xs text-gray-400">{items.length} 位</span>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            添加专家
          </button>
        )}
        {readOnly && (
          <span className="text-xs text-gray-400">只读视图，权限来自所属机构</span>
        )}
      </div>

      {!readOnly && (
      <div className="px-6 pt-4 pb-2 flex gap-1 flex-wrap">
        {STATUS_TABS.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setTab(t.value)}
            className={`px-3.5 py-1.5 text-sm rounded-full transition-colors ${
              tab === t.value
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
            }`}
          >
            {t.label}
            {t.value !== undefined && (
              <span className="ml-1 opacity-60">
                ({items.filter((b) => b.status === t.value).length})
              </span>
            )}
          </button>
        ))}
      </div>
      )}

      <div className="px-6 pb-6 pt-3">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Users className="size-12 mb-3 text-gray-300" />
            <p className="text-sm">暂无数据</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <ExpertCard
                key={`${item.bindingType}-${item.id}`}
                item={item}
                readOnly={readOnly}
                onUnbind={handleUnbind}
              />
            ))}
          </div>
        )}
      </div>

      {adding && (
        <AddExpertDialog
          bindingType={bindingType}
          onClose={() => setAdding(false)}
          onAdded={() => {
            setAdding(false);
            fetchData();
          }}
        />
      )}
    </section>
  );
}

/* ============================================================ */

function mapRoleToType(role: string | undefined): BindingType {
  switch (role) {
    case 'INSTITUTION': return 'INSTITUTION_TRAINER';
    case 'ENTERPRISE_AGENT': return 'ENTERPRISE_AGENT_TRAINER';
    case 'AGENT': return 'AGENT_TRAINER';
    case 'ASSISTANT': return 'ASSISTANT_TRAINER';
    default: return 'INSTITUTION_TRAINER';
  }
}

function pickListFetcher(role: string | undefined): (() => Promise<BindingItem[]>) | null {
  switch (role) {
    case 'INSTITUTION': return listInstitutionTrainers;
    case 'ENTERPRISE_AGENT': return listEnterpriseAgentTrainers;
    case 'AGENT': return listAgentTrainers;
    case 'ASSISTANT': return listAssistantTrainers;
    case 'INSTITUTION_EMPLOYEE': return listManagedTrainers;
    default: return null;
  }
}

function ExpertCard({
  item,
  readOnly,
  onUnbind,
}: {
  item: BindingItem;
  readOnly?: boolean;
  onUnbind: (i: BindingItem) => void;
}) {
  const status = item.status;
  return (
    <div className="border border-slate-200 rounded-lg p-4 hover:border-primary/40 hover:shadow-md transition-all">
      <div className="flex gap-3">
        {item.counterpartAvatarUrl ? (
          <Image
            src={item.counterpartAvatarUrl}
            alt={item.counterpartNickname || ''}
            width={48}
            height={48}
            className="size-12 rounded-full object-cover bg-slate-100"
          />
        ) : (
          <div className="size-12 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center">
            <Users className="size-6" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800 truncate">
              {item.counterpartNickname || `专家#${item.counterpartUserId}`}
            </span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full border shrink-0 ${STATUS_BADGE[status] || ''}`}>
              {item.statusLabel}
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {item.iAmInitiator ? '我方发起邀请' : '对方发起申请'} · {item.createdAt?.slice(0, 10)}
          </div>
          {item.note && <div className="text-xs text-gray-500 mt-1 line-clamp-2">备注：{item.note}</div>}
          {item.rejectReason && (
            <div className="flex items-start gap-1 text-xs text-red-500 mt-1">
              <AlertCircle className="size-3 mt-0.5 shrink-0" />
              <span className="line-clamp-2">拒绝理由：{item.rejectReason}</span>
            </div>
          )}
        </div>
      </div>
      {!readOnly && (
        <div className="mt-3 flex flex-wrap gap-2 justify-end">
          {(status === BINDING_STATUS.ACTIVE || status === BINDING_STATUS.PENDING) && (
            <button
              type="button"
              onClick={() => onUnbind(item)}
              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
            >
              <X className="size-3.5" />
              {status === BINDING_STATUS.PENDING ? '撤回' : '解除绑定'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================ */

function AddExpertDialog({
  bindingType,
  onClose,
  onAdded,
}: {
  bindingType: BindingType;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [phone, setPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [picked, setPicked] = useState<LookupUserResult | null>(null);
  const [note, setNote] = useState('');

  const handleSearch = async () => {
    if (!phone.trim()) {
      toast.error('请先输入手机号');
      return;
    }
    setSearching(true);
    try {
      setPicked(await lookupUserByPhone(phone.trim()));
    } catch (err) {
      setPicked(null);
      toast.error(err instanceof Error ? err.message : '未找到该手机号对应用户，请确认对方已注册');
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!picked) {
      toast.error('请先按手机号查找用户');
      return;
    }
    setSubmitting(true);
    try {
      await initiateBinding({
        bindingType,
        targetUserId: picked.id,
        note: note.trim() || undefined,
      });
      toast.success('绑定请求已发送，等待专家确认');
      onAdded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '发起失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">添加专家</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">专家手机号</label>
            <div className="flex gap-2">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="请输入对方注册的手机号"
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching}
                className="inline-flex items-center gap-1 bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                查找
              </button>
            </div>
          </div>

          {picked && (
            <div className="border border-primary/30 bg-primary/5 rounded-lg p-3 flex items-center gap-3">
              {picked.avatarUrl ? (
                <Image
                  src={picked.avatarUrl}
                  alt={picked.nickname || ''}
                  width={40}
                  height={40}
                  className="size-10 rounded-full object-cover bg-slate-100"
                />
              ) : (
                <div className="size-10 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center">
                  <Users className="size-5" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">
                  {picked.nickname || `用户#${picked.id}`}
                </div>
                <div className="text-xs text-gray-500">{picked.phone}</div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-700 mb-1">备注（可选）</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="向专家说明绑定意图（可选）"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            disabled={submitting || !picked}
            onClick={handleSubmit}
            className="inline-flex items-center gap-1 bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            发起绑定
          </button>
        </div>
      </div>
    </div>
  );
}
