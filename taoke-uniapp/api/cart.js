import http from '@/utils/request';

/** 添加购物车 */
export const addCartItem = (data) => http.post('/cart/items', data);

/** 购物车列表 */
export const listCartItems = () => http.get('/cart/items');

/** 购物车数量 */
export const getCartCount = () => http.get('/cart/count', {}, { silent: true });
