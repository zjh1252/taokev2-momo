import { describe, expect, it } from 'vitest';
import { resolveRichTextHtml } from './rich-text';

describe('resolveRichTextHtml', () => {
  it('adds fallback alt text to rich text images without usable alt text', () => {
    const html = resolveRichTextHtml(
      '<p><img src="/uploads/video-poster.png" alt=""></p><p><img src="/uploads/intro.png"></p>',
      '课程介绍图片',
    );

    expect(html).toContain('video-poster.png" alt="课程介绍图片"');
    expect(html).toContain('intro.png" alt="课程介绍图片"');
  });

  it('keeps existing non-empty rich text image alt text', () => {
    const html = resolveRichTextHtml(
      '<p><img src="/uploads/video-poster.png" alt="销售管理课程海报"></p>',
      '课程介绍图片',
    );

    expect(html).toContain('alt="销售管理课程海报"');
    expect(html).not.toContain('alt="课程介绍图片"');
  });
});
