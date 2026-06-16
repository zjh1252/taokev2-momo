'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Search, ShoppingBag } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { getOrders, cancelOrder, createOrder, getPendingOrderByProduct } from '@/features/order/api/service';
import { OrderCard } from '@/features/order/components/OrderCard';
import { PaymentModal } from '@/features/order/components/PaymentModal';
import { PendingOrderReminderDialog } from '@/features/order/components/PendingOrderReminderDialog';
import { getOrderProductTitle } from '@/features/order/utils/order-helpers';
import { toast } from 'sonner';
import type { OrderVO, PayResultVO } from '@/features/order/api/types';

type OrderTab = 'all' | 'pending' | 'paid' | 'cancelled' | 'expired';

const VALID_TABS = new Set<OrderTab>(['all', 'pending', 'paid', 'cancelled', 'expired']);

function parseOrderTab(value: string | null): OrderTab {
  if (value && VALID_TABS.has(value as OrderTab)) {
    return value as OrderTab;
  }
  return 'all';
}

const TABS: { key: OrderTab; label: string; status?: number }[] = [
  { key: 'all', label: '全部订单' },
  { key: 'pending', label: '待支付', status: 0 },
  { key: 'paid', label: '已完成', status: 1 },
  { key: 'cancelled', label: '已取消', status: 2 },
  { key: 'expired', label: '已过期', status: 4 },
];

