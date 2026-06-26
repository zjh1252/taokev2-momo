'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, XCircle } from 'lucide-react';

interface RejectReasonDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** 弹窗标题，默认「拒绝申请」 */
  title?: string;
  /** 弹窗描述文案 */
  description?: string;
  /** 拒绝按钮文字，默认「确认拒绝」 */
  confirmText?: string;
  /** 是否处理中（禁用按钮 + 显示 loader） */
  loading?: boolean;
  /**
   * 用户点击「确认拒绝」时回调，参数为输入的理由（可空）。
   * <p>实现侧负责调用 API、关闭弹窗。
   */
  onConfirm: (reason: string) => void | Promise<void>;
}

/**
 * 通用「拒绝理由」弹窗 — 用于绑定 / 申请类操作中替代浏览器 prompt()。
 *
 * @author Fangxinxin
 * @date 2026-04-22 10:30
 */
export function RejectReasonDialog({
  open,
  onOpenChange,
  title = '拒绝申请',
  description = '请填写拒绝理由（可选）。理由会同步推送给对方，方便其了解原因。',
  confirmText = '确认拒绝',
  loading = false,
  onConfirm,
}: RejectReasonDialogProps) {
  const [reason, setReason] = useState('');

  // 每次打开重置输入
  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="例如：信息不完整 / 暂不需要此员工等"
          rows={4}
          maxLength={200}
          autoFocus
        />
        <div className="text-right text-xs text-gray-400">{reason.length}/200</div>

        <DialogFooter>
          <button
            type="button"
            disabled={loading}
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm text-gray-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void onConfirm(reason.trim())}
            className="inline-flex items-center gap-1 bg-red-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
            {confirmText}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
