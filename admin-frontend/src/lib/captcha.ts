import { ApiError } from '@/lib/api-client';

/**
 * 后台滑块行为验证码（tianai-captcha 官方 tac 前端）接入工具。
 * <p>
 * tac 静态包已放在 admin-frontend/public/tac/（js/tac.min.js、css/tac.css、images/），
 * 暴露全局类 {@code window.TAC}。验证码接口走同源 BFF：
 * /api/auth/captcha（生成）、/api/auth/captcha/check（校验）。
 *
 * @author Fangxinxin
 * @date 2026-05-23 16:00
 */

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

/** 确保存在居中模态遮罩 + 验证码挂载盒。 */
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

/** 弹出滑块验证（居中模态），成功返回一次性 captchaToken。 */
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
      requestCaptchaDataUrl: '/api/auth/captcha',
      validCaptchaUrl: '/api/auth/captcha/check',
      bindEl: BOX_SELECTOR,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validSuccess: (res: any, _c: any, tac: any) => {
        settled = true;
        try {
          tac.destroyWindow();
        } catch {
          /* ignore */
        }
        close();
        const token = res?.data?.token;
        if (token) resolve(token);
        else reject(new Error('验证码返回异常'));
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validFail: (_res: any, _c: any, tac: any) => {
        try {
          tac.reloadCaptcha();
        } catch {
          /* ignore */
        }
      }
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
 * 包裹需要滑块兜底的请求：先尝试，若后端返回 CAPTCHA_REQUIRED 则弹滑块拿 token 重试。
 * 后台登录始终启用（后端 /auth/login 恒需 token），即每次登录都会弹滑块。
 */
export async function withCaptcha<T>(call: (token?: string) => Promise<T>): Promise<T> {
  try {
    return await call(undefined);
  } catch (e) {
    if (e instanceof ApiError && e.code === CAPTCHA_REQUIRED_CODE) {
      const token = await verifyCaptcha();
      return await call(token);
    }
    throw e;
  }
}
