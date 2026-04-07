import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/http/client';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import type { ApiResponse, CartItem, AddCartRequest } from './types';

function authHeaders() {
  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  return { Authorization: `Bearer ${tokenData?.accessToken || ''}` };
}

/** 添加购物车 */
export async function addCartItem(data: AddCartRequest): Promise<CartItem> {
  const res = await apiPost<ApiResponse<CartItem>>('/cart/items', data, {
    headers: authHeaders(),
  });
  return res.data;
}

/** 获取购物车列表 */
export async function getCartItems(): Promise<CartItem[]> {
  const res = await apiGet<ApiResponse<CartItem[]>>('/cart/items', {
    headers: authHeaders(),
  });
  return res.data;
}

/** 修改购物车数量 */
export async function updateCartQuantity(
  id: number,
  quantity: number,
): Promise<CartItem> {
  const res = await apiPut<ApiResponse<CartItem>>(
    `/cart/items/${id}`,
    { quantity },
    { headers: authHeaders() },
  );
  return res.data;
}

/** 删除购物车条目 */
export async function removeCartItem(id: number): Promise<void> {
  await apiDelete<ApiResponse<void>>(`/cart/items/${id}`, {
    headers: authHeaders(),
  });
}

/** 清空购物车 */
export async function clearCart(): Promise<void> {
  await apiDelete<ApiResponse<void>>('/cart/items', {
    headers: authHeaders(),
  });
}

/** 获取购物车商品数量 */
export async function getCartCount(): Promise<number> {
  const res = await apiGet<ApiResponse<number>>('/cart/count', {
    headers: authHeaders(),
  });
  return res.data;
}
