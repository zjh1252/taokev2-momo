import { ApiException } from '@/lib/http/client';
import { showError } from '@/lib/toast';

/**
 * 滑块行为验证码（tianai-captcha 官方 tac 前端）接入工具。
 * <p>
 * tac 静态包已放在 public/tac/（结构：js/tac.min.js、css/tac.css、images/）。
 * 该版本暴露全局类 {@code window.TAC}，用法：new TAC(config).init()。
 * 校验通过后从 res.data.token 取一次性令牌，Promise 形式返回。
 *
 * @author Fangxinxin
 * @date 2026-05-23 16:00
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const TAC_BASE = '/tac';

/** 后端「需要滑块验证」的业务错误码（ErrorCode.CAPTCHA_REQUIRED） */
export const CAPTCHA_REQUIRED_CODE = '10021';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TAC?: new (config: any, style?: any) => { init: () => void };
  }
}

let assetsPromise: Promise<void> | null = null;

/** 加载 tac 的 css 与 js（仅一次）。 */
function loadTacAssets(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('无 window'));
  if (window.TAC) return Promise.resolve();
  if (assetsPromise) return assetsPromise;
  assetsPromise = new Promise<void>((resolve, reject) => {
    if (!document.getElementById('tac-css')) {
      const link = document.createElement('link');
      link.id = 'tac-css';
      link.rel = 'stylesheet';
      link.href = `${TAC_BASE}/css/tac.css`;
      document.head.appendChild(link);
    }
    const s = document.createElement('script');
    s.src = `${TAC_BASE}/js/tac.min.js`;
    s.async = true;
    s.onload = () => (window.TAC ? resolve() : reject(new Error('验证码脚本未暴露 TAC')));
    s.onerror = () => {
      assetsPromise = null;
      reject(new Error('验证码脚本加载失败'));
    };
    document.body.appendChild(s);
  });
  return assetsPromise;
}

const BOX_SELECTOR = '#tac-captcha-box';

/** 确保存在一个居中模态遮罩 + 验证码挂载盒，返回遮罩元素与挂载盒。 */
function ensureOverlay(): { overlay: HTMLElement; box: HTMLElement } {
  let overlay = document.getElementById('tac-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'tac-overlay';
    overlay.style.cssText =
      'position:fixed;inset:0;display:none;align-items:center;justify-content:center;' +
      'background:rgba(0,0,0,0.45);z-index:2147483646;';
    const box = document.createElement('div');
    box.id = 'tac-captcha-box';
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }
  return { overlay, box: document.getElementById('tac-captcha-box') as HTMLElement };
}

/** 弹出滑块验证（居中模态），成功返回一次性 captchaToken；取消/失败 reject。 */
export async function verifyCaptcha(): Promise<string> {
  await loadTacAssets();
  const { overlay, box } = ensureOverlay();
  return new Promise<string>((resolve, reject) => {
    let settled = false;
    box.innerHTML = '';
    overlay.style.display = 'flex';

    const close = () => {
      overlay.style.display = 'none';
      box.innerHTML = '';
      overlay.removeEventListener('click', onBackdrop);
    };
    const onBackdrop = (e: MouseEvent) => {
      if (e.target === overlay && !settled) {
        settled = true;
        close();
        reject(new Error('已取消验证'));
      }
    };
    overlay.addEventListener('click', onBackdrop);

    const config = {
      requestCaptchaDataUrl: `${API_BASE_URL}/auth/captcha`,
      validCaptchaUrl: `${API_BASE_URL}/auth/captcha/check`,
      bindEl: BOX_SELECTOR,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validSuccess: (res: any, _c: any, tac: any) => {
        settled = true;
        try { tac.destroyWindow(); } catch { /* ignore */ }
        close();
        const token = res?.data?.token;
        if (token) resolve(token);
        else reject(new Error('验证码返回异常'));
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validFail: (_res: any, _c: any, tac: any) => {
        try { tac.reloadCaptcha(); } catch { /* ignore */ }
      },
    };
    try {
      new window.TAC!(config).init();
    } catch (e) {
      settled = true;
      close();
      reject(e instanceof Error ? e : new Error('验证码初始化失败'));
    }
  });
}

/**
 * 包裹一次需要「滑块兜底」的请求：
 * 先静默尝试；若后端返回 CAPTCHA_REQUIRED，则弹滑块拿 token 后重试；
 * 其它错误补弹 toast 并抛出。
 *
 * @param call (token, silent) => Promise<T>
 */
export async function withCaptcha<T>(
  call: (token: string | undefined, silent: boolean) => Promise<T>,
): Promise<T> {
  try {
    return await call(undefined, true);
  } catch (e) {
    if (e instanceof ApiException && e.code === CAPTCHA_REQUIRED_CODE) {
      const token = await verifyCaptcha();
      return await call(token, false);
    }
    if (e instanceof ApiException && typeof window !== 'undefined') {
      showError(e.message);
    }
    throw e;
  }
}
