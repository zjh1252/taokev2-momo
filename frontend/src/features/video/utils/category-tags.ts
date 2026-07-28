import { ROUTES } from '@/config/routes';

type CategoryTagSource = {
  categoryId?: number | null;
  categoryName?: string | null;
  subCategoryId?: number | null;
  subCategoryName?: string | null;
  keywords?: string | null;
};

export function buildVideoCategoryTags(
  video: CategoryTagSource,
): { label: string; href?: string }[] {
  const name = video.categoryName?.trim();
  if (!name) return [];
  const href =
    video.categoryId != null
      ? `${ROUTES.ONLINE_COURSES}?categoryId=${video.categoryId}`
      : undefined;
  return [{ label: name, href }];
}
