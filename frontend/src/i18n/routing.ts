import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['zh-CN', 'en'],
  defaultLocale: 'zh-CN',
  // 避免 /trainers/16、/opencourses/14 等路径的首段被误判为 locale 导致 404
  localePrefix: 'always',
  localeDetection: false,
});
