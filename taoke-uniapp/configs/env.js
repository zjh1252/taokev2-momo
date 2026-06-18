/**
 * 环境变量矩阵 —— Vite CLI 模式
 *
 * 三档环境通过 --mode 切换（Vite 原生机制）：
 *   pnpm dev:h5   / pnpm dev:mp-weixin  → MODE = development → 读 .env.development
 *   pnpm dev:h5:test                    → MODE = test       → 读 .env.test
 *   pnpm build:h5 / pnpm build:mp-weixin → MODE = production → 读 .env.production
 *   pnpm build:h5:test / pnpm build:mp-weixin:test → MODE = test → 读 .env.test
 *
 * 不再需要 APP_ENV_OVERRIDE 手动开关，本地开发直接 pnpm dev:h5 / pnpm dev:mp-weixin 即走 localhost。
 * 打 test 包用 --mode test（如 pnpm build:mp-weixin:test）。
 *
 * 命名约定（与旧 HBuilderX 模式兼容，确保 configs/index.js 和所有业务代码零改动）：
 *   - API_BASE_URL          : 后端 API 入口（utils/request.js）
 *   - API_BASE_URL_NATIVE   : 小程序/真机 API 入口（localhost 在设备上不通）
 *   - ASSET_BASE_URL        : 静态资源域名（utils/asset.js / toAssetUrl）
 *   - ASSET_BASE_URL_NATIVE : 小程序/真机 资源域名
 *   - MOCK_SMS              : 是否在 dev/test 环境打开模拟短信验证码弹窗
 *   - LOG_LEVEL             : 日志级别（debug | info | warn | error）
 */

const MODE = import.meta.env.MODE || 'development';
const APP_ENV = MODE;

export const ENV = {
  API_BASE_URL:          import.meta.env.VITE_API_BASE_URL,
  API_BASE_URL_NATIVE:   import.meta.env.VITE_API_BASE_URL_NATIVE,
  ASSET_BASE_URL:        import.meta.env.VITE_ASSET_BASE_URL,
  ASSET_BASE_URL_NATIVE: import.meta.env.VITE_ASSET_BASE_URL_NATIVE,

  MOCK_SMS:  import.meta.env.VITE_MOCK_SMS === 'true',
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || 'info',
};

export const IS_DEV  = APP_ENV === 'development';
export const IS_TEST = APP_ENV === 'test';
export const IS_PROD = APP_ENV === 'production';
export const ENV_NAME = APP_ENV;
