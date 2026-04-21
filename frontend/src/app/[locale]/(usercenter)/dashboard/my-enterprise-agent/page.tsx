'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  Briefcase,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  listMyEnterpriseAgents,
  confirmBindingByAgent,
  rejectBindingByAgent,
  unbind,
  BINDING_STATUS,
  type BindingItem,
} from '@/features/agent/api/service';

/**
 * 我的经纪公司 — 经纪人视角
 * <p>
 * <ul>
 *   <li>顶部「公司邀请」：列出经纪公司邀请我的 PENDING 绑定</li>
 *   <li>下方「已加入的经纪公司」：列出我已隶属的公司</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-21 22:30
 */
export default function MyEnterpriseAgentPage() {
  const [pending, setPending] = useState<BindingItem[]>([]);
  const [active, setActive] = useState<BindingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listMyEnterpriseAgents();
      setPending(list.filter((b) => b.status === BINDING_STATUS.PENDING && !b.iAmInitiator));
      setActive(list.filter((b) => b.status === BINDING_STATUS.ACTIVE));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleConfirm = async (item: BindingItem) => {
    setActingId(item.id);
    try {
      await confirmBindingByAgent(item.id);
      toast.success('已加入经纪公司');
      await load();
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
      await rejectBindingByAgent(item.id, reason || undefined);
      toast.success('已拒绝邀请');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    } finally {
      setActingId(null);
    }
  };

  const handleUnbind = async (item: BindingItem) => {
    if (!confirm('确定要离开该经纪公司吗？')) return;
    setActingId(item.id);
    try {
      await unbind(item.bindingType, item.id);
      toast.success('已解除绑定');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    } finally {
      setActingId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-800">公司邀请</h2>
            {pending.length > 0 && (
              <span className="bg-amber-50 text-amber-600 text-xs px-2 py-0.5 rounded-full border border-amber-200">
                {pending.length}
              </span>
            )}
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <Loading />
          ) : pending.length === 0 ? (
            <Empty text="暂无待确认的公司邀请" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pending.map((item) => (
                <Card
                  key={item.id}
                  item={item}
                  acting={actingId === item.id}
                  showPendingActions
                  onConfirm={handleConfirm}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-800">已加入的经纪公司</h2>
            {active.length > 0 && (
              <span className="bg-green-50 text-green-600 text-xs px-2 py-0.5 rounded-full border border-green-200">
                {active.length}
              </span>
            )}
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <Loading />
          ) : active.length === 0 ? (
            <Empty text="您还没有加入任何经纪公司" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {active.map((item) => (
                <Card
                  key={item.id}
                  item={item}
                  acting={actingId === item.id}
                  onUnbind={handleUnbind}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-10 text-gray-400">
      <Loader2 className="size-6 animate-spin" />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
      <Briefcase className="size-12 mb-3 text-gray-300" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function Card({
  item,
  acting,
  showPendingActions,
  onConfirm,
  onReject,
  onUnbind,
}: {
  item: BindingItem;
  acting: boolean;
  showPendingActions?: boolean;
  onConfirm?: (item: BindingItem) => void;
  onReject?: (item: BindingItem) => void;
  onUnbind?: (item: BindingItem) => void;
}) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-3">
        {item.counterpartAvatarUrl ? (
          <Image
            src={item.counterpartAvatarUrl}
            alt={item.counterpartOrgName || ''}
            width={48}
            height={48}
            className="size-12 rounded-md object-cover bg-slate-100"
          />
        ) : (
          <div className="size-12 rounded-md bg-slate-100 text-slate-300 flex items-center justify-center">
            <Briefcase className="size-6" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800 truncate">
              {item.counterpartOrgName || `公司#${item.counterpartUserId}`}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
              专家经纪公司
            </span>
          </div>
          {item.counterpartNickname && (
            <div className="text-xs text-gray-500 mt-1 truncate">联系人：{item.counterpartNickname}</div>
          )}
          {item.note && <div className="text-xs text-gray-500 mt-1 line-clamp-2">备注：{item.note}</div>}
          {item.createdAt && (
            <div className="text-xs text-gray-400 mt-1">
              {item.iAmInitiator ? '我方申请' : '公司邀请'} · {item.createdAt.slice(0, 16).replace('T', ' ')}
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 justify-end">
        {showPendingActions && (
          <>
            <button
              type="button"
              disabled={acting}
              onClick={() => onConfirm?.(item)}
              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <CheckCircle2 className="size-3.5" />
              同意加入
            </button>
            <button
              type="button"
              disabled={acting}
              onClick={() => onReject?.(item)}
              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-slate-200 text-gray-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <XCircle className="size-3.5" />
              拒绝
            </button>
          </>
        )}
        {onUnbind && (
          <button
            type="button"
            disabled={acting}
            onClick={() => onUnbind(item)}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            <AlertCircle className="size-3.5" />
            离开公司
          </button>
        )}
      </div>
    </div>
  );
}