/**
 * 我的订单页 — 对接真实订单 API
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
export default function OrdersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paidSuccess = searchParams.get('paid') === '1';
  const watchVideoId = searchParams.get('watchVideo');
  const tabFromUrl = searchParams.get('tab');

  const [tab, setTab] = useState<OrderTab>(() => parseOrderTab(tabFromUrl));
  const [orders, setOrders] = useState<OrderVO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [payingOrder, setPayingOrder] = useState<OrderVO | null>(null);
  const [showPaidBanner, setShowPaidBanner] = useState(paidSuccess);
  const [pendingReminderOrder, setPendingReminderOrder] = useState<OrderVO | null>(null);
  const [pendingDialogOpen, setPendingDialogOpen] = useState(false);
  const [rebuyPayload, setRebuyPayload] = useState<{
    productType: OrderVO['items'][0]['productType'];
    productId: number;
    quantity: number;
  } | null>(null);

  const currentStatus = TABS.find((t) => t.key === tab)?.status;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOrders({
        status: currentStatus,
        page,
        size: 15,
      });
      setOrders(res.list);
      setTotal(res.total);
    } catch {
      // 错误已弹出
    } finally {
      setLoading(false);
    }
  }, [currentStatus, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setPage(1);
  }, [tab]);

  useEffect(() => {
    if (paidSuccess) {
      setShowPaidBanner(true);
      setTab('paid');
    }
  }, [paidSuccess]);

  useEffect(() => {
    if (tabFromUrl) {
      setTab(parseOrderTab(tabFromUrl));
    }
  }, [tabFromUrl]);

  const handleCancel = async (orderNo: string) => {
    try {
      await cancelOrder(orderNo);
      toast.success('订单已取消');
      await fetchOrders();
    } catch {
      // 错误已弹出
    }
  };

  const submitRebuyOrder = async (payload: NonNullable<typeof rebuyPayload>) => {
    const newOrder = await createOrder({
      directItem: {
        productType: payload.productType,
        productId: payload.productId,
        quantity: payload.quantity,
      },
    });
    setPayingOrder(newOrder);
    await fetchOrders();
  };

  /** 再次购买 / 续费一年：按原订单商品重新下单并发起支付 */
  const handleRebuy = async (order: OrderVO) => {
    const firstItem = order.items?.[0];
    if (!firstItem) {
      toast.error('订单商品信息缺失，无法购买');
      return;
    }
    const payload = {
      productType: firstItem.productType,
      productId: firstItem.productId,
      quantity: firstItem.quantity,
    };
    try {
      const existing = await getPendingOrderByProduct(
        payload.productType,
        payload.productId,
      );
      if (existing) {
        setRebuyPayload(payload);
        setPendingReminderOrder(existing);
        setPendingDialogOpen(true);
        return;
      }
      await submitRebuyOrder(payload);
    } catch {
      // 错误已弹出
    }
  };

  const handleRebuyContinue = async () => {
    if (!rebuyPayload) return;
    try {
      await submitRebuyOrder(rebuyPayload);
    } catch {
      // 错误已弹出
    }
  };

  const handleInvoice = (order: OrderVO) => {
    router.push(`${ROUTES.UC_ORDERS_INVOICE}?orderNo=${order.orderNo}`);
  };

  const handlePaySuccess = (_result: PayResultVO) => {
    setPayingOrder(null);
    toast.success('支付成功');
    fetchOrders();
  };

  // 按商品标题搜索（视频/课程名称），同时兼容订单号
  const filteredOrders = search
    ? orders.filter(
        (o) =>
          (o.items || []).some((item) =>
            (item.productTitle || '').toLowerCase().includes(search.toLowerCase()),
          ) || o.orderNo.includes(search),
      )
    : orders;

  const pendingCount = orders.filter((o) => o.status === 0).length;

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
      {showPaidBanner && (
        <div className="mx-6 mt-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <CheckCircle className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-green-800">支付成功</p>
            <p className="text-sm text-green-700 mt-0.5">
              您已成功购买录播课，可在下方订单中查看详情。
              {watchVideoId && (
                <>
                  {' '}
                  <Link
                    href={`/videos/${watchVideoId}/play`}
                    className="font-medium underline hover:text-green-900"
                  >
                    立即前往观看录播课
                  </Link>
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPaidBanner(false)}
            className="text-green-600 hover:text-green-800 text-sm flex-shrink-0"
          >
            关闭
          </button>
        </div>
      )}

      {/* Tab 栏 */}
      <div className="px-6 border-b border-slate-200 flex justify-between items-center">
        <div className="flex gap-8">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`py-4 text-[15px] ${
                tab === t.key
                  ? 'text-primary font-bold border-b-2 border-primary'
                  : 'text-gray-500 font-medium'
              }`}
            >
              {t.label}
              {t.key === 'pending' && pendingCount > 0 && (
                <span className="text-primary text-xs ml-1">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="输入视频标题搜索"
            className="border border-slate-300 rounded-md pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-48"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 size-[18px] cursor-pointer hover:text-primary" />
        </div>
      </div>

      {/* 订单列表 */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-16 text-slate-500">加载中...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="size-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">
              没有找到订单购买记录，
              <Link href={ROUTES.VIDEOS} className="text-primary hover:underline">
                找我喜欢的视频
              </Link>
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onPay={setPayingOrder}
                onCancel={handleCancel}
                onRebuy={handleRebuy}
                onInvoice={handleInvoice}
                onCountdownExpire={fetchOrders}
              />
            ))}
          </div>
        )}

        {/* 简易分页 */}
        {total > 15 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 border rounded text-sm disabled:opacity-50 hover:border-primary hover:text-primary transition-colors"
            >
              上一页
            </button>
            <span className="px-3 py-1.5 text-sm text-slate-600">
              第 {page} 页
            </span>
            <button
              type="button"
              disabled={page * 15 >= total}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 border rounded text-sm disabled:opacity-50 hover:border-primary hover:text-primary transition-colors"
            >
              下一页
            </button>
          </div>
        )}
      </div>

      {/* 支付弹窗 */}
      {payingOrder && (
        <PaymentModal
          orderNo={payingOrder.orderNo}
          amount={payingOrder.payAmount}
          productTitle={getOrderProductTitle(payingOrder)}
          onClose={() => setPayingOrder(null)}
          onSuccess={handlePaySuccess}
        />
      )}

      <PendingOrderReminderDialog
        open={pendingDialogOpen}
        order={pendingReminderOrder}
        onOpenChange={setPendingDialogOpen}
        onContinue={handleRebuyContinue}
      />
    </section>
  );
}
