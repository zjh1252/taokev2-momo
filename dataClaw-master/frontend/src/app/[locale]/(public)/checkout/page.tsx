'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { getOrderDetail } from '@/features/order/api/service';
import { CheckoutSummary } from '@/features/order/components/CheckoutSummary';
import { PaymentModal } from '@/features/order/components/PaymentModal';
import { useRouter } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import type { OrderVO, PayResultVO } from '@/features/order/api/types';

/**
 * 结算确认页
 *
 * 从购物车或直接购买创建订单后跳转到此页面，展示订单摘要并发起支付。
 */
export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const orderNo = searchParams.get('orderNo');
  const router = useRouter();

  const [order, setOrder] = useState<OrderVO | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);

  useEffect(() => {
    if (!orderNo) return;
    setLoading(true);
    getOrderDetail(orderNo)
      .then(setOrder)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderNo]);

  const handlePaySuccess = (_result: PayResultVO) => {
    setShowPayModal(false);
    router.push(ROUTES.UC_ORDERS);
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck className="size-6 text-primary" />
        <h1 className="text-2xl font-bold text-slate-800">确认订单</h1>
      </div>

      <CheckoutSummary order={order} />

      {/* 提交支付 */}
      {order.status === 0 && (
        <div className="mt-6 flex justify-end">
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
        <div className="mt-6 text-center text-green-600 font-medium text-lg">
          该订单已支付
        </div>
      )}

      {showPayModal && (
        <PaymentModal
          orderNo={order.orderNo}
          amount={order.payAmount}
          onClose={() => setShowPayModal(false)}
          onSuccess={handlePaySuccess}
        />
      )}
    </div>
  );
}
