'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  UserPlus, Plus, Search, X, Loader2, AlertCircle, Users,
  CheckCircle2, XCircle,
} from 'lucide-react';
import {
  listEnterpriseAgentMembers,
  approveAgentByEnterprise,
  rejectAgentByEnterprise,
  initiateBinding,
  unbind,
  lookupUserByPhone,
  BINDING_STATUS,
  type BindingItem,
} from '@/features/enterprise-agent/api/service';
import type { LookupUserResult } from '@/features/binding/api/service';

const STATUS_TABS: { key: string; label: string; value: number | undefined }[] = [
  { key: 'all', label: '全部', value: undefined },
  { key: 'pending-review', label: '待我审核', value: BINDING_STATUS.PENDING },
  { key: 'active', label: '已生效', value: BINDING_STATUS.ACTIVE },
  { key: 'rejected', label: '已拒绝', value: BINDING_STATUS.REJECTED },
  { key: 'unbound', label: '已解绑', value: BINDING_STATUS.UNBOUND },
];

const STATUS_BADGE: Record<number, string> = {
  [BINDING_STATUS.ACTIVE]: 'bg-green-50 text-green-600 border-green-100',
  [BINDING_STATUS.PENDING]: 'bg-amber-50 text-amber-600 border-amber-100',
  [BINDING_STATUS.REJECTED]: 'bg-red-50 text-red-600 border-red-100',
  [BINDING_STATUS.UNBOUND]: 'bg-slate-100 text-slate-500 border-slate-200',
};

/**
 * 我的经纪人 — 经纪公司视角
 * <p>
 * <ul>
 *   <li>支持「待我审核 / 已生效 / 已拒绝 / 已解绑」状态分页</li>
 *   <li>支持 ?tab=pending-review 深链直达待审核 tab</li>
 *   <li>「邀请新经纪人」 按手机号查找用户后发起 PENDING 绑定</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-21 23:00
 */
export default function MyAgentsTeamPage() {
  const search = useSearchParams();
  const initialTab = search.get('tab') ?? 'all';

  const [items, setItems] = useState<BindingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>(initialTab);
  const [adding, setAdding] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listEnterpriseAgentMembers());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    const t = STATUS_TABS.find((x) => x.key === tab);
    if (!t || t.value == null) return items;
    return items.filter((b) => b.status === t.value);
  }, [items, tab]);

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: items.length };
    for (const t of STATUS_TABS) {
      if (t.value != null) m[t.key] = items.filter((b) => b.status === t.value).length;
    }
    return m;
  }, [items]);

  const handleApprove = async (item: BindingItem) => {
    setActingId(item.id);
    try {
      await approveAgentByEnterprise(item.id);
      toast.success('已通过申请');
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (item: BindingItem) => {
    const reason = prompt('请输入拒绝理由（可选）') ?? '';
    setActingId(item.id);
    try {
      await rejectAgentByEnterprise(item.id, reason || undefined);
      toast.success('已拒绝申请');
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    } finally {
      setActingId(null);
    }
  };

  const handleUnbind = async (item: BindingItem) => {
    if (!confirm('确定要解除该经纪人的绑定吗？')) return;
    setActingId(item.id);
    try {
      await unbind(item.bindingType, item.id);
      toast.success('已解除绑定');
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    } finally {
      setActingId(null);
    }
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-800">我的经纪人</h2>
          <span className="text-xs text-gray-400">{items.length} 位</span>
        </div>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="size-4" />
          邀请新经纪人
        </button>
      </div>

      <div className="px-6 pt-4 pb-2 flex gap-1 flex-wrap">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3.5 py-1.5 text-sm rounded-full transition-colors ${
              tab === t.key ? 'bg-primary text-white' : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
            }`}
          >
            {t.label}
            <span className="ml-1 opacity-60">({counts[t.key] ?? 0})</span>
          </button>
        ))}
      </div>

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
              <AgentCard
                key={item.id}
                item={item}
                acting={actingId === item.id}
                onApprove={handleApprove}
                onReject={handleReject}
                onUnbind={handleUnbind}
              />
            ))}
          </div>
        )}
      </div>

      {adding && (
        <InviteAgentDialog
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

function AgentCard({
  item,
  acting,
  onApprove,
  onReject,
  onUnbind,
}: {
  item: BindingItem;
  acting: boolean;
  onApprove: (i: BindingItem) => void;
  onReject: (i: BindingItem) => void;
  onUnbind: (i: BindingItem) => void;
}) {
  const status = item.status;
  // 待我审核 = PENDING 且不是我发起
  const needsReview = status === BINDING_STATUS.PENDING && !item.iAmInitiator;
  return (
    <div className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
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
            <UserPlus className="size-6" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800 truncate">
              {item.counterpartNickname || `经纪人#${item.counterpartUserId}`}
            </span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full border shrink-0 ${STATUS_BADGE[status] || ''}`}>
              {item.statusLabel}
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {item.iAmInitiator ? '我方邀请' : '对方申请'} · {item.createdAt?.slice(0, 10)}
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
      <div className="mt-3 flex flex-wrap gap-2 justify-end">
        {needsReview && (
          <>
            <button
              type="button"
              disabled={acting}
              onClick={() => onApprove(item)}
              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <CheckCircle2 className="size-3.5" />
              通过
            </button>
            <button
              type="button"
              disabled={acting}
              onClick={() => onReject(item)}
              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-slate-200 text-gray-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <XCircle className="size-3.5" />
              拒绝
            </button>
          </>
        )}
        {(status === BINDING_STATUS.ACTIVE
          || (status === BINDING_STATUS.PENDING && item.iAmInitiator)) && (
          <button
            type="button"
            disabled={acting}
            onClick={() => onUnbind(item)}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            <X className="size-3.5" />
            {status === BINDING_STATUS.PENDING ? '撤回邀请' : '解除绑定'}
          </button>
        )}
      </div>
    </div>
  );
}

function InviteAgentDialog({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
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
      toast.error(err instanceof Error ? err.message : '未找到对应用户');
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
        bindingType: 'ENTERPRISE_AGENT_MEMBER',
        targetUserId: picked.id,
        note: note.trim() || undefined,
      });
      toast.success('经纪人邀请已发送，等待对方确认');
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
          <h3 className="font-bold text-gray-800">邀请新经纪人</h3>
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
            <label className="block text-sm text-gray-700 mb-1">经纪人手机号</label>
            <div className="flex gap-2">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="请输入经纪人注册的手机号"
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
                  <UserPlus className="size-5" />
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
              placeholder="向对方说明邀请意图（可选）"
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
            发起邀请
          </button>
        </div>
      </div>
    </div>
  );
}
