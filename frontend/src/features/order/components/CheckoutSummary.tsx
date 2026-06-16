'use client';

import { SafeImage } from '@/components/safe-image';
import { resolveImageSrc, DEFAULT_VIDEO_COVER } from '@/lib/media';
import { isVideoOrder } from '../utils/order-helpers';
import type { OrderVO } from '../api/types';

interface CheckoutSummaryProps {
  order: OrderVO;
}

/**
 * 结算摘要组件 — 展示订单商品列表和金额汇总
 */
export function CheckoutSummary({ order }: CheckoutSummaryProps) {
  const videoOrder = isVideoOrder(order);

  return (
    <div className="space-y-4">
      {/* 商品列表 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {videoOrder ? (
          <>
            <div className="hidden sm:grid grid-cols-[1fr_100px_100px_100px] px-6 py-3 bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-600">
              <span>视频名称</span>
              <span className="text-center">单价</span>
              <span className="text-center">报名人数</span>
              <span className="text-right">小计</span>
            </div>
            <div className="divide-y divide-slate-100">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="px-6 py-4 grid grid-cols-1 sm:grid-cols-[1fr_100px_100px_100px] gap-3 sm:gap-4 sm:items-center"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative w-20 h-14 rounded overflow-hidden bg-slate-100 flex-shrink-0">
                      <SafeImage
                        src={resolveImageSrc(item.productCover, '') || undefined}
                        alt={item.productTitle}
                        fill
                        className="object-cover"
                        fallback={DEFAULT_VIDEO_COVER}
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium text-slate-800 line-clamp-2">
                        {item.productTitle}
                      </h4>
                      <span className="text-xs text-slate-500">{item.productTypeLabel}</span>
                    </div>
                  </div>
                  <div className="sm:text-center text-sm text-slate-700">
                    <span className="sm:hidden text-slate-500 mr-2">单价</span>
                    ¥{item.price.toFixed(2)}
                  </div>
                  <div className="sm:text-center text-sm text-slate-700">
                    <span className="sm:hidden text-slate-500 mr-2">报名人数</span>
                    {item.quantity}
                  </div>
                  <div className="sm:text-right text-sm font-bold text-slate-800">
                    <span className="sm:hidden text-slate-500 mr-2 font-normal">小计</span>
                    ¥{item.subtotal.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">确认商品</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {order.items?.map((item) => (
                <div key={item.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="relative w-16 h-11 rounded overflow-hidden bg-slate-100 flex-shrink-0">
                    <SafeImage
                      src={resolveImageSrc(item.productCover, '') || undefined}
                      alt={item.productTitle}
                      fill
                      className="object-cover"
                      fallback={DEFAULT_VIDEO_COVER}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-800 truncate">
                      {item.productTitle}
                    </h4>
                    <span className="text-xs text-slate-500">{item.productTypeLabel}</span>
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
          </>
        )}
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
