'use client';

import Image from 'next/image';
import type { OrderVO } from '../api/types';

interface CheckoutSummaryProps {
  order: OrderVO;
}

/**
 * 结算摘要组件 — 展示订单商品列表和金额汇总
 */
export function CheckoutSummary({ order }: CheckoutSummaryProps) {
  return (
    <div className="space-y-4">
      {/* 商品列表 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h3 className="font-bold text-slate-800">确认商品</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {order.items?.map((item) => (
            <div key={item.id} className="px-6 py-4 flex items-center gap-4">
              <div className="w-16 h-11 rounded overflow-hidden bg-slate-100 flex-shrink-0">
                {item.productCover ? (
                  <Image
                    src={item.productCover}
                    alt={item.productTitle}
                    width={64}
                    height={44}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    暂无
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-slate-800 truncate">
                  {item.productTitle}
                </h4>
                <span className="text-xs text-slate-500">
                  {item.productTypeLabel}
                </span>
              </div>
              <div className="text-sm text-slate-600">
                ¥{item.price.toFixed(2)} x {item.quantity}
              </div>
              <div className="text-sm font-bold text-slate-800 min-w-[80px] text-right">
                ¥{item.subtotal.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 金额汇总 */}
      <div className="bg-white rounded-xl border border-slate-200 px-6 py-4">
        <div className="flex justify-between items-center text-sm text-slate-600 mb-2">
          <span>商品总价</span>
          <span>¥{order.totalAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
          <span className="text-base font-medium text-slate-800">应付金额</span>
          <span className="text-2xl font-bold text-primary">
            ¥{order.payAmount.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
