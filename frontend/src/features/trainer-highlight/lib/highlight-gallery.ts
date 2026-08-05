import type { MediaGalleryItem } from '@/components/media-gallery';

type HighlightGalleryFile = {
  fileType: number;
  fileUrl: string;
  thumbnailUrl?: string | null;
};

export function buildHighlightGalleryItems(
  files?: HighlightGalleryFile[] | null,
): MediaGalleryItem[] {
  return (files || [])
    .filter((file) => file.fileUrl.trim().length > 0)
    .map((file) => ({
      url: file.fileUrl,
      thumbnailUrl: file.thumbnailUrl,
      type: file.fileType === 2 ? 'video' : 'image',
    }));
}
