'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlarmClock, ShieldCheck, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getOrderDetail, cancelOrder } from '@/features/order/api/service';
import { CheckoutSummary } from '@/features/order/components/CheckoutSummary';
import { PaymentModal } from '@/features/order/components/PaymentModal';
import {
  useOrderCountdown,
  formatCountdown,
} from '@/features/order/hooks/useOrderCountdown';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import {
  getOrderProductTitle,
  getWatchVideoIdFromOrder,
} from '@/features/order/utils/order-helpers';
import { notifyOrderPurchase } from '@/features/course/api/service';
import { CourseReserveSuccessDialog } from '@/features/course/components/detail/CourseReserveSuccessDialog';
import type { OrderVO, PayResultVO } from '@/features/order/api/types';

/**
 * 结算确认页
 *
 * 从购物车或直接购买创建订单后跳转到此页面，展示订单摘要并发起支付。
 * 未支付订单 10 分钟内有效，页面展示倒计时；可直接取消订单。
 */
export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const orderNo = searchParams.get('orderNo');
  const watchVideoParam = searchParams.get('watchVideo');
  const router = useRouter();

  const [order, setOrder] = useState<OrderVO | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reserveSuccessOpen, setReserveSuccessOpen] = useState(false);
  const [notifyState, setNotifyState] = useState<'idle' | 'sending' | 'ok' | 'fail'>('idle');
  const syncedNotifyRef = useRef<string | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const syncPurchaseNotify = useCallback(async (current: OrderVO): Promise<boolean> => {
    if (!current.items?.length) return false;
    // 等一拍，避免 Suspense/首屏未 commit 时更新 state
    await Promise.resolve();
    if (!mountedRef.current) return false;
    setNotifyState('sending');
    try {
      await notifyOrderPurchase(current.orderNo);
      if (!mountedRef.current) return false;
      setNotifyState('ok');
      return true;
    } catch {
      if (!mountedRef.current) return false;
      setNotifyState('fail');
      toast.error('购买通知发送失败，请点击重试或刷新本页');
      return false;
    }
  }, []);

  const refreshOrder = useCallback(() => {
    if (!orderNo || !mountedRef.current) return;
    getOrderDetail(orderNo)
      .then((data) => {
        if (mountedRef.current) setOrder(data);
      })
      .catch(() => {});
  }, [orderNo]);

  useEffect(() => {
    if (!orderNo) return;
    let cancelled = false;
    setLoading(true);
    getOrderDetail(orderNo)
      .then((data) => {
        if (!cancelled) setOrder(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderNo]);

  // 已支付订单：页面加载完成后再补发购买通知（避免未挂载 setState）
  useEffect(() => {
    if (loading) return;
    if (!order || order.status !== 1) return;
    if (syncedNotifyRef.current === order.orderNo) return;
    if (!order.items?.length) return;
    syncedNotifyRef.current = order.orderNo;
    void syncPurchaseNotify(order);
  }, [order, loading, syncPurchaseNotify]);

  // 待支付订单倒计时；归零后重新拉取订单状态（后端定时任务会关闭超时订单）
  const isPending = order?.status === 0;
  const remaining = useOrderCountdown(
    isPending ? order?.expiredAt : null,
    refreshOrder,
  );
  const timedOut = isPending && remaining <= 0;
  const urgent = remaining > 0 && remaining <= 60_000;

  const handlePaySuccess = async (_result: PayResultVO) => {
    setShowPayModal(false);
    if (!order) {
      router.push(ROUTES.UC_ORDERS);
      return;
    }

    syncedNotifyRef.current = order.orderNo;
    const notified = await syncPurchaseNotify(order);
    const hasOpenCourse = order.items.some((item) => item.productType === 'OPEN_COURSE');
    if (notified && hasOpenCourse) {
      setReserveSuccessOpen(true);
      return;
    }

    const watchVideoId =
      getWatchVideoIdFromOrder(order) ??
      (watchVideoParam ? Number(watchVideoParam) : undefined);
    const params = new URLSearchParams({ paid: '1' });
    if (watchVideoId && !Number.isNaN(watchVideoId)) {
      params.set('watchVideo', String(watchVideoId));
    }
    router.push(`${ROUTES.UC_ORDERS}?${params.toString()}`);
  };

  const handleCancel = async () => {
    if (!order || cancelling) return;
    setCancelling(true);
    try {
      await cancelOrder(order.orderNo);
      toast.success('订单已取消');
      router.push(ROUTES.UC_ORDERS);
    } catch {
      // 错误已弹出
    } finally {
      setCancelling(false);
    }
  };

  if (!orderNo) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-slate-500">
        缺少订单编号
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-slate-500">
        加载中...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-slate-500">
        订单不存在
      </div>
    );
  }

  const productTitle = getOrderProductTitle(order);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck className="size-6 text-primary" />
        <h1 className="text-2xl font-bold text-slate-800">确认订单信息</h1>
      </div>

      {/* 待支付倒计时横幅 — 制造紧迫感 */}
      {isPending && !timedOut && (
        <div
          className={`mb-6 rounded-lg px-5 py-4 flex items-center justify-between text-white shadow-lg bg-gradient-to-r ${
            urgent ? 'from-red-600 to-red-500 animate-pulse' : 'from-red-500 to-orange-500'
          }`}
        >
          <div className="flex items-center gap-3">
            <AlarmClock className="size-7 animate-pulse" />
            <div>
              <p className="font-bold text-base">订单已为您锁定，请尽快完成支付</p>
              <p className="text-xs text-white/85 mt-0.5">
                超时未支付，订单将自动取消，优惠与名额不予保留
              </p>
            </div>
          </div>
          <div className="text-right shrink-0 ml-4">
            <div className="text-3xl font-bold tabular-nums leading-none">
              {formatCountdown(remaining)}
            </div>
            <div className="text-[11px] text-white/85 mt-1">后订单自动关闭</div>
          </div>
        </div>
      )}

      {/* 已超时 */}
      {timedOut && (
        <div className="mb-6 rounded-lg px-5 py-4 flex items-center gap-3 bg-slate-100 border border-slate-200 text-slate-500">
          <XCircle className="size-6 shrink-0" />
          <div>
            <p className="font-bold text-slate-600">订单已超时关闭</p>
            <p className="text-xs mt-0.5">
              支付时限已过，订单将自动取消，您可以回到课程页重新购买
            </p>
          </div>
        </div>
      )}

      <CheckoutSummary order={order} />

      {/* 提交支付 / 取消订单 */}
      {isPending && !timedOut && (
        <div className="mt-6 flex justify-end items-center gap-4">
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className="px-6 py-3 border border-slate-300 rounded-lg text-slate-600 hover:border-slate-400 hover:text-slate-800 transition-colors disabled:opacity-50"
          >
            {cancelling ? '取消中...' : '取消订单'}
          </button>
          <button
            type="button"
            onClick={() => setShowPayModal(true)}
            className="px-10 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors text-lg"
          >
            立即支付 ¥{order.payAmount.toFixed(2)}
          </button>
        </div>
      )}

      {order.status === 1 && (
        <div className="mt-6 text-center space-y-2">
          <p className="text-green-600 font-medium text-lg">该订单已支付</p>
          <div className="text-sm text-slate-600 space-y-1">
            {notifyState === 'sending' && <p>正在发送购买通知...</p>}
            {notifyState === 'ok' && (
              <p>
                购买通知已发送至
                {' '}
                <Link href={ROUTES.UC_MESSAGES} className="text-primary underline">
                  消息中心
                </Link>
              </p>
            )}
            {notifyState === 'fail' && (
              <p>
                购买通知发送失败，
                <button
                  type="button"
                  className="text-primary underline"
                  onClick={() => {
                    syncedNotifyRef.current = null;
                    void syncPurchaseNotify(order);
                  }}
                >
                  点击重试
                </button>
              </p>
            )}
          </div>
        </div>
      )}

      {(order.status === 2 || order.status === 4) && (
        <div className="mt-6 text-center text-slate-400 font-medium">
          该订单已关闭
        </div>
      )}

      {showPayModal && (
        <PaymentModal
          orderNo={order.orderNo}
          amount={order.payAmount}
          productTitle={productTitle}
          onClose={() => setShowPayModal(false)}
          onSuccess={handlePaySuccess}
        />
      )}

      <CourseReserveSuccessDialog
        open={reserveSuccessOpen}
        paid
        onClose={() => {
          setReserveSuccessOpen(false);
          router.push(ROUTES.UC_MESSAGES);
        }}
      />
    </div>
  );
}
