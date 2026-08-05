import { describe, expect, it } from 'vitest';
import { buildHighlightGalleryItems } from './highlight-gallery';

describe('buildHighlightGalleryItems', () => {
  it('maps highlight files to media gallery items and skips empty urls', () => {
    expect(
      buildHighlightGalleryItems([
        {
          fileType: 1,
          fileUrl: '/uploads/a.jpg',
          thumbnailUrl: '/uploads/a-thumb.jpg',
        },
        {
          fileType: 2,
          fileUrl: '/uploads/b.mp4',
          thumbnailUrl: null,
        },
        {
          fileType: 1,
          fileUrl: ' ',
          thumbnailUrl: '/uploads/empty.jpg',
        },
      ]),
    ).toEqual([
      {
        url: '/uploads/a.jpg',
        thumbnailUrl: '/uploads/a-thumb.jpg',
        type: 'image',
      },
      {
        url: '/uploads/b.mp4',
        thumbnailUrl: null,
        type: 'video',
      },
    ]);
  });
});
