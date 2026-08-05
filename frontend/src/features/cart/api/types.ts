/** 商品类型 */
export type ProductType = 'OPEN_COURSE' | 'INTERNAL_COURSE' | 'VIDEO_COURSE' | 'VIDEO_PACKAGE';

/** 购物车条目 */
export interface CartItem {
  id: number;
  productType: ProductType;
  productTypeLabel: string;
  productId: number;
  productTitle: string;
  productCover: string;
  price: number;
  currentPrice: number;
  quantity: number;
  subtotal: number;
  createdAt: string;
}

/** 添加购物车请求 */
export interface AddCartRequest {
  productType: ProductType;
  productId: number;
  quantity?: number;
}

/** 通用 API 响应 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
