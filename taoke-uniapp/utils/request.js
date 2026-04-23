/**
 * 统一网络请求封装
 *
 * 1. 自动注入 Authorization: Bearer ${token}
 * 2. 解包后端 ApiResponse<T>（{ code, message, data }），code===0 返回 data，否则 toast 并 reject
 * 3. HTTP 401 / code===10001 自动清登录态并跳转登录页
 */

import config from '@/configs';

const TOKEN_KEY = 'tk_token';
const baseURL = config.baseURL;
const TIMEOUT = config.timeout;

export function getToken() {
  try {
    return uni.getStorageSync(TOKEN_KEY) || '';
  } catch (e) {
    return '';
  }
}

export function setToken(token) {
  uni.setStorageSync(TOKEN_KEY, token || '');
}

export function clearToken() {
  uni.removeStorageSync(TOKEN_KEY);
}

let unauthorizedRedirecting = false;

function handleUnauthorized() {
  if (unauthorizedRedirecting) return;
  unauthorizedRedirecting = true;
  clearToken();
  uni.showToast({ title: '请先登录', icon: 'none' });
  setTimeout(() => {
    uni.reLaunch({
      url: '/pages/auth/login',
      complete: () => {
        unauthorizedRedirecting = false;
      },
    });
  }, 600);
}

/**
 * 核心请求方法
 * @param {Object} options
 * @param {string} options.url
 * @param {string} [options.method='GET']
 * @param {Object} [options.data]
 * @param {Object} [options.params]   - GET 查询参数（自动拼到 URL）
 * @param {Object} [options.header]
 * @param {boolean} [options.silent]  - 静默模式：失败不 toast
 * @param {boolean} [options.raw]     - 透传原始响应（不解包 ApiResponse）
 * @returns {Promise<any>}
 */
export function request(options) {
  const {
    url,
    method = 'GET',
    data,
    params,
    header = {},
    silent = false,
    raw = false,
  } = options;

  // 拼接查询参数
  let finalUrl = url.startsWith('http') ? url : baseURL + url;
  if (params && typeof params === 'object') {
    const qs = Object.keys(params)
      .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
      .join('&');
    if (qs) finalUrl += (finalUrl.includes('?') ? '&' : '?') + qs;
  }

  // 注入 token
  const token = getToken();
  const finalHeader = { 'Content-Type': 'application/json', ...header };
  if (token) finalHeader.Authorization = `Bearer ${token}`;

  return new Promise((resolve, reject) => {
    uni.request({
      url: finalUrl,
      method,
      data,
      header: finalHeader,
      timeout: TIMEOUT,
      success: (res) => {
        const status = res.statusCode;
        if (status === 401 || status === 403) {
          handleUnauthorized();
          reject(new Error('未登录或登录已过期'));
          return;
        }
        if (status < 200 || status >= 300) {
          if (!silent) {
            uni.showToast({ title: `请求失败（${status}）`, icon: 'none' });
          }
          reject(new Error(`HTTP ${status}`));
          return;
        }

        const body = res.data;
        if (raw) {
          resolve(body);
          return;
        }

        // 解包 ApiResponse
        if (body && typeof body === 'object' && 'code' in body) {
          if (body.code === 0) {
            resolve(body.data);
          } else {
            // 401 业务码（按需扩展）
            if (body.code === 10001 || body.code === 401) {
              handleUnauthorized();
            } else if (!silent) {
              uni.showToast({ title: body.message || '操作失败', icon: 'none' });
            }
            const err = new Error(body.message || 'BusinessError');
            err.code = body.code;
            err.payload = body;
            reject(err);
          }
        } else {
          // 非标准响应直接返回
          resolve(body);
        }
      },
      fail: (err) => {
        if (!silent) {
          uni.showToast({ title: err.errMsg || '网络异常', icon: 'none' });
        }
        reject(err);
      },
    });
  });
}

// 便捷方法
export const http = {
  get: (url, params, options = {}) => request({ url, method: 'GET', params, ...options }),
  post: (url, data, options = {}) => request({ url, method: 'POST', data, ...options }),
  put: (url, data, options = {}) => request({ url, method: 'PUT', data, ...options }),
  del: (url, params, options = {}) => request({ url, method: 'DELETE', params, ...options }),
};

export default http;
