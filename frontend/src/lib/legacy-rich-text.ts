/**
 * 将迁移自老站的 HTML 片段（含 &lt;br&gt; 等）转为可读的纯文本/分段结构。
 */
export function legacyRichTextToPlain(text: string): string {
  if (!text?.trim()) return '';

  let s = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&ldquo;/g, '\u201c')
    .replace(/&rdquo;/g, '\u201d')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&#39;/g, "'")
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<\/?p[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  s = s.replace(/\r\n/g, '\n');
  s = s
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !/^[\s.。·…\-－—]+$/.test(line))
    .join('\n');
  s = s.replace(/\n{3,}/g, '\n\n');

  return s.trim();
}

export type LegacyRichTextSection = {
  title?: string;
  body: string;
};

/** 按「标题行（以：结尾）+ 正文」拆分为多段，便于列表展示 */
export function parseLegacyRichTextSections(text: string): LegacyRichTextSection[] {
  const plain = legacyRichTextToPlain(text);
  if (!plain) return [];

  const blocks = plain.split(/\n\n+/).filter(Boolean);
  const sections: LegacyRichTextSection[] = [];

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    const first = lines[0];
    const isBracketTitle = /^【[^】]+】$/.test(first);
    const isTitle = /[：:]\s*$/.test(first) || isBracketTitle;

    if (isTitle && lines.length > 1) {
      sections.push({
        title: first,
        body: lines.slice(1).join('\n'),
      });
    } else if (isTitle && lines.length === 1) {
      sections.push({ title: first, body: '' });
    } else {
      sections.push({ body: lines.join('\n') });
    }
  }

  if (sections.length === 0 && plain) {
    sections.push({ body: plain });
  }

  return sections;
}
