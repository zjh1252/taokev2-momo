'use client';

import { useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { Link } from '@/i18n/navigation';

/**
 * 顶部购物车图标 + 数量 badge
 *
 * 挂载后自动拉取购物车数量。
 */
export function CartBadge() {
  const { count, refreshCount } = useCart();

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  return (
    <Link
      href="/cart"
      className="relative flex items-center gap-1 hover:text-primary transition-colors"
    >
      <ShoppingCart className="size-3.5" />
      <span>购物车</span>
      {count > 0 && (
        <span className="absolute -top-2 -right-3 bg-primary text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
