'use client';

import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import type { CartItem } from '../api/types';

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
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
      {/* 选择框 */}
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelect(item.id)}
        className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary cursor-pointer"
      />

      {/* 商品图片 */}
      <div className="w-20 h-14 rounded overflow-hidden bg-slate-100 flex-shrink-0">
        {item.productCover ? (
          <Image
            src={item.productCover}
            alt={item.productTitle}
            width={80}
            height={56}
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
        <h4 className="text-sm font-medium text-slate-800 truncate">
          {item.productTitle}
        </h4>
        <span className="inline-block mt-1 px-1.5 py-0.5 bg-slate-100 text-slate-500 text-xs rounded">
          {item.productTypeLabel}
        </span>
      </div>

      {/* 单价 */}
      <div className="text-right min-w-[80px]">
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
      <div className="flex items-center gap-1">
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

      {/* 小计 */}
      <div className="text-right min-w-[90px]">
        <div className="text-sm font-bold text-primary">
          ¥{(item.price * item.quantity).toFixed(2)}
        </div>
      </div>

      {/* 删除 */}
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="text-slate-400 hover:text-red-500 transition-colors p-1"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
