import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['zh-CN', 'en'],
  defaultLocale: 'zh-CN',
  // 默认 locale (zh-CN) 不显示在 URL 中，仅非默认 locale (en) 需要前缀
  localePrefix: 'as-needed',
  localeDetection: false,
});
