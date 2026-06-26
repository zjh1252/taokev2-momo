'use client';

import { useEffect, useState, useMemo } from 'react';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '@/features/cart/hooks/useCart';
import { CartItemCard, CART_TABLE_GRID, CART_TITLE_OFFSET, cartLineTotal } from '@/features/cart/components/CartItemCard';
import { createOrder } from '@/features/order/api/service';
import { useRouter } from '@/i18n/navigation';
import { toast } from 'sonner';

/**
 * 购物车页面
 */
export default function CartPage() {
  const { items, loading, refreshItems, updateQuantity, removeItem, clearAll } =
    useCart();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const router = useRouter();

  useEffect(() => {
    refreshItems();
  }, [refreshItems]);

  // 默认全选
  useEffect(() => {
    setSelectedIds(new Set(items.map((item) => item.id)));
  }, [items]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item.id)));
    }
  };

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds],
  );

  const totalAmount = useMemo(
    () => selectedItems.reduce((sum, item) => sum + cartLineTotal(item), 0),
    [selectedItems],
  );

  const handleCheckout = async () => {
    if (selectedItems.length === 0) {
      toast.error('请选择要结算的商品');
      return;
    }
    try {
      const order = await createOrder({
        cartItemIds: selectedItems.map((item) => item.id),
      });
      router.push(`/checkout?orderNo=${order.orderNo}`);
    } catch {
      // 错误已弹出
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart className="size-6 text-primary" />
        <h1 className="text-2xl font-bold text-slate-800">购物车</h1>
        <span className="text-slate-500 text-sm">
          ({items.length} 件商品)
        </span>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500">加载中...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingCart className="size-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg">购物车是空的</p>
          <p className="text-slate-400 text-sm mt-2">
            去课程列表看看吧
          </p>
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-red-500 transition-colors"
            >
              <Trash2 className="size-3.5" />
              清空购物车
            </button>
          </div>

          <div className="rounded-lg border border-slate-200 overflow-hidden">
            {/* 表头 */}
            <div
              className={`${CART_TABLE_GRID} py-3 bg-slate-50 border-b border-slate-200 text-sm text-slate-500`}
            >
              <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={selectedIds.size === items.length && items.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                />
                全选
              </label>
              <div className="flex items-center gap-3 min-w-0">
                <span className={CART_TITLE_OFFSET} aria-hidden />
                <span>标题</span>
              </div>
              <span className="text-right">价格</span>
              <span className="text-center">购买数量</span>
              <span className="text-right">总价</span>
              <span className="text-center">操作</span>
            </div>

            {/* 商品列表 */}
            <div className="divide-y divide-slate-200">
              {items.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  selected={selectedIds.has(item.id)}
                  onToggleSelect={toggleSelect}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>
          </div>

          {/* 底部结算栏 */}
          <div className="mt-6 flex items-center justify-between p-5 bg-white rounded-lg border border-slate-200 shadow-sm sticky bottom-4">
            <div className="text-sm text-slate-600">
              已选 <span className="font-bold text-primary">{selectedItems.length}</span> 件商品
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-sm text-slate-500">合计：</span>
                <span className="text-2xl font-bold text-primary">
                  ¥{totalAmount.toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={selectedItems.length === 0}
                className="px-8 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                去结算
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
