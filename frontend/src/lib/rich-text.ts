import { resolveImageSrc } from '@/lib/media';

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function appendAltAttribute(attrs: string, altText: string): string {
  const attr = `alt="${escapeHtmlAttribute(altText)}"`;
  if (/\s*\/\s*$/.test(attrs)) {
    return attrs.replace(/\s*\/\s*$/, ` ${attr} /`);
  }
  return `${attrs} ${attr}`;
}

/**
 * 富文本 HTML 内 img src 规范化（SSR/CSR 一致，不用 DOMParser 避免 hydration 不一致）。
 */
export function resolveRichTextHtml(html: string, imageAlt = '内容图片'): string {
  if (!html) return '';
  return html.replace(/<img\b([^>]*?)>/gi, (full, attrs: string) => {
    let replaced = attrs.replace(
      /\bsrc=(["'])(.*?)\1/i,
      (_m, quote: string, src: string) => `src=${quote}${resolveImageSrc(src)}${quote}`,
    );
    const fallbackAlt = imageAlt.trim();
    if (fallbackAlt) {
      const altPattern = /\balt=(["'])(.*?)\1/i;
      if (altPattern.test(replaced)) {
        replaced = replaced.replace(
          altPattern,
          (match, quote: string, alt: string) =>
            alt.trim() ? match : `alt=${quote}${escapeHtmlAttribute(fallbackAlt)}${quote}`,
        );
      } else {
        replaced = appendAltAttribute(replaced, fallbackAlt);
      }
    }
    if (replaced === attrs) return full;
    return `<img${replaced}>`;
  });
}
