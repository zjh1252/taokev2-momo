'use client';

import { useState } from 'react';
import {
  MessageSquare,
  Heart,
  Share2,
  Flame,
  PenLine,
  Eye,
  Zap,
  ShoppingCart,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import type { CourseDetail } from '../../api/types';
import { useCart } from '@/features/cart/hooks/useCart';
import { createOrder } from '@/features/order/api/service';

interface CourseSidebarProps {
  course: CourseDetail;
}

export function CourseSidebar({ course }: CourseSidebarProps) {
  const t = useTranslations('course.detail');
  const isOpen = course.type === 'OPEN_OFFLINE' || course.type === 'OPEN_ONLINE';
  const isPurchasable = isOpen && course.price > 0 && course.isFree !== 1;
  const { addItem } = useCart();
  const router = useRouter();
  const [buyLoading, setBuyLoading] = useState(false);

  const handleBuyNow = async () => {
    if (!isPurchasable) return;
    setBuyLoading(true);
    try {
      const order = await createOrder({
        directItem: { productType: 'OPEN_COURSE', productId: course.id },
      });
      router.push(`/checkout?orderNo=${order.orderNo}`);
    } catch {
      // 错误已弹出
    } finally {
      setBuyLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isPurchasable) {
      toast.info('该课程暂不支持加入购物车');
      return;
    }
    await addItem({ productType: 'OPEN_COURSE', productId: course.id });
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 sticky top-[120px] space-y-4">
      {/* 公开课显示价格 */}
      {isOpen && course.price > 0 && (
        <div className="text-center pb-4 border-b border-slate-100">
          <p className="text-sm text-slate-500 mb-1">{t('price')}</p>
          <p className="text-3xl font-bold text-red-500">
            ¥{course.price.toLocaleString()}
            {course.originalPrice > course.price && (
              <span className="text-base text-slate-400 line-through ml-2">¥{course.originalPrice.toLocaleString()}</span>
            )}
          </p>
        </div>
      )}

      {/* 购买按钮（付费公开课） */}
      {isPurchasable && (
        <>
          <button
            onClick={handleBuyNow}
            disabled={buyLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-md disabled:opacity-50"
          >
            <Zap className="size-4" />
            {buyLoading ? '处理中...' : '立即购买'}
          </button>
          <button
            onClick={handleAddToCart}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-primary text-primary font-medium text-sm hover:bg-primary/5 transition-all"
          >
            <ShoppingCart className="size-4" />
            加入购物车
          </button>
        </>
      )}

      {/* 非付费课程保留原有按钮 */}
      {!isPurchasable && (
        <button
          onClick={() => { /* TODO: 咨询/预约功能 */ }}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-md"
        >
          {isOpen ? (
            <><Zap className="size-4" /> {t('reserve')}</>
          ) : (
            <><MessageSquare className="size-4" /> {t('consult')}</>
          )}
        </button>
      )}

      {/* 收藏按钮 */}
      <button
        onClick={() => { /* TODO: 收藏功能 */ }}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-slate-200 text-slate-700 font-medium text-sm hover:border-primary hover:text-primary transition-all"
      >
        <Heart className="size-4" />
        {t('favorite')}
      </button>

      {/* 互动数据 */}
      <div className="flex items-center justify-around pt-4 border-t border-slate-100 text-xs text-slate-500">
        <button className="flex items-center gap-1 hover:text-primary transition-colors">
          <Share2 className="size-3.5" />
          {t('share')}
        </button>
        <span className="flex items-center gap-1">
          {isOpen ? <Eye className="size-3.5" /> : <Flame className="size-3.5" />}
          {isOpen ? t('views') : t('popularity')}: {course.viewCount}
        </span>
        <button className="flex items-center gap-1 hover:text-primary transition-colors">
          <PenLine className="size-3.5" />
          {t('review')}
        </button>
      </div>
    </div>
  );
}
