'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import { SafeImage } from '@/components/safe-image';
import { DEFAULT_VIDEO_COVER } from '@/lib/media';
import type { CartItem } from '../api/types';

/** 表头与商品行共用列宽，保证对齐 */
export const CART_TABLE_GRID =
  'grid grid-cols-[auto_minmax(0,1fr)_5rem_6.5rem_5.5rem_auto] items-center gap-4 px-4';

/** 封面占位宽度，与商品行封面 w-20 + gap-3 对齐 */
export const CART_TITLE_OFFSET = 'w-20 shrink-0';

export function cartLineTotal(item: CartItem): number {
  return item.subtotal ?? item.price * item.quantity;
}

interface CartItemCardProps {
  item: CartItem;
  selected: boolean;
  onToggleSelect: (id: number) => void;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
}

export function CartItemCard({
  item,
  selected,
  onToggleSelect,
  onUpdateQuantity,
  onRemove,
}: CartItemCardProps) {
  const priceChanged = item.currentPrice !== item.price;

  return (
    <div className={`${CART_TABLE_GRID} py-4 bg-white hover:bg-slate-50/50 transition-colors`}>
      {/* 选择框 */}
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelect(item.id)}
        className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary cursor-pointer"
      />

      {/* 商品信息（含封面） */}
      <div className="flex items-center gap-3 min-w-0">
        <div className={`${CART_TITLE_OFFSET} relative h-14 rounded overflow-hidden bg-slate-100`}>
          <SafeImage
            src={item.productCover || undefined}
            alt={item.productTitle}
            fill
            className="object-cover"
            fallback={DEFAULT_VIDEO_COVER}
          />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-medium text-slate-800 truncate">
            {item.productTitle}
          </h4>
          <span className="inline-block mt-1 px-1.5 py-0.5 bg-slate-100 text-slate-500 text-xs rounded">
            {item.productTypeLabel}
          </span>
        </div>
      </div>

      {/* 单价 */}
      <div className="text-right">
        <div className="text-sm font-medium text-slate-800">
          ¥{item.price.toFixed(2)}
        </div>
        {priceChanged && (
          <div className="text-xs text-orange-500">
            现价 ¥{item.currentPrice.toFixed(2)}
          </div>
        )}
      </div>

      {/* 数量控制 */}
      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={() =>
            item.quantity > 1 && onUpdateQuantity(item.id, item.quantity - 1)
          }
          className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
          disabled={item.quantity <= 1}
        >
          <Minus className="size-3" />
        </button>
        <span className="w-8 text-center text-sm">{item.quantity}</span>
        <button
          type="button"
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 hover:border-primary hover:text-primary transition-colors"
        >
          <Plus className="size-3" />
        </button>
      </div>

      {/* 总价 = 单价 × 购买数量 */}
      <div className="text-right">
        <div className="text-sm font-bold text-primary">
          ¥{cartLineTotal(item).toFixed(2)}
        </div>
      </div>

      {/* 删除 */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="text-slate-400 hover:text-red-500 transition-colors p-1"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
