import { resolveImageSrc } from '@/lib/media';

/**
 * 富文本 HTML 内 img src 规范化（SSR/CSR 一致，不用 DOMParser 避免 hydration 不一致）。
 */
export function resolveRichTextHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<img\b([^>]*?)>/gi, (full, attrs: string) => {
    const replaced = attrs.replace(
      /\bsrc=(["'])(.*?)\1/i,
      (_m, quote: string, src: string) => `src=${quote}${resolveImageSrc(src)}${quote}`,
    );
    if (replaced === attrs) return full;
    return `<img${replaced}>`;
  });
}
