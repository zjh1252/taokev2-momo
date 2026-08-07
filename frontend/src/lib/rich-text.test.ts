import { describe, expect, it } from 'vitest';
import { resolveRichTextHtml } from './rich-text';

describe('resolveRichTextHtml', () => {
  it('adds fallback alt text to rich text images without usable alt text', () => {
    const html = resolveRichTextHtml(
      '<p><img src="/uploads/video-poster.png" alt=""></p><p><img src="/uploads/intro.png"></p>',
      '《高效沟通》课程介绍长海报，包含课程亮点、学习收获及详细课程大纲',
    );

    expect(html).toContain(
      'video-poster.png" alt="《高效沟通》课程介绍长海报，包含课程亮点、学习收获及详细课程大纲"',
    );
    expect(html).toContain(
      'intro.png" alt="《高效沟通》课程介绍长海报，包含课程亮点、学习收获及详细课程大纲"',
    );
  });

  it('keeps existing non-empty rich text image alt text', () => {
    const html = resolveRichTextHtml(
      '<p><img src="/uploads/video-poster.png" alt="销售管理课程海报"></p>',
      '《高效沟通》课程介绍长海报，包含课程亮点、学习收获及详细课程大纲',
    );

    expect(html).toContain('alt="销售管理课程海报"');
    expect(html).not.toContain('课程介绍长海报');
  });
});
