/**
 * 全局应用配置 —— 业务代码统一通过 `import config from '@/configs'` 取值
 *
 * 平台分支用 #ifdef 在编译期裁剪：
 *   - H5         : 走 ENV.API_BASE_URL / ENV.ASSET_BASE_URL（dev 直连后端，依赖后端 CORS=*）
 *   - 小程序/App : 走 _NATIVE 变体（真机调试需改为局域网 IP）
 *
 * 暴露字段：
 *   - config.baseURL       : 后端 API 入口（utils/request.js 用）
 *   - config.assetBaseURL  : 静态资源域名（utils/asset.js → toAssetUrl 用，业务代码不直接读）
 */

import { ENV, IS_DEV, IS_PROD, ENV_NAME } from './env';

let baseURL = '';
let assetBaseURL = '';

// #ifdef H5
baseURL = ENV.API_BASE_URL;
assetBaseURL = ENV.ASSET_BASE_URL;
// #endif

// #ifdef MP-WEIXIN || APP-PLUS
baseURL = ENV.API_BASE_URL_NATIVE;
assetBaseURL = ENV.ASSET_BASE_URL_NATIVE;
// #endif

const config = {
  envName: ENV_NAME,
  isDev: IS_DEV,
  isProd: IS_PROD,

  baseURL,
  assetBaseURL,
  timeout: 15000,

  mockSms: ENV.MOCK_SMS,
  logLevel: ENV.LOG_LEVEL,

  // TODO: 同步填写 manifest.json 的 mp-weixin.appid
  wxAppId: '',
};

export default config;
export { ENV_NAME, IS_DEV, IS_PROD };
