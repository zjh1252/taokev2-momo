/**
 * 统一网络请求封装
 *
 * 1. 自动注入 Authorization: Bearer ${token}
 * 2. 解包后端 ApiResponse<T>（{ code, message, data }），code===0 返回 data，否则 toast 并 reject
 * 3. HTTP 401 / code===10001 自动清登录态并跳转登录页
 * 4. HTTP 4xx/5xx 仍尝试解析 ApiResponse，避免只显示「HTTP 400」
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

function rejectBusinessError(body, silent) {
  const code = body.code;
  const message = body.message || '操作失败';

  if (code === 10001 || code === 401) {
    handleUnauthorized();
  } else if (!silent) {
    uni.showToast({ title: message, icon: 'none' });
  }

  const err = new Error(message);
  err.code = code;
  err.payload = body;
  return err;
}

function handleResponseBody(body, status, { silent, raw, resolve, reject }) {
  if (raw) {
    resolve(body);
    return true;
  }

  if (!body || typeof body !== 'object' || !('code' in body)) {
    return false;
  }

  if (body.code === 0) {
    if (status >= 200 && status < 300) {
      resolve(body.data);
      return true;
    }
    const err = rejectBusinessError(
      { ...body, message: body.message || `请求失败（${status}）` },
      silent,
    );
    reject(err);
    return true;
  }

  reject(rejectBusinessError(body, silent));
  return true;
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

  let finalUrl = url.startsWith('http') ? url : baseURL + url;
  if (params && typeof params === 'object') {
    const qs = Object.keys(params)
      .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
      .join('&');
    if (qs) finalUrl += (finalUrl.includes('?') ? '&' : '?') + qs;
  }

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
        const body = res.data;

        if (handleResponseBody(body, status, { silent, raw, resolve, reject })) {
          return;
        }

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

        resolve(body);
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

export const http = {
  get: (url, params, options = {}) => request({ url, method: 'GET', params, ...options }),
  post: (url, data, options = {}) => request({ url, method: 'POST', data, ...options }),
  put: (url, data, options = {}) => request({ url, method: 'PUT', data, ...options }),
  del: (url, params, options = {}) => request({ url, method: 'DELETE', params, ...options }),
};

export default http;
