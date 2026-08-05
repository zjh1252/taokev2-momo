# Review Package Task 5

Base: 539283c67e77f149720a0b9197463b3a9622a712
Head: a984671f09402121a93298236b16945a57a64dc1

## Commits

a984671f fix(frontend): 视频播放页分类标签仅保留一级

## Stat

 .../video/components/play/VideoPlayPageContent.tsx | 25 ++----------------
 .../src/features/video/utils/category-tags.test.ts | 30 ++++++++++++++++++++++
 frontend/src/features/video/utils/category-tags.ts | 21 +++++++++++++++
 3 files changed, 53 insertions(+), 23 deletions(-)

## Diff

```diff
diff --git a/frontend/src/features/video/components/play/VideoPlayPageContent.tsx b/frontend/src/features/video/components/play/VideoPlayPageContent.tsx
index 7018fb9f..4e659108 100644
--- a/frontend/src/features/video/components/play/VideoPlayPageContent.tsx
+++ b/frontend/src/features/video/components/play/VideoPlayPageContent.tsx
@@ -1,17 +1,18 @@
 'use client';
 
 import { useMemo } from 'react';
 import { BookOpen, Eye, Lock, Share2, Tag } from 'lucide-react';
 import { toast } from 'sonner';
 import { Link } from '@/i18n/navigation';
 import { ROUTES } from '@/config/routes';
+import { buildVideoCategoryTags } from '../../utils/category-tags';
 import { SafeImage } from '@/components/safe-image';
 import { resolveImageSrc, getVideoCoverFallback } from '@/lib/media';
 import type { VideoDetail, VideoChapter } from '../../api/types';
 import { useVideoPlayback } from '../../context/video-playback-context';
 import { VideoPlayerShell } from '../player/VideoPlayerShell';
 import { VideoPlayRatingCard } from './VideoPlayRatingCard';
 
 type VideoPlayPageContentProps = {
   video: VideoDetail;
 };
@@ -55,43 +56,21 @@ export function VideoPlayPageContent({ video }: VideoPlayPageContentProps) {
     const cp = progressInfo.chapters.find((c) => c.chapterId === currentChapterId);
     if (cp && cp.progress > 0 && cp.progress < 100 && cp.chapterDuration > 0) {
       return Math.floor((cp.chapterDuration * cp.progress) / 100);
     }
     if (cp?.watchDuration && cp.watchDuration > 0 && cp.chapterDuration > 0) {
       if (cp.watchDuration < cp.chapterDuration) return cp.watchDuration;
     }
     return undefined;
   }, [progressInfo, currentChapterId]);
 
-  const categoryTags = useMemo(() => {
-    const tags: { label: string; href?: string }[] = [];
-    if (video.categoryName) {
-      tags.push({
-        label: video.categoryName,
-        href: `${ROUTES.ONLINE_COURSES}?categoryId=${video.categoryId}`,
-      });
-    }
-    if (video.subCategoryName && video.subCategoryId) {
-      tags.push({
-        label: video.subCategoryName,
-        href: `${ROUTES.ONLINE_COURSES}?categoryId=${video.categoryId}&subCategoryId=${video.subCategoryId}`,
-      });
-    }
-    if (video.keywords) {
-      video.keywords
-        .split(/[,，、\s]+/)
-        .filter(Boolean)
-        .slice(0, 4)
-        .forEach((kw) => tags.push({ label: kw }));
-    }
-    return tags;
-  }, [video]);
+  const categoryTags = useMemo(() => buildVideoCategoryTags(video), [video]);
 
   const handleShare = async () => {
     const url = typeof window !== 'undefined' ? window.location.href : '';
     try {
       if (navigator.share) {
         await navigator.share({ title: video.title, url });
         return;
       }
       await navigator.clipboard.writeText(url);
       toast.success('链接已复制，快去分享吧');
diff --git a/frontend/src/features/video/utils/category-tags.test.ts b/frontend/src/features/video/utils/category-tags.test.ts
new file mode 100644
index 00000000..fa24d730
--- /dev/null
+++ b/frontend/src/features/video/utils/category-tags.test.ts
@@ -0,0 +1,30 @@
+import { describe, expect, it } from 'vitest';
+import { buildVideoCategoryTags } from './category-tags';
+
+describe('buildVideoCategoryTags', () => {
+  it('returns only the first category when sub and keywords exist', () => {
+    const tags = buildVideoCategoryTags({
+      categoryId: 1,
+      categoryName: '领导力',
+      subCategoryId: 2,
+      subCategoryName: '中层管理',
+      keywords: '沟通,演讲',
+    });
+    expect(tags).toEqual([
+      { label: '领导力', href: expect.stringContaining('categoryId=1') },
+    ]);
+    expect(tags).toHaveLength(1);
+  });
+
+  it('returns empty when no categoryName', () => {
+    expect(
+      buildVideoCategoryTags({
+        categoryId: null,
+        categoryName: null,
+        subCategoryId: 2,
+        subCategoryName: '中层管理',
+        keywords: '沟通',
+      }),
+    ).toEqual([]);
+  });
+});
diff --git a/frontend/src/features/video/utils/category-tags.ts b/frontend/src/features/video/utils/category-tags.ts
new file mode 100644
index 00000000..aae49b1d
--- /dev/null
+++ b/frontend/src/features/video/utils/category-tags.ts
@@ -0,0 +1,21 @@
+import { ROUTES } from '@/config/routes';
+
+type CategoryTagSource = {
+  categoryId?: number | null;
+  categoryName?: string | null;
+  subCategoryId?: number | null;
+  subCategoryName?: string | null;
+  keywords?: string | null;
+};
+
+export function buildVideoCategoryTags(
+  video: CategoryTagSource,
+): { label: string; href?: string }[] {
+  const name = video.categoryName?.trim();
+  if (!name) return [];
+  const href =
+    video.categoryId != null
+      ? `${ROUTES.ONLINE_COURSES}?categoryId=${video.categoryId}`
+      : undefined;
+  return [{ label: name, href }];
+}

```
