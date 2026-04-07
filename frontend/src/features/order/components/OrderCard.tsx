'use client';

import Image from 'next/image';
import type { OrderVO } from '../api/types';

interface OrderCardProps {
  order: OrderVO;
  onPay?: (orderNo: string) => void;
  onCancel?: (orderNo: string) => void;
}

const STATUS_COLORS: Record<number, string> = {
  0: 'text-primary',
  1: 'text-green-600',
  2: 'text-slate-400',
  3: 'text-orange-500',
  4: 'text-slate-400',
};

function formatTime(dateStr: string | null) {
  if (!dateStr) return '';
  return dateStr.replace('T', ' ').slice(0, 16);
}

/**
 * 订单卡片 — 展示订单概要，支持操作按钮
 */
export function OrderCard({ order, onPay, onCancel }: OrderCardProps) {
  const firstItem = order.items?.[0];
  const moreCount = (order.items?.length || 0) - 1;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* 头部 */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center text-sm">
        <div className="text-gray-500">
          订单号：{order.orderNo}
          <span className="mx-2">|</span>
          {formatTime(order.createdAt)}
        </div>
        <div className={`font-medium ${STATUS_COLORS[order.status] || 'text-slate-600'}`}>
          {order.statusLabel}
        </div>
      </div>

      {/* 内容 */}
      <div className="p-4 flex items-center gap-4">
        {/* 商品封面 */}
        <div className="w-[120px] h-[80px] rounded overflow-hidden bg-slate-100 flex-shrink-0">
          {firstItem?.productCover ? (
            <Image
              src={firstItem.productCover}
              alt={firstItem.productTitle}
              width={120}
              height={80}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
              暂无图片
            </div>
          )}
        </div>

        {/* 商品信息 */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-800 mb-1 truncate">
            {firstItem?.productTitle || '订单商品'}
          </h3>
          <div className="text-xs text-gray-500">
            {firstItem && (
              <>
                <span className="px-1.5 py-0.5 bg-slate-100 rounded mr-2">
                  {firstItem.productTypeLabel}
                </span>
                单价：¥{firstItem.price.toFixed(2)} x {firstItem.quantity}
              </>
            )}
            {moreCount > 0 && (
              <span className="ml-2 text-slate-400">
                等 {moreCount + 1} 件商品
              </span>
            )}
          </div>
        </div>

        {/* 金额与操作 */}
        <div className="text-right border-l border-slate-100 pl-6 ml-6 min-w-[150px]">
          <div className="text-xs text-gray-500 mb-1">实付款</div>
          <div className="text-xl font-bold text-gray-900 mb-3">
            ¥{order.payAmount.toFixed(2)}
          </div>
          <div className="flex flex-col gap-2">
            {order.status === 0 && onPay && (
              <button
                type="button"
                onClick={() => onPay(order.orderNo)}
                className="bg-primary hover:bg-primary/90 text-white px-4 py-1.5 rounded text-sm transition-colors"
              >
                立即支付
              </button>
            )}
            {order.status === 0 && onCancel && (
              <button
                type="button"
                onClick={() => onCancel(order.orderNo)}
                className="text-gray-500 hover:text-gray-800 text-xs"
              >
                取消订单
              </button>
            )}
            {order.status === 1 && (
              <span className="text-green-600 text-sm font-medium">
                交易完成
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
