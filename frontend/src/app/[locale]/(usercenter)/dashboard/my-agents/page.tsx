'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  Handshake,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  Loader2,
} from 'lucide-react';
import {
  listMyAgents,
  listMyBindingRequests,
  confirmBindingByTrainer,
  rejectBindingByTrainer,
  unbind,
} from '@/features/binding/api/service';
import {
  BINDING_STATUS,
  type BindingItem,
  type BindingType,
} from '@/features/binding/api/types';
import { RejectReasonDialog } from '@/features/binding/components/reject-reason-dialog';

/**
 * 我的代理 — 专家视角
 * <p>
 * <ul>
 *   <li>顶部「待我确认」：列出 PENDING 请求，可一键同意/拒绝</li>
 *   <li>下方「已生效绑定」：助理 / 经纪人 / 培训机构 / 经纪公司</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-21 17:30
 */
export default function MyAgentsPage() {
  const [pending, setPending] = useState<BindingItem[]>([]);
  const [active, setActive] = useState<BindingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);
  const [rejectingItem, setRejectingItem] = useState<BindingItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [reqs, agents] = await Promise.all([
        listMyBindingRequests(),
        listMyAgents(),
      ]);
      setPending(reqs.filter((b) => b.status === BINDING_STATUS.PENDING));
      setActive(agents.filter((b) => b.status === BINDING_STATUS.ACTIVE));
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
      await confirmBindingByTrainer(item.bindingType, item.id);
      toast.success('已同意绑定');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    } finally {
      setActingId(null);
    }
  };

  const handleReject = (item: BindingItem) => {
    setRejectingItem(item);
  };

  const submitReject = async (reason: string) => {
    if (!rejectingItem) return;
    setActingId(rejectingItem.id);
    try {
      await rejectBindingByTrainer(rejectingItem.bindingType, rejectingItem.id, reason || undefined);
      toast.success('已拒绝绑定');
      setRejectingItem(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    } finally {
      setActingId(null);
    }
  };

  const handleUnbind = async (item: BindingItem) => {
    if (!confirm('确定要解除与该角色的绑定吗？')) return;
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
      {/* 待我确认 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-800">待我确认</h2>
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
            <Empty text="暂无待确认的绑定请求" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pending.map((item) => (
                <BindingCard
                  key={`${item.bindingType}-${item.id}`}
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

      {/* 已生效绑定 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-800">已生效绑定</h2>
            {active.length > 0 && (
              <span className="bg-green-50 text-green-600 text-xs px-2 py-0.5 rounded-full border border-green-200">
                {active.length}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 hidden sm:block">
            被绑定的角色可代为发布/管理你的课程、案例、视频、著作等资源。
          </p>
        </div>
        <div className="p-6">
          {loading ? (
            <Loading />
          ) : active.length === 0 ? (
            <Empty text="暂无已生效的代理绑定" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {active.map((item) => (
                <BindingCard
                  key={`${item.bindingType}-${item.id}`}
                  item={item}
                  acting={actingId === item.id}
                  onUnbind={handleUnbind}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <RejectReasonDialog
        open={!!rejectingItem}
        onOpenChange={(v) => {
          if (!v) setRejectingItem(null);
        }}
        title="拒绝绑定请求"
        description={
          rejectingItem
            ? `拒绝来自「${rejectingItem.counterpartNickname || rejectingItem.counterpartOrgName || `用户#${rejectingItem.counterpartUserId}`}」的绑定请求，可填写理由（可选）。`
            : ''
        }
        loading={actingId === rejectingItem?.id}
        onConfirm={submitReject}
      />
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
      <Handshake className="size-12 mb-3 text-gray-300" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function BindingCard({
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
  const roleLabel = item.counterpartRoleLabel || roleLabelByType(item.bindingType);
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
            {item.counterpartOrgName ? (
              <Building2 className="size-6" />
            ) : (
              <Users className="size-6" />
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800 truncate">
              {item.counterpartOrgName || item.counterpartNickname || `用户#${item.counterpartUserId}`}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
              {roleLabel}
            </span>
          </div>
          {item.counterpartOrgName && item.counterpartNickname && (
            <div className="text-xs text-gray-500 mt-1 truncate">
              联系人：{item.counterpartNickname}
            </div>
          )}
          {item.note && (
            <div className="text-xs text-gray-500 mt-1 line-clamp-2">备注：{item.note}</div>
          )}
          {item.createdAt && (
            <div className="text-xs text-gray-400 mt-1">{item.createdAt.slice(0, 16).replace('T', ' ')}</div>
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
              同意
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
            解除绑定
          </button>
        )}
      </div>
    </div>
  );
}

function roleLabelByType(type: BindingType): string {
  switch (type) {
    case 'AGENT_TRAINER': return '专家经纪人';
    case 'ASSISTANT_TRAINER': return '专家助理';
    case 'INSTITUTION_TRAINER': return '培训机构';
    case 'ENTERPRISE_AGENT_TRAINER': return '专家经纪公司';
    case 'INSTITUTION_EMPLOYEE': return '机构员工';
    default: return '绑定方';
  }
}
