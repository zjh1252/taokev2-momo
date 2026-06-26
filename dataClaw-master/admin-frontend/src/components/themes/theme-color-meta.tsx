'use client';

import { useTheme } from 'next-themes';
import { useEffect } from 'react';

const META_THEME_COLORS = {
  light: '#ffffff',
  dark: '#09090b',
};

/**
 * 同步 {@code <meta name="theme-color">} 与当前主题色。
 *
 * <p>移动端浏览器（含 Safari iOS / Android Chrome）会用 {@code theme-color}
 * 渲染地址栏背景。本组件监听 next-themes 解析后的 {@code resolvedTheme}，
 * 在客户端切换 dark / light 时同步更新对应颜色，避免暗色模式下出现亮色顶栏。</p>
 *
 * <p>避免在组件树中直接渲染 {@code <script>} 标签 — React 19 在客户端
 * 渲染时不会执行内联脚本并会发出 Console 警告，故改用 effect 处理。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-29 11:50
 */
export default function ThemeColorMeta() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    const color =
      resolvedTheme === 'dark'
        ? META_THEME_COLORS.dark
        : META_THEME_COLORS.light;
    meta.setAttribute('content', color);
  }, [resolvedTheme]);

  return null;
}
