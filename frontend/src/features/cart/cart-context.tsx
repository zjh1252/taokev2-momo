'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import type { CartItem, AddCartRequest } from './api/types';
import {
  getCartItems,
  addCartItem,
  updateCartQuantity,
  removeCartItem,
  clearCart as clearCartApi,
  getCartCount,
} from './api/service';

type CartContextValue = {
  items: CartItem[];
  count: number;
  loading: boolean;
  refreshCount: () => Promise<void>;
  refreshItems: () => Promise<void>;
  addItem: (data: AddCartRequest) => Promise<void>;
  updateQuantity: (id: number, quantity: number) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  clearAll: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

/**
 * 购物车全局 Context，保证顶栏角标与详情页「加入购物车」共用同一数量状态。
 *
 * @author Fangxinxin
 * @date 2026-04-08 18:30
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshCount = useCallback(async () => {
    try {
      const c = await getCartCount();
      setCount(c);
    } catch {
      // 未登录时静默失败
    }
  }, []);

  const refreshItems = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getCartItems();
      setItems(list);
      setCount(list.length);
    } catch {
      // 未登录时静默失败
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(
    async (data: AddCartRequest) => {
      try {
        await addCartItem(data);
        toast.success('已加入购物车');
        await refreshCount();
      } catch {
        // toast.error 已在 apiClient 中处理
      }
    },
    [refreshCount],
  );

  const updateQuantity = useCallback(
    async (id: number, quantity: number) => {
      try {
        const updated = await updateCartQuantity(id, quantity);
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...updated } : item)),
        );
      } catch {
        // 错误已弹出
      }
    },
    [],
  );

  const removeItem = useCallback(async (id: number) => {
    try {
      await removeCartItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setCount((prev) => Math.max(0, prev - 1));
      toast.success('已从购物车移除');
    } catch {
      // 错误已弹出
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      await clearCartApi();
      setItems([]);
      setCount(0);
      toast.success('购物车已清空');
    } catch {
      // 错误已弹出
    }
  }, []);

  const value = useMemo(
    () => ({
      items,
      count,
      loading,
      refreshCount,
      refreshItems,
      addItem,
      updateQuantity,
      removeItem,
      clearAll,
    }),
    [
      items,
      count,
      loading,
      refreshCount,
      refreshItems,
      addItem,
      updateQuantity,
      removeItem,
      clearAll,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart 必须在 CartProvider 内使用');
  }
  return ctx;
}
