'use client';

import { AlarmClock } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { SafeImage } from '@/components/safe-image';
import { DEFAULT_VIDEO_COVER } from '@/lib/media';
import type { OrderVO } from '../api/types';
import { getOrderAccessExpiry, isOrderAccessExpired } from '../utils/order-helpers';
import { useOrderCountdown, formatCountdown } from '../hooks/useOrderCountdown';

interface OrderCardProps {
  order: OrderVO;
  onPay?: (order: OrderVO) => void;
  onCancel?: (orderNo: string) => void;
  /** 再次购买 / 续费一年：基于原订单商品重新下单 */
  onRebuy?: (order: OrderVO) => void;
  onInvoice?: (order: OrderVO) => void;
  /** 待支付倒计时归零（订单超时）时回调，一般用于刷新列表 */
  onCountdownExpire?: () => void;
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

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * 订单卡片 — 展示订单概要，支持操作按钮
 *
 * 操作栏规则（录播课）：
 * - 已支付且有效期内：在线观看、申请发票
 * - 待支付：去付款、取消订单
 * - 已取消 / 已过期（未支付）：再次购买
 * - 已支付但过了一年有效期：续费一年
 */
export function OrderCard({
  order,
  onPay,
  onCancel,
  onRebuy,
  onInvoice,
  onCountdownExpire,
}: OrderCardProps) {
  const firstItem = order.items?.[0];
  const moreCount = (order.items?.length || 0) - 1;

  const accessExpiry = getOrderAccessExpiry(order);
  const accessExpired = isOrderAccessExpired(order);

  const watchVideoId =
    firstItem?.productType === 'VIDEO_COURSE' ? firstItem.productId : undefined;
  const watchHref = watchVideoId ? `/videos/${watchVideoId}/play` : '/dashboard/learning';

  const isPending = order.status === 0;
  const isPaid = order.status === 1;
  const isCancelled = order.status === 2 || order.status === 4;

  // 待支付订单倒计时（订单创建后 10 分钟内有效）
  const payRemaining = useOrderCountdown(
    isPending ? order.expiredAt : null,
    onCountdownExpire,
  );
  const payTimedOut = isPending && payRemaining <= 0;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* 头部 */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center text-sm">
        <div className="text-gray-500">
          订单号：{order.orderNo}
          <span className="mx-2">|</span>
          {formatTime(order.createdAt)}
          {accessExpiry && (
            <>
              <span className="mx-2">|</span>
              <span className={accessExpired ? 'text-orange-500' : ''}>
                课程有效期至 {formatDate(accessExpiry)}
                {accessExpired && '（已过期）'}
              </span>
            </>
          )}
        </div>
        <div className={`font-medium ${STATUS_COLORS[order.status] || 'text-slate-600'}`}>
          {order.statusLabel}
        </div>
      </div>

      {/* 内容 */}
      <div className="p-4 flex items-center gap-4">
        {/* 商品封面 */}
        <div className="relative w-[120px] h-[80px] rounded overflow-hidden bg-slate-100 flex-shrink-0">
          <SafeImage
            src={firstItem?.productCover || undefined}
            alt={firstItem?.productTitle || '订单商品'}
            fill
            className="object-cover"
            fallback={DEFAULT_VIDEO_COVER}
          />
        </div>

        {/* 商品信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 min-w-0">
            <h3 className="font-medium text-gray-800 truncate">
              {firstItem?.productTitle || '订单商品'}
            </h3>
            {firstItem?.totalEpisodes != null && firstItem.totalEpisodes > 0 && (
              <span className="shrink-0 px-1.5 py-0.5 bg-sky-50 text-sky-600 text-xs rounded">
                共{firstItem.totalEpisodes}集
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {firstItem && (
              <>
                <span className="px-1.5 py-0.5 bg-slate-100 rounded mr-2">
                  录播课
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

        {/* 金额与操作栏 */}
        <div className="text-right border-l border-slate-100 pl-6 ml-6 min-w-[150px]">
          <div className="text-xs text-gray-500 mb-1">实付款</div>
          <div className="text-xl font-bold text-gray-900 mb-3">
            ¥{order.payAmount.toFixed(2)}
          </div>
          <div className="flex flex-col gap-2 items-end">
            {/* ② 待支付：倒计时 + 去付款、取消订单 */}
            {isPending && !payTimedOut && (
              <div className="flex items-center gap-1 text-xs font-bold text-red-500 tabular-nums animate-pulse">
                <AlarmClock className="size-3.5" />
                剩 {formatCountdown(payRemaining)} 自动关闭
              </div>
            )}
            {payTimedOut && (
              <span className="text-xs text-slate-400">订单已超时，即将关闭</span>
            )}
            {isPending && !payTimedOut && onPay && (
              <button
                type="button"
                onClick={() => onPay(order)}
                className="bg-primary hover:bg-primary/90 text-white px-4 py-1.5 rounded text-sm transition-colors w-full"
              >
                去付款
              </button>
            )}
            {isPending && !payTimedOut && onCancel && (
              <button
                type="button"
                onClick={() => onCancel(order.orderNo)}
                className="text-gray-500 hover:text-gray-800 text-xs"
              >
                取消订单
              </button>
            )}

            {/* ① 已支付且有效期内：在线观看、申请发票 */}
            {isPaid && !accessExpired && (
              <>
                <Link
                  href={watchHref}
                  className="bg-primary hover:bg-primary/90 text-white px-4 py-1.5 rounded text-sm transition-colors w-full text-center"
                >
                  在线观看
                </Link>
                {onInvoice && (
                  <button
                    type="button"
                    onClick={() => onInvoice(order)}
                    className="text-gray-500 hover:text-gray-800 text-xs"
                  >
                    申请发票
                  </button>
                )}
              </>
            )}

            {/* ④ 已支付但过了一年有效期：续费一年 */}
            {isPaid && accessExpired && onRebuy && (
              <button
                type="button"
                onClick={() => onRebuy(order)}
                className="border border-primary text-primary hover:bg-red-50 px-4 py-1.5 rounded text-sm transition-colors w-full"
              >
                续费一年
              </button>
            )}

            {/* ③ 已取消 / 已过期（未支付）：再次购买 */}
            {isCancelled && onRebuy && (
              <button
                type="button"
                onClick={() => onRebuy(order)}
                className="border border-primary text-primary hover:bg-red-50 px-4 py-1.5 rounded text-sm transition-colors w-full"
              >
                再次购买
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
