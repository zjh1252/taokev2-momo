'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, ShoppingBag } from 'lucide-react';
import { getOrders, cancelOrder } from '@/features/order/api/service';
import { OrderCard } from '@/features/order/components/OrderCard';
import { PaymentModal } from '@/features/order/components/PaymentModal';
import { toast } from 'sonner';
import type { OrderVO, PayResultVO } from '@/features/order/api/types';

type OrderTab = 'all' | 'pending' | 'paid' | 'cancelled' | 'expired';

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
  const [tab, setTab] = useState<OrderTab>('all');
  const [orders, setOrders] = useState<OrderVO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [payingOrderNo, setPayingOrderNo] = useState<string | null>(null);

  const currentStatus = TABS.find((t) => t.key === tab)?.status;
  const payingOrder = orders.find((o) => o.orderNo === payingOrderNo);

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

  // 切换 tab 时重置页码
  useEffect(() => {
    setPage(1);
  }, [tab]);

  const handleCancel = async (orderNo: string) => {
    try {
      await cancelOrder(orderNo);
      toast.success('订单已取消');
      await fetchOrders();
    } catch {
      // 错误已弹出
    }
  };

  const handlePaySuccess = (_result: PayResultVO) => {
    setPayingOrderNo(null);
    toast.success('支付成功');
    fetchOrders();
  };

  // 筛选搜索
  const filteredOrders = search
    ? orders.filter((o) => o.orderNo.includes(search))
    : orders;

  const pendingCount = orders.filter((o) => o.status === 0).length;

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
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
            placeholder="输入订单号搜索"
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
            <p className="text-slate-500">暂无订单</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onPay={(orderNo) => setPayingOrderNo(orderNo)}
                onCancel={handleCancel}
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
      {payingOrderNo && payingOrder && (
        <PaymentModal
          orderNo={payingOrderNo}
          amount={payingOrder.payAmount}
          onClose={() => setPayingOrderNo(null)}
          onSuccess={handlePaySuccess}
        />
      )}
    </section>
  );
}
