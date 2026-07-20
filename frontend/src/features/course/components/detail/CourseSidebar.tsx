'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Heart,
  Share2,
  Flame,
  PenLine,
  Eye,
  Zap,
  ShoppingCart,
  MessageCircle,
} from 'lucide-react';
import { CustomerServiceChatDialog } from '@/components/customer-service-chat-dialog';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import type { CourseDetail } from '../../api/types';
import { useCart } from '@/features/cart/hooks/useCart';
import { createOrder, getPendingOrderByProduct } from '@/features/order/api/service';
import { PendingOrderReminderDialog } from '@/features/order/components/PendingOrderReminderDialog';
import {
  addFavorite,
  removeFavorite,
  getInteractionState,
} from '@/features/interaction/api/service';
import {
  getCourseEnrollmentStatus,
  getCourseReserveStatus,
  reserveCourse,
} from '../../api/service';
import { CourseReserveSuccessDialog } from './CourseReserveSuccessDialog';
import ReviewDialog from '@/features/interaction/components/ReviewDialog';
import { useAuthGuard } from '@/lib/auth/auth-guard-context';

interface CourseSidebarProps {
  course: CourseDetail;
}

export function CourseSidebar({ course }: CourseSidebarProps) {
  const t = useTranslations('course.detail');
  const isOpen = course.type === 'OPEN_OFFLINE' || course.type === 'OPEN_ONLINE';
  const isOnlineOpen = course.type === 'OPEN_ONLINE';
  const isOfflineOpen = course.type === 'OPEN_OFFLINE';
  const isInternal = course.type === 'INTERNAL';
  const isOverdue = Boolean(course.isOverdue);
  const isFreeOnline = isOnlineOpen && course.isFree === 1;
  const isPurchasable = isOpen && course.price > 0 && course.isFree !== 1 && !isOverdue;
  const productType = isInternal ? 'INTERNAL_COURSE' : 'OPEN_COURSE';
  const { addItem } = useCart();
  const router = useRouter();
  const { requireAuth } = useAuthGuard();
  const [buyLoading, setBuyLoading] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [consultOpen, setConsultOpen] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<Awaited<ReturnType<typeof getPendingOrderByProduct>>>(null);
  const [pendingDialogOpen, setPendingDialogOpen] = useState(false);
  const [reserved, setReserved] = useState(false);
  const [reserveLoading, setReserveLoading] = useState(false);
  const [reserveSuccessOpen, setReserveSuccessOpen] = useState(false);
  const [purchased, setPurchased] = useState(false);

  const primaryPlan = course.plans?.[0];
  const planLocation = primaryPlan
    ? [primaryPlan.cityName, primaryPlan.provinceName, primaryPlan.address]
        .filter(Boolean)
        .join(' ')
    : undefined;
  const planStartDate = primaryPlan?.startTime?.slice(0, 10);

  useEffect(() => {
    getInteractionState('COURSE', course.id)
      .then((s) => setFavorited(s.favorited))
      .catch(() => {});
  }, [course.id]);

  useEffect(() => {
    if (!isFreeOnline) return;
    getCourseReserveStatus(course.id)
      .then(setReserved)
      .catch(() => {});
  }, [course.id, isFreeOnline]);

  useEffect(() => {
    if (!isPurchasable) return;
    getCourseEnrollmentStatus(course.id)
      .then(setPurchased)
      .catch(() => setPurchased(false));
  }, [course.id, isPurchasable]);

  const toggleFavorite = useCallback(async () => {
    setFavLoading(true);
    try {
      if (favorited) {
        await removeFavorite('COURSE', course.id);
        setFavorited(false);
        toast.success('已取消收藏');
      } else {
        await addFavorite('COURSE', course.id);
        setFavorited(true);
        toast.success('收藏成功');
      }
    } catch {
      // 错误提示已在 apiClient 中弹出，避免与 catch 重复 toast
    } finally {
      setFavLoading(false);
    }
  }, [favorited, course.id]);

  const submitOrder = async () => {
    const order = await createOrder({
      directItem: { productType: 'OPEN_COURSE', productId: course.id },
    });
    router.push(`/checkout?orderNo=${order.orderNo}`);
  };

  const handleBuyNow = async () => {
    if (!isPurchasable) return;
    setBuyLoading(true);
    try {
      const existing = await getPendingOrderByProduct('OPEN_COURSE', course.id);
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

  const handleAddToCart = async () => {
    if (!isPurchasable) {
      toast.info('该课程暂不支持加入购物车');
      return;
    }
    await addItem({ productType, productId: course.id });
  };

  const handleReserve = async () => {
    if (!isFreeOnline || reserved || isOverdue) return;
    setReserveLoading(true);
    try {
      await reserveCourse(course.id);
      setReserved(true);
      setReserveSuccessOpen(true);
    } catch (err) {
      if (err instanceof Error && err.message.includes('已预约')) {
        setReserved(true);
      }
    } finally {
      setReserveLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const writeText = navigator.clipboard?.writeText?.bind(navigator.clipboard);
    const copyWithSelection = () => {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.readOnly = true;
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);

      try {
        return document.execCommand('copy');
      } finally {
        document.body.removeChild(textarea);
      }
    };

    const showFallback = () => toast.warning('当前浏览器不支持自动复制，请手动复制地址栏网址');

    if (!writeText) {
      if (copyWithSelection()) {
        toast.success('已复制该页面网址');
      } else {
        showFallback();
      }
      return;
    }

    try {
      await writeText(url);
      toast.success('已复制该页面网址');
    } catch {
      if (copyWithSelection()) {
        toast.success('已复制该页面网址');
      } else {
        showFallback();
      }
    }
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
      {isPurchasable && purchased && (
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-slate-200 text-slate-500 font-bold text-sm cursor-not-allowed opacity-60"
        >
          <Zap className="size-4" />
          {t('purchased')}
        </button>
      )}
      {isPurchasable && !purchased && (
        <>
          <button
            type="button"
            onClick={() => requireAuth(handleBuyNow)}
            disabled={buyLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-md disabled:opacity-50"
          >
            <Zap className="size-4" />
            {buyLoading ? '处理中...' : '立即购买'}
          </button>
          <button
            type="button"
            onClick={() => requireAuth(handleAddToCart)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-primary text-primary font-medium text-sm hover:bg-primary/5 transition-all"
          >
            <ShoppingCart className="size-4" />
            加入购物车
          </button>
        </>
      )}

      {/* 非付费课程 — 内训课显示报名按钮，免费公开课显示预约按钮 */}
      {isInternal && !isOverdue && (
        <>
          <button
            type="button"
            onClick={() => setConsultOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-md"
          >
            <MessageCircle className="size-4" />
            联系客服购买
          </button>
          <button
            type="button"
            onClick={() => requireAuth(handleAddToCart)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-primary text-primary font-medium text-sm hover:bg-primary/5 transition-all"
          >
            <ShoppingCart className="size-4" />
            加入购物车
          </button>
        </>
      )}

      {/* 免费线上公开课 — 立即预约 */}
      {isFreeOnline && !isOverdue && (
        <button
          type="button"
          onClick={() => requireAuth(handleReserve)}
          disabled={reserveLoading || reserved}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all shadow-md ${
            reserved
              ? 'bg-slate-200 text-slate-500 cursor-not-allowed opacity-60'
              : 'bg-primary text-white hover:bg-primary/90 disabled:opacity-50'
          }`}
        >
          <Zap className="size-4" />
          {reserveLoading ? '预约中...' : reserved ? '已预约' : t('reserve')}
        </button>
      )}

      {/* 线下公开课免费 — 立即报名 */}
      {isOfflineOpen && !isPurchasable && !isOverdue && (
        <button
          type="button"
          onClick={() => requireAuth(() => setConsultOpen(true))}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-md"
        >
          <Zap className="size-4" />
          {t('enroll')}
        </button>
      )}

      {/* 非公开课非付费场景保留原内训逻辑 */}
      {!isOpen && !isInternal && !isOverdue && (
        <button
          type="button"
          onClick={() => requireAuth(() => {
            router.push(`/dashboard/demands/create?type=INTERNAL_RESERVATION&courseType=INTERNAL&courseid=${course.id}`);
          })}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-md"
        >
          <Zap className="size-4" />
          {t('enroll')}
        </button>
      )}

      {/* 立即咨询 */}
      {!isInternal && !isOverdue && (
      <button
        type="button"
        onClick={() => setConsultOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-slate-200 text-slate-700 font-medium text-sm hover:border-primary hover:text-primary transition-all"
      >
        <MessageCircle className="size-4" />
        {t('consult')}
      </button>
      )}

      {/* 收藏按钮 */}
      <button
        type="button"
        onClick={() => requireAuth(toggleFavorite)}
        disabled={favLoading}
        className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg border font-medium text-sm transition-all ${
          favorited
            ? 'border-primary text-primary'
            : 'border-slate-200 text-slate-700 hover:border-primary hover:text-primary'
        }`}
      >
        <Heart className={`size-4 ${favorited ? 'fill-primary' : ''}`} />
        {favorited ? '已收藏' : t('favorite')}
      </button>

      {/* 互动数据 */}
      <div className="flex items-center justify-around pt-4 border-t border-slate-100 text-xs text-slate-500">
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1 hover:text-primary transition-colors"
        >
          <Share2 className="size-3.5" />
          {t('share')}
        </button>
        <span className="flex items-center gap-1">
          {isOpen ? <Eye className="size-3.5" /> : <Flame className="size-3.5" />}
          {isOpen ? t('views') : t('popularity')}: {course.viewCount}
        </span>
        <button
          type="button"
          onClick={() => requireAuth(() => setReviewOpen(true))}
          className="flex items-center gap-1 hover:text-primary transition-colors"
        >
          <PenLine className="size-3.5" />
          {t('review')}
        </button>
      </div>

      <ReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        scope="COURSE"
        courseId={course.id}
        prefillExpertName={course.trainerName}
        prefillCourseTitle={course.title}
        prefillTrainingLocation={planLocation}
        prefillTrainingDate={planStartDate}
        onSuccess={() => toast.success('评价已提交，审核通过后将公开展示')}
      />

      <CustomerServiceChatDialog open={consultOpen} onOpenChange={setConsultOpen} />

      <PendingOrderReminderDialog
        open={pendingDialogOpen}
        order={pendingOrder}
        onOpenChange={setPendingDialogOpen}
        onContinue={handleContinueBuy}
      />

      <CourseReserveSuccessDialog
        open={reserveSuccessOpen}
        onClose={() => setReserveSuccessOpen(false)}
      />
    </div>
  );
}
