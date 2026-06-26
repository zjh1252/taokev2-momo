/**
 * 登录守卫与跳转工具
 *
 * - requireLogin(): 业务页面在 onLoad 调用，未登录会自动跳到登录页并 reject
 * - goLogin(): 主动跳转登录页（携带 redirect 回跳路径）
 */
import { getToken } from './request';

export function isLoggedIn() {
  return !!getToken();
}

export function goLogin(redirect) {
  let url = '/pages/auth/login';
  if (redirect) {
    url += `?redirect=${encodeURIComponent(redirect)}`;
  }
  uni.navigateTo({ url });
}

/**
 * 需要登录的页面 / 操作守卫
 * @param {Object} [opts]
 * @param {boolean} [opts.silent=false] - 静默模式：未登录时不 toast
 * @returns {boolean} 已登录返回 true，未登录返回 false 并自动跳转
 */
export function requireLogin(opts = {}) {
  if (isLoggedIn()) return true;
  if (!opts.silent) {
    uni.showToast({ title: '请先登录', icon: 'none' });
  }
  // 取当前页面路径作为 redirect
  const pages = getCurrentPages();
  let redirect = '';
  if (pages.length) {
    const cur = pages[pages.length - 1];
    redirect = '/' + cur.route;
    if (cur.options && Object.keys(cur.options).length) {
      const qs = Object.keys(cur.options)
        .map((k) => `${k}=${cur.options[k]}`)
        .join('&');
      redirect += '?' + qs;
    }
  }
  setTimeout(() => goLogin(redirect), 300);
  return false;
}
