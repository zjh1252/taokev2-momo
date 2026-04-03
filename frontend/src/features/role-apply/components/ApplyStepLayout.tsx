'use client';

import { ArrowLeft, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ApplyableRole } from '../api/types';
import { APPLYABLE_ROLES } from '../api/types';

const STEPS = [
  { key: 'select', label: '选择角色' },
  { key: 'fill', label: '填写资料' },
  { key: 'done', label: '提交完成' },
];

interface ApplyStepLayoutProps {
  role: ApplyableRole;
  /** 当前步骤索引 0=选择角色 1=填写资料 2=提交完成 */
  currentStep: number;
  children: React.ReactNode;
  onBack?: () => void;
  onSubmit?: () => void;
  submitting?: boolean;
}

/**
 * 角色申请统一步骤布局 — 步骤条 + 角色标签 + 上一步/提交
 *
 * @author Fangxinxin
 * @date 2026-04-03 15:30
 */
export function ApplyStepLayout({
  role,
  currentStep,
  children,
  onBack,
  onSubmit,
  submitting,
}: ApplyStepLayoutProps) {
  const roleMeta = APPLYABLE_ROLES.find((r) => r.code === role);
  const roleLabel = roleMeta?.label || role;

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px]">
      {/* 步骤条 */}
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg font-bold text-gray-900">角色申请</span>
          <span className="text-xs bg-primary/10 text-primary font-semibold px-2.5 py-0.5 rounded-full">
            {roleLabel}
          </span>
        </div>
        <div className="flex items-center gap-0">
          {STEPS.map((step, idx) => (
            <div key={step.key} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex items-center justify-center size-7 rounded-full text-xs font-bold transition-colors',
                    idx < currentStep
                      ? 'bg-primary text-white'
                      : idx === currentStep
                        ? 'bg-primary text-white'
                        : 'bg-slate-200 text-slate-500',
                  )}
                >
                  {idx < currentStep ? '✓' : idx + 1}
                </div>
                <span
                  className={cn(
                    'text-sm font-medium',
                    idx <= currentStep ? 'text-gray-900' : 'text-gray-400',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-16 h-[2px] mx-3',
                    idx < currentStep ? 'bg-primary' : 'bg-slate-200',
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 表单内容 */}
      <div className="p-6">{children}</div>

      {/* 底部操作栏 */}
      {currentStep === 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onBack}
            className="h-10 px-5 rounded-xl border border-slate-200 text-sm font-medium text-gray-600 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            <span>上一步</span>
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className={cn(
              'h-10 px-6 rounded-xl font-bold text-sm flex items-center gap-2 transition-all',
              submitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 cursor-pointer',
            )}
          >
            {submitting ? (
              <span>提交中...</span>
            ) : (
              <>
                <Send className="size-4" />
                <span>提交申请</span>
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
