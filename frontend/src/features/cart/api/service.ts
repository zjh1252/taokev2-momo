import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/http/client';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import type { ApiResponse, CartItem, AddCartRequest } from './types';

function getAccessToken(): string | null {
  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  return tokenData?.accessToken ?? null;
}

function authHeaders() {
  return { Authorization: `Bearer ${getAccessToken() || ''}` };
}

/** 添加购物车 */
export async function addCartItem(data: AddCartRequest): Promise<CartItem> {
  const res = await apiPost<ApiResponse<CartItem>>('/cart/items', data, {
    headers: authHeaders(),
  });
  return res.data;
}

/** 获取购物车列表（未登录时返回空数组，不发请求） */
export async function getCartItems(): Promise<CartItem[]> {
  if (!getAccessToken()) return [];
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

/** 获取购物车商品数量（未登录时返回 0，不发请求） */
export async function getCartCount(): Promise<number> {
  if (!getAccessToken()) return 0;
  const res = await apiGet<ApiResponse<number>>('/cart/count', {
    headers: authHeaders(),
  });
  return res.data;
}
