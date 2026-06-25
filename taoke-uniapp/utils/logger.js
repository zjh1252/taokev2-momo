/**
 * 轻量日志 —— 按 configs/env.js 的 LOG_LEVEL 过滤，减少小程序 Console 噪音
 */

import { ENV } from '@/configs/env';

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const current = LEVELS[ENV.LOG_LEVEL] ?? LEVELS.info;

function shouldLog(level) {
  return current <= LEVELS[level];
}

export function logDebug(...args) {
  if (shouldLog('debug')) console.log(...args);
}

export function logInfo(...args) {
  if (shouldLog('info')) console.log(...args);
}

export function logWarn(...args) {
  if (shouldLog('warn')) console.warn(...args);
}

export function logError(...args) {
  if (shouldLog('error')) console.error(...args);
}
