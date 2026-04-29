/**
 * 环境变量矩阵 —— 唯一感知"环境从哪来"的文件
 *
 * 三档环境：
 *   - development : 本地开发（HBuilderX「运行 → 浏览器/小程序模拟器」自动注入 NODE_ENV=development）
 *   - test        : 测试环境（HBuilderX 没有原生 test 档；通过下方 APP_ENV_OVERRIDE 手动切换，详见 §README）
 *   - production  : 生产正式（HBuilderX「发行 → 原生App-云打包/小程序」自动注入 NODE_ENV=production）
 *
 * 二期切 CLI（@dcloudio/vite-plugin-uni）后：
 *   - 改用 .env.development / .env.test / .env.production
 *   - 把下方 ENV_MAP 的取值改为 import.meta.env.VITE_*，业务代码无需改动
 *
 * 命名约定：
 *   - API_BASE_URL          : 后端 API 入口（utils/request.js）
 *   - API_BASE_URL_NATIVE   : 小程序/真机 API 入口（localhost 在设备上不通）
 *   - ASSET_BASE_URL        : 静态资源域名（utils/asset.js / toAssetUrl）
 *   - ASSET_BASE_URL_NATIVE : 小程序/真机 资源域名
 *   - MOCK_SMS              : 是否在 dev/test 环境打开模拟短信验证码弹窗
 *   - LOG_LEVEL             : 日志级别（debug | info | warn | error）
 */

// ──────────────────────────────────────────────────────────────────────────
// 环境覆盖开关（HBuilderX 模式下打 test 包必看）
//
// HBuilderX「发行」只能注入 NODE_ENV=production，无法直接区分 test / prod。
// 打 test 包之前把下方 APP_ENV_OVERRIDE 临时改成 'test'，打完务必改回 ''。
//
// 取值：
//   ''             → 走 NODE_ENV 自动推断（dev → development；发行 → production）
//   'development'  → 强制 dev
//   'test'         → 强制 test（打 v2.taoke.com 测试包必用）
//   'production'   → 强制 prod
// ──────────────────────────────────────────────────────────────────────────
const APP_ENV_OVERRIDE = 'test';

const ENV_MAP = {
  development: {
    // 本机后端（H5 直连依赖后端 CorsFilterConfig 的 allowed-origins=*）
    API_BASE_URL:           'http://localhost:8080',
    // 小程序模拟器 / App 真机 localhost 指设备本身，需改成开发者机器局域网 IP（如 http://192.168.1.100:8080）
    API_BASE_URL_NATIVE:    'http://localhost:8080',
    // 静态资源域名（dev 阶段后端就是资源源站，显式声明，不做兜底）
    ASSET_BASE_URL:         'http://localhost:8080',
    ASSET_BASE_URL_NATIVE:  'http://localhost:8080',

    MOCK_SMS:  true,
    LOG_LEVEL: 'debug',
  },
  test: {
    // 与 frontend/.env.test 对齐
    API_BASE_URL:           'https://v2.taoke.com/backend-api',
    API_BASE_URL_NATIVE:    'https://v2.taoke.com/backend-api',
    // 资源走主域（test 阶段未拆 CDN）
    ASSET_BASE_URL:         'https://v2.taoke.com',
    ASSET_BASE_URL_NATIVE:  'https://v2.taoke.com',

    MOCK_SMS:  true,
    LOG_LEVEL: 'info',
  },
  production: {
    // TODO: 上线前替换为真实生产域名
    API_BASE_URL:           'https://api.taoke.com',
    API_BASE_URL_NATIVE:    'https://api.taoke.com',
    // 上线建议 API / 资源拆域：API 走 api.x.com，资源走 cdn.x.com
    ASSET_BASE_URL:         'https://cdn.taoke.com',
    ASSET_BASE_URL_NATIVE:  'https://cdn.taoke.com',

    MOCK_SMS:  false,
    LOG_LEVEL: 'error',
  },
};

const NODE_ENV = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) || 'development';

// 解析最终生效的环境名：override 优先，否则按 NODE_ENV 自动推断
function resolveAppEnv() {
  if (APP_ENV_OVERRIDE && ENV_MAP[APP_ENV_OVERRIDE]) return APP_ENV_OVERRIDE;
  if (ENV_MAP[NODE_ENV]) return NODE_ENV;
  return 'development';
}

const APP_ENV = resolveAppEnv();

export const ENV = ENV_MAP[APP_ENV];
export const IS_DEV  = APP_ENV === 'development';
export const IS_TEST = APP_ENV === 'test';
export const IS_PROD = APP_ENV === 'production';
export const ENV_NAME = APP_ENV;
