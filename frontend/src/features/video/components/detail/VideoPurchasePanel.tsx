'use client';

import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, ShoppingCart, MessageCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useRouter } from '@/i18n/navigation';
import type { VideoDetail } from '../../api/types';
import type { VideoPurchaseOptions } from '../../api/types';
import { getVideoPurchaseOptions } from '../../api/service';
import { useCart } from '@/features/cart/hooks/useCart';
import { createOrder, getPendingOrderByProduct } from '@/features/order/api/service';
import { PendingOrderReminderDialog } from '@/features/order/components/PendingOrderReminderDialog';
import { useVideoPlayback } from '../../context/video-playback-context';
import { useAuthGuard } from '@/lib/auth/auth-guard-context';
import type { ProductType } from '@/features/cart/api/types';
import { CustomerServiceChatDialog } from '@/components/customer-service-chat-dialog';
import { calcVideoSubtotal, formatVideoMoney } from '../../utils/purchase-pricing';

type PurchaseMode = 'single' | 'series';

interface VideoPurchasePanelProps {
  video: VideoDetail;
}

export function VideoPurchasePanel({ video }: VideoPurchasePanelProps) {
  const { addItem } = useCart();
  const router = useRouter();
  const { requireAuth } = useAuthGuard();
  const { accessible, enrolled, isFree, isOwner } = useVideoPlayback();

  const [options, setOptions] = useState<VideoPurchaseOptions | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [mode, setMode] = useState<PurchaseMode>('single');
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState('1');
  const [buyLoading, setBuyLoading] = useState(false);
  const [consultOpen, setConsultOpen] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<Awaited<ReturnType<typeof getPendingOrderByProduct>>>(null);
  const [pendingDialogOpen, setPendingDialogOpen] = useState(false);

  useEffect(() => {
    setQuantity(1);
    setQuantityInput('1');
  }, [mode]);

  useEffect(() => {
    let cancelled = false;
    setLoadingOptions(true);
    getVideoPurchaseOptions(video.id)
      .then((data) => {
        if (!cancelled) setOptions(data);
      })
      .catch(() => {
        if (!cancelled) setOptions(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingOptions(false);
      });
    return () => {
      cancelled = true;
    };
  }, [video.id]);

  const hasSeriesOption = Boolean(options?.hasSeriesOption);
  const isSeriesMode = mode === 'series' && hasSeriesOption;

  const unitPrice = useMemo(() => {
    if (isSeriesMode && options?.seriesPrice != null) {
      return Number(options.seriesPrice);
    }
    return Number(options?.singlePrice ?? video.price ?? 0);
  }, [isSeriesMode, options, video.price]);

  const quantityUnlimited = useMemo(() => {
    if (isSeriesMode) {
      if (options?.seriesQuantityUnlimited != null) {
        return options.seriesQuantityUnlimited;
      }
      const cap = Number(options?.seriesCompanyPrice ?? 0);
      return cap <= 0 || cap <= unitPrice;
    }
    if (options?.singleQuantityUnlimited != null) {
      return options.singleQuantityUnlimited;
    }
    const cap = Number(options?.singleCompanyPrice ?? 0);
    return cap <= 0 || cap <= unitPrice;
  }, [isSeriesMode, options, unitPrice]);

  const companyCap = useMemo(() => {
    if (quantityUnlimited) return 0;
    if (isSeriesMode && options?.seriesCompanyPrice != null) {
      return Number(options.seriesCompanyPrice);
    }
    return Number(options?.singleCompanyPrice ?? 0);
  }, [quantityUnlimited, isSeriesMode, options]);

  const maxQuantity = useMemo(() => {
    if (quantityUnlimited) return 0;
    if (isSeriesMode && options?.seriesMaxQuantity) {
      const qty = options.seriesMaxQuantity;
      if (qty > 0) return qty;
    }
    if (!isSeriesMode && options?.singleMaxQuantity) {
      const qty = options.singleMaxQuantity;
      if (qty > 0) return qty;
    }
    if (companyCap > 0 && unitPrice > 0) {
      return Math.max(1, Math.round(companyCap / unitPrice));
    }
    return 20;
  }, [quantityUnlimited, isSeriesMode, options, companyCap, unitPrice]);

  const subtotal = useMemo(
    () => calcVideoSubtotal(unitPrice, quantity, companyCap),
    [unitPrice, quantity, companyCap],
  );

  const productPayload = useMemo(() => {
    if (isSeriesMode && options?.seriesProductId) {
      return {
        productType: 'VIDEO_PACKAGE' as ProductType,
        productId: options.seriesProductId,
      };
    }
    return {
      productType: 'VIDEO_COURSE' as ProductType,
      productId: video.id,
    };
  }, [isSeriesMode, options?.seriesProductId, video.id]);

  const guardPurchase = () => {
    if (isOwner) {
      toast.info('不能购买自己发布的课程');
      return false;
    }
    if (isFree) {
      toast.info('该课程为免费课程，无需购买');
      return false;
    }
    if (enrolled) {
      toast.info('您已购买此课程');
      return false;
    }
    return true;
  };

  const handleAddToCart = async () => {
    if (!guardPurchase()) return;
    await addItem({ ...productPayload, quantity });
  };

  const submitOrder = async () => {
    const order = await createOrder({
      directItem: { ...productPayload, quantity },
    });
    router.push(`/checkout?orderNo=${order.orderNo}&watchVideo=${video.id}`);
  };

  const handleBuyNow = async () => {
    if (!guardPurchase()) return;
    setBuyLoading(true);
    try {
      const existing = await getPendingOrderByProduct(
        productPayload.productType,
        productPayload.productId,
      );
      if (existing) {
        setPendingOrder(existing);
        setPendingDialogOpen(true);
        return;
      }
      await submitOrder();
    } catch {
      // 错误已弹出
    } finally {
      setBuyLoading(false);
    }
  };

  const handleContinueBuy = async () => {
    setBuyLoading(true);
    try {
      await submitOrder();
    } catch {
      // 错误已弹出
    } finally {
      setBuyLoading(false);
    }
  };

  const clampQuantity = (value: number) => {
    let next = Math.floor(value);
    if (next < 1) next = 1;
    if (maxQuantity > 0 && next > maxQuantity) next = maxQuantity;
    return next;
  };

  const applyQuantity = (value: number) => {
    const next = clampQuantity(value);
    setQuantity(next);
    setQuantityInput(String(next));
  };

  const changeQuantity = (delta: number) => {
    applyQuantity(quantity + delta);
  };

  const handleQuantityInputChange = (raw: string) => {
    setQuantityInput(raw);
    if (raw === '') return;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isNaN(parsed)) {
      setQuantity(clampQuantity(parsed));
    }
  };

  const handleQuantityInputBlur = () => {
    const parsed = Number.parseInt(quantityInput, 10);
    applyQuantity(Number.isNaN(parsed) ? 1 : parsed);
  };

  if (isFree || accessible || isOwner) {
    return null;
  }

  return (
    <div className="space-y-4">
      {hasSeriesOption && options ? (
        <div className="space-y-2">
          <div className="flex items-start gap-3 text-sm">
            <span className="text-slate-500 shrink-0 pt-1.5 w-8">选择</span>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMode('single')}
                  className={`px-3 py-1.5 text-sm border rounded transition-colors ${
                    mode === 'single'
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  单门课程
                </button>
                <button
                  type="button"
                  onClick={() => setMode('series')}
                  className={`px-3 py-1.5 text-sm border rounded transition-colors ${
                    mode === 'series'
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  全系列
                </button>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                属于
                <Link href={`/video/${video.id}.htm?tab=series`} className="text-sky-600 hover:underline mx-0.5">
                  《{options.seriesPackageName}》
                </Link>
                系列共 {options.seriesVideoCount} 门课程
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex items-start gap-3 text-sm">
        <span className="text-slate-500 shrink-0 pt-1.5 w-8">人数</span>
        {quantityUnlimited ? (
          <span className="text-slate-700">不限</span>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center border border-slate-200 rounded overflow-hidden w-fit">
              <button
                type="button"
                onClick={() => changeQuantity(-1)}
                disabled={quantity <= 1}
                className="px-2.5 py-1.5 hover:bg-slate-50 disabled:opacity-40"
                aria-label="减少人数"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-12 text-center tabular-nums border-x border-slate-200">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={maxQuantity > 0 ? maxQuantity : undefined}
                  value={quantityInput}
                  onChange={(e) => handleQuantityInputChange(e.target.value)}
                  onBlur={handleQuantityInputBlur}
                  aria-label="购买人数"
                  className="w-full py-1.5 text-center tabular-nums bg-transparent outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </span>
              <button
                type="button"
                onClick={() => changeQuantity(1)}
                disabled={maxQuantity > 0 && quantity >= maxQuantity}
                className="px-2.5 py-1.5 hover:bg-slate-50 disabled:opacity-40"
                aria-label="增加人数"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              每企业最多收取
              <span className="text-primary font-medium mx-0.5">{maxQuantity}</span>
              人共计
              <span className="text-primary font-medium mx-0.5">￥{formatVideoMoney(companyCap)}</span>
              费用
            </p>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm text-slate-500">价格</span>
          <span className="text-3xl font-bold text-primary">
            ¥ {loadingOptions ? formatVideoMoney(Number(video.price)) : formatVideoMoney(unitPrice)}
          </span>
          <span className="text-xs text-slate-400">元/人/年</span>
        </div>
        {!quantityUnlimited ? (
          <p className="text-sm text-slate-600 pl-10">
            合计
            <span className="text-primary font-semibold mx-1">￥{formatVideoMoney(subtotal)}</span>
            {subtotal >= companyCap && companyCap > 0 ? (
              <span className="text-xs text-slate-400">（已达企业封顶价）</span>
            ) : null}
          </p>
        ) : null}
      </div>

      {quantityUnlimited ? (
        <button
          type="button"
          onClick={() => setConsultOpen(true)}
          className="w-full bg-primary text-white font-medium py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          <MessageCircle className="size-4" />
          联系客服购买
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => requireAuth(handleBuyNow)}
            disabled={buyLoading || loadingOptions}
            className="bg-primary text-white font-medium py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Zap className="size-4" />
            {buyLoading ? '处理中...' : '立即购买'}
          </button>
          <button
            type="button"
            onClick={() => requireAuth(handleAddToCart)}
            disabled={loadingOptions}
            className="border border-primary text-primary font-medium py-3 rounded-lg hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ShoppingCart className="size-4" />
            加入购物车
          </button>
        </div>
      )}

      <CustomerServiceChatDialog open={consultOpen} onOpenChange={setConsultOpen} />

      <PendingOrderReminderDialog
        open={pendingDialogOpen}
        order={pendingOrder}
        onOpenChange={setPendingDialogOpen}
        onContinue={handleContinueBuy}
      />
    </div>
  );
}
