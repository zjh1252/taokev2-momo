'use client';

import { AlarmClock } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getOrderProductTitle } from '../utils/order-helpers';
import type { OrderVO } from '../api/types';

interface PendingOrderReminderDialogProps {
  open: boolean;
  order: OrderVO | null;
  onOpenChange: (open: boolean) => void;
  /** 用户选择继续购买时回调 */
  onContinue?: () => void;
}

/**
 * 购买前待支付订单提醒 — 引导用户前往「我的订单-待支付」或继续下单
 */
export function PendingOrderReminderDialog({
  open,
  order,
  onOpenChange,
  onContinue,
}: PendingOrderReminderDialogProps) {
  const router = useRouter();

  if (!order) return null;

  const productTitle = getOrderProductTitle(order);

  const goPendingOrders = () => {
    onOpenChange(false);
    router.push(`${ROUTES.UC_ORDERS}?tab=pending`);
  };

  const goCheckout = () => {
    onOpenChange(false);
    router.push(`/checkout?orderNo=${order.orderNo}`);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-amber-50 text-amber-600">
            <AlarmClock />
          </AlertDialogMedia>
          <AlertDialogTitle>您有一笔待支付订单</AlertDialogTitle>
          <AlertDialogDescription
            render={<div />}
            className="text-left space-y-2 text-sm text-muted-foreground"
          >
            <p>
              「{productTitle}」已有未支付订单，订单号{' '}
              <span className="font-mono text-foreground">{order.orderNo}</span>
              ，应付{' '}
              <span className="text-primary font-semibold">
                ¥{order.payAmount.toFixed(2)}
              </span>
              。
            </p>
            <p className="text-amber-700">
              请在 10 分钟内完成支付，超时订单将自动关闭。您可前往「我的订单」待支付列表继续付款。
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:flex-col sm:items-stretch gap-2">
          <AlertDialogAction
            type="button"
            onClick={goPendingOrders}
            className="w-full"
          >
            前往待支付订单
          </AlertDialogAction>
          <AlertDialogAction
            type="button"
            variant="outline"
            onClick={goCheckout}
            className="w-full"
          >
            立即支付该订单
          </AlertDialogAction>
          {onContinue ? (
            <AlertDialogCancel
              type="button"
              onClick={() => {
                onOpenChange(false);
                onContinue();
              }}
              className="w-full"
            >
              继续购买（新建订单）
            </AlertDialogCancel>
          ) : (
            <AlertDialogCancel type="button" className="w-full">
              我知道了
            </AlertDialogCancel>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
