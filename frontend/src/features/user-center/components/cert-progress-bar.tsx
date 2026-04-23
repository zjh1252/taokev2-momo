'use client';

import { Check, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CertStatus = 1 | 2 | 3 | null | undefined;

export interface CertProgressBarProps {
  /** 当前认证状态：null=未提交 1=待审核 2=已通过 3=已驳回 */
  status: CertStatus;
  submittedAt: string | null | undefined;
  auditedAt: string | null | undefined;
  rejectReason?: string | null;
  /** 维度标签（如「实名认证」「学历认证」），用于驳回提示文案 */
  label?: string;
}

/**
 * 资质认证进度条 — 横向 3 段步骤：已提交 → 审核中 / 已通过 / 已驳回。
 *
 * <p>「未提交」状态隐式表示，不显示进度条。组件内部已处理。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-16 17:30
 */
export function CertProgressBar({
  status,
  submittedAt,
  auditedAt,
  rejectReason,
  label = '认证',
}: CertProgressBarProps) {
  if (status == null) {
    return (
      <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        当前{label}尚未提交。请填写并提交后等待平台审核。
      </div>
    );
  }

  const isPending = status === 1;
  const isApproved = status === 2;
  const isRejected = status === 3;

  // 三段：已提交 - 审核中 - 结果
  const submittedDone = true;
  const reviewingDone = isApproved || isRejected;
  const resultLabel = isApproved ? '已通过' : isRejected ? '已驳回' : '审核中';
  const ResultIcon = isApproved ? Check : isRejected ? X : Clock;

  return (
    <div className="space-y-3">
      <div className="flex items-center">
        {/* 步骤 1: 已提交 */}
        <Step
          icon={<Check className="size-4" />}
          label="已提交"
          time={fmt(submittedAt)}
          state={submittedDone ? 'done' : 'idle'}
        />
        <Connector active={reviewingDone || isPending} />
        {/* 步骤 2: 审核中 */}
        <Step
          icon={isPending ? <Clock className="size-4 animate-pulse" /> : <Check className="size-4" />}
          label={isPending ? '审核中' : '已审核'}
          time={isPending ? '请耐心等待' : fmt(auditedAt)}
          state={isPending ? 'active' : reviewingDone ? 'done' : 'idle'}
        />
        <Connector active={reviewingDone} />
        {/* 步骤 3: 结果 */}
        <Step
          icon={<ResultIcon className="size-4" />}
          label={resultLabel}
          time={reviewingDone ? fmt(auditedAt) : ''}
          state={isApproved ? 'done' : isRejected ? 'error' : 'idle'}
        />
      </div>

      {isRejected && rejectReason && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
          <span className="font-medium">驳回原因：</span>
          {rejectReason}
        </div>
      )}
    </div>
  );
}

interface StepProps {
  icon: React.ReactNode;
  label: string;
  time: string;
  state: 'idle' | 'active' | 'done' | 'error';
}

function Step({ icon, label, time, state }: StepProps) {
  const colorMap = {
    idle: 'text-slate-400 border-slate-300 bg-white',
    active: 'text-amber-600 border-amber-300 bg-amber-50',
    done: 'text-primary border-primary bg-primary/5',
    error: 'text-red-600 border-red-300 bg-red-50',
  };
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[90px]">
      <div
        className={cn(
          'size-9 rounded-full border-2 flex items-center justify-center',
          colorMap[state],
        )}
      >
        {icon}
      </div>
      <div
        className={cn(
          'text-xs font-medium',
          state === 'done' && 'text-primary',
          state === 'active' && 'text-amber-600',
          state === 'error' && 'text-red-600',
          state === 'idle' && 'text-slate-400',
        )}
      >
        {label}
      </div>
      {time && <div className="text-[11px] text-slate-400">{time}</div>}
    </div>
  );
}

function Connector({ active }: { active: boolean }) {
  return (
    <div
      className={cn(
        'flex-1 h-[2px] mx-2 -mt-7',
        active ? 'bg-primary/40' : 'bg-slate-200',
      )}
    />
  );
}

/** 后端 LocalDateTime 字符串格式化为 yyyy-MM-dd HH:mm */
function fmt(iso: string | null | undefined): string {
  if (!iso) return '';
  // 兼容 "2026-04-16T17:30:00" 与 "2026-04-16T17:30:00.123"
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (m) return `${m[1]} ${m[2]}`;
  return iso;
}
