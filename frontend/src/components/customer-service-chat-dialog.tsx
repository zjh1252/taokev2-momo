'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

/** 培训宝智能客服嵌入地址（可用 NEXT_PUBLIC_SMARTCS_CHAT_URL 覆盖为本地联调） */
export const CUSTOMER_SERVICE_CHAT_URL =
  process.env.NEXT_PUBLIC_SMARTCS_CHAT_URL ||
  'https://tk-service.taoke.com/chat-box?collection=tkw';

interface CustomerServiceChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function useIsMobileCs(breakpoint = 768) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [breakpoint]);
  return mobile;
}

/**
 * 培训宝智能客服弹窗（iframe 嵌入）
 *
 * PC：宽 min(92vw,880)、最大高 860；移动端底部拉起 100%×90vh。
 *
 * DialogContent 默认含 `sm:max-w-sm`（~384px）。tailwind-merge 不会用无
 * breakpoint 的 max-w 覆盖它，甚至 `sm:!max-w-[880px]` 也可能与 `sm:max-w-sm`
 * 并存。因此尺寸用 inline style 强制生效（仅本客服弹窗）。
 *
 * @author Fangxinxin
 * @date 2026-05-22 10:30
 */
export function CustomerServiceChatDialog({
  open,
  onOpenChange,
}: CustomerServiceChatDialogProps) {
  const isMobile = useIsMobileCs(768);

  const sizeStyle = isMobile
    ? {
        width: '100%',
        maxWidth: '100vw',
        height: '80svh',
        maxHeight: '80svh',
        top: 'auto',
        bottom: 0,
        left: 0,
        right: 0,
        transform: 'none',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      }
    : {
        width: 'min(92vw, 880px)',
        maxWidth: '880px',
        height: 'min(860px, 92vh)',
        maxHeight: '860px',
      };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex flex-col gap-0 overflow-hidden p-0 sm:!max-w-[880px]"
        style={sizeStyle}
        showCloseButton={!isMobile}
      >
        {isMobile ? (
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4">
            <DialogTitle className="text-base font-semibold text-slate-900">
              淘课网客服
            </DialogTitle>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex size-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              aria-label="关闭客服"
            >
              <X className="size-5" />
            </button>
          </div>
        ) : (
          <DialogTitle className="sr-only">培训宝智能客服</DialogTitle>
        )}
        <iframe
          title="淘课网客服"
          src={CUSTOMER_SERVICE_CHAT_URL}
          className="min-h-0 w-full flex-1 border-0"
          allow="microphone; clipboard-write"
        />
      </DialogContent>
    </Dialog>
  );
}
