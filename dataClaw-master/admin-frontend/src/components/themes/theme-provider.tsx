'use client';

import { ThemeProvider as NextThemesProvider, ThemeProviderProps } from 'next-themes';

/**
 * 抑制 next-themes 触发的 React 19 假阳性警告。
 *
 * <p>{@code next-themes} 0.4.x 内部用 {@code React.createElement('script', ...)} 注入
 * 防 FOUC 脚本，React 19+ 会发出 "Encountered a script tag while rendering React
 * component" 的 Console 错误。这个脚本在 SSR 阶段会被序列化进 HTML，由浏览器在
 * hydration 之前执行，行为正常 — 警告本身是 false positive。</p>
 *
 * <p>库目前已停止维护（自 2025-03 起），社区共识是在 dev 下用 console.error 过滤；
 * 详见 shadcn-ui/ui#10104。本块仅在浏览器开发环境下生效，不影响生产。</p>
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const original = console.error;
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Encountered a script tag')
    ) {
      return;
    }
    original.apply(console, args);
  };
}

export default function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
