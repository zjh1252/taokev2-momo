'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

/** 培训宝智能客服嵌入地址（可用 NEXT_PUBLIC_SMARTCS_CHAT_URL 覆盖为本地联调） */
export const CUSTOMER_SERVICE_CHAT_URL =
  process.env.NEXT_PUBLIC_SMARTCS_CHAT_URL ||
  'https://tk-service.taoke.com/chat-box?collection=tkw';

interface CustomerServiceChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** lg 以下走底部抽屉；与全站移动端断点对齐 */
const MOBILE_MQ = '(max-width: 1023px)';

function useIsMobileCs() {
  const [mobile, setMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  return mobile;
}

function buildChatSrc(isMobile: boolean) {
  try {
    const url = new URL(CUSTOMER_SERVICE_CHAT_URL, typeof window !== 'undefined' ? window.location.origin : 'https://tk-service.taoke.com');
    // 提示嵌入页按窄屏渲染（chat-box 自身有 max-width:767 样式）
    url.searchParams.set('embed', '1');
    if (isMobile) {
      url.searchParams.set('mobile', '1');
    } else {
      url.searchParams.delete('mobile');
    }
    return url.toString();
  } catch {
    return CUSTOMER_SERVICE_CHAT_URL;
  }
}

/**
 * 培训宝智能客服弹窗（iframe 嵌入）
 *
 * <ul>
 *   <li>PC：居中模态，宽 min(92vw,880)、高 min(92vh,860)</li>
 *   <li>移动端：底部抽屉，宽 100%、高约 80dvh，禁止复用居中小弹窗</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-05-22 10:30
 */
export function CustomerServiceChatDialog({
  open,
  onOpenChange,
}: CustomerServiceChatDialogProps) {
  const isMobile = useIsMobileCs();
  const chatSrc = useMemo(
    () => buildChatSrc(isMobile === true),
    [isMobile],
  );

  // 打开时锁定页面滚动，避免弹层触发横向白边
  useEffect(() => {
    if (!open) return;
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [open]);

  // 尚未判定端型时不渲染，避免首帧 PC 居中弹窗闪到手机上
  if (isMobile === null) {
    return null;
  }

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="data-[side=bottom]:!h-[min(80dvh,80vh)] flex !h-[min(80dvh,80vh)] max-h-[min(80dvh,80vh)] w-full max-w-full flex-col gap-0 overflow-hidden rounded-t-2xl border-0 p-0 sm:max-w-full"
        >
          <SheetHeader className="flex h-12 shrink-0 flex-row items-center justify-between space-y-0 border-b border-slate-100 bg-white px-4 py-0 text-left">
            <SheetTitle className="text-base font-semibold text-slate-900">
              淘课网客服
            </SheetTitle>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex size-10 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              aria-label="关闭客服"
            >
              <X className="size-5" />
            </button>
          </SheetHeader>
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
            {open ? (
              <iframe
                title="淘课网客服"
                src={chatSrc}
                className="h-full w-full max-w-full border-0"
                allow="microphone; clipboard-write"
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex h-[min(860px,92vh)] w-[min(92vw,880px)] max-w-[min(92vw,880px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(92vw,880px)]"
      >
        <DialogTitle className="sr-only">淘课网客服</DialogTitle>
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          {open ? (
            <iframe
              title="淘课网客服"
              src={chatSrc}
              className="h-full w-full max-w-full border-0"
              allow="microphone; clipboard-write"
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
