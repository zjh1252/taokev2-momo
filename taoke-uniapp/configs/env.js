/**
 * 环境变量矩阵 —— 唯一感知"环境从哪来"的文件
 *
 * 当前阶段（HBuilderX 模式）：直接读 process.env.NODE_ENV
 *   - HBuilderX「运行 → 浏览器/小程序模拟器」自动注入 'development'
 *   - HBuilderX「发行」自动注入 'production'
 *
 * 二期切 CLI（@dcloudio/vite-plugin-uni）后：
 *   - 新建 .env.development / .env.production
 *   - 把下方 ENV_MAP 的取值改为 import.meta.env.VITE_*，业务代码无需改动
 *
 * 命名约定：
 *   - API_BASE_URL          : 后端 API 入口（被 utils/request.js 使用）
 *   - API_BASE_URL_NATIVE   : 小程序/真机预览专用（localhost 在设备上不通）
 *   - ASSET_BASE_URL        : 静态资源域名（图片 / 上传文件 / CDN，被 utils/asset.js 使用）
 *
 * API 与 Asset 是两个独立的语义：
 *   - dev   ：通常二者同域（http://localhost:8080），但仍要"显式声明"，不做隐式兜底
 *   - prod  ：二者可能拆分（API 走 api.x.com，资源走 cdn.x.com），便于独立扩容/防盗链
 */

const ENV_MAP = {
  development: {
    // 后端 API 入口
    API_BASE_URL: 'http://localhost:8080',
    // 小程序模拟器 / App 真机预览时 localhost 指设备本身，需改成开发者机器局域网 IP（如 http://192.168.1.100:8080）
    API_BASE_URL_NATIVE: 'http://localhost:8080',
    // 静态资源域名（dev 阶段后端就是资源源站，显式写出来）
    ASSET_BASE_URL: 'http://localhost:8080',
    ASSET_BASE_URL_NATIVE: 'http://localhost:8080',

    MOCK_SMS: true,
    LOG_LEVEL: 'debug',
  },
  production: {
    // TODO: 上线前替换为真实生产域名
    API_BASE_URL: 'https://api.taoke.com',
    API_BASE_URL_NATIVE: 'https://api.taoke.com',
    // 上线建议 API / 资源拆域：API 走 api.x.com，资源走 cdn.x.com
    ASSET_BASE_URL: 'https://cdn.taoke.com',
    ASSET_BASE_URL_NATIVE: 'https://cdn.taoke.com',

    MOCK_SMS: false,
    LOG_LEVEL: 'error',
  },
};

const NODE_ENV = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) || 'development';

export const ENV = ENV_MAP[NODE_ENV] || ENV_MAP.development;
export const IS_DEV = NODE_ENV === 'development';
export const IS_PROD = NODE_ENV === 'production';
export const ENV_NAME = NODE_ENV;
