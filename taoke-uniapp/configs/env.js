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
 * 字段命名与 [frontend/.env.example](../../frontend/.env.example) 对齐
 */

const ENV_MAP = {
  development: {
    // H5 / 浏览器场景：本机后端 8080，后端 CorsFilterConfig 默认 allowed-origins=*
    API_BASE_URL: 'http://localhost:8080',
    // 小程序模拟器 / App 真机预览时 localhost 指设备本身，需改成开发者机器局域网 IP（如 http://192.168.1.100:8080）
    API_BASE_URL_NATIVE: 'http://localhost:8080',
    CDN_BASE_URL: 'http://localhost:9000/taoke',
    MOCK_SMS: true,
    LOG_LEVEL: 'debug',
  },
  production: {
    // TODO: 上线前替换为真实生产域名
    API_BASE_URL: 'https://api.taoke.com',
    API_BASE_URL_NATIVE: 'https://api.taoke.com',
    CDN_BASE_URL: 'https://cdn.taoke.com',
    MOCK_SMS: false,
    LOG_LEVEL: 'error',
  },
};

const NODE_ENV = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) || 'development';

export const ENV = ENV_MAP[NODE_ENV] || ENV_MAP.development;
export const IS_DEV = NODE_ENV === 'development';
export const IS_PROD = NODE_ENV === 'production';
export const ENV_NAME = NODE_ENV;
