'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

/** 培训宝智能客服嵌入地址 */
export const CUSTOMER_SERVICE_CHAT_URL =
  'https://tk-service.taoke.com/chat-box?collection=tkw';

interface CustomerServiceChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 培训宝智能客服弹窗（iframe 嵌入）。
 * PC 外壳宽 min(92vw, 560px)、高 620；小于 md 断点保持原 400 宽逻辑。iframe 内部样式不在此改。
 *
 * @author Fangxinxin
 * @date 2026-07-29 16:45
 */
export function CustomerServiceChatDialog({
  open,
  onOpenChange,
}: CustomerServiceChatDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[min(640px,85vh)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[400px] md:h-[min(620px,85vh)] md:w-[min(92vw,560px)] md:max-w-[min(92vw,560px)]"
        showCloseButton
      >
        <DialogTitle className="sr-only">培训宝智能客服</DialogTitle>
        <iframe
          title="培训宝智能客服"
          src={CUSTOMER_SERVICE_CHAT_URL}
          className="min-h-[480px] w-full flex-1 border-0"
          allow="microphone; clipboard-write"
        />
      </DialogContent>
    </Dialog>
  );
}
