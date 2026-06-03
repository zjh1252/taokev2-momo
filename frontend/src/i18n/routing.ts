import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['zh-CN', 'en'],
  defaultLocale: 'zh-CN',
  // 默认语言 zh-CN 隐藏前缀（/trainers 而非 /zh-CN/trainers）
  localePrefix: 'as-needed',
  localeDetection: false,
});
