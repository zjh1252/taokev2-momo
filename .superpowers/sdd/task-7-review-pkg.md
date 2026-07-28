# Review Package Task 7

Base: ff73cd00d19d4ec92b739ac569dde1358a879dd7
Head: 0902425c1349a585e5b870c48723f113bd5ec31d

## Commits

0902425c fix(frontend): 视频播放页高缩放布局左右留白均衡

## Stat

 frontend/src/app/[locale]/(public)/videos/[id]/play/page.tsx        | 2 +-
 .../src/features/video/components/play/VideoPlayPageContent.tsx     | 6 +++---
 2 files changed, 4 insertions(+), 4 deletions(-)

## Diff

```diff
diff --git a/frontend/src/app/[locale]/(public)/videos/[id]/play/page.tsx b/frontend/src/app/[locale]/(public)/videos/[id]/play/page.tsx
index 84620c00..8025f3b0 100644
--- a/frontend/src/app/[locale]/(public)/videos/[id]/play/page.tsx
+++ b/frontend/src/app/[locale]/(public)/videos/[id]/play/page.tsx
@@ -41,18 +41,18 @@ export default async function VideoPlayPage({ params, searchParams }: PageProps)
 
   let video;
   try {
     video = await getVideoDetail(numId);
   } catch {
     notFound();
   }
 
   return (
     <main className="min-h-screen bg-gradient-to-b from-slate-100/80 via-slate-50 to-white">
-      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col gap-6 md:gap-8">
+      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col gap-6 md:gap-8">
         <VideoDetailShell video={video} preferredChapterId={preferredChapterId}>
           <VideoPlayPageContent video={video} />
         </VideoDetailShell>
       </div>
     </main>
   );
 }
diff --git a/frontend/src/features/video/components/play/VideoPlayPageContent.tsx b/frontend/src/features/video/components/play/VideoPlayPageContent.tsx
index 4e659108..ace23aac 100644
--- a/frontend/src/features/video/components/play/VideoPlayPageContent.tsx
+++ b/frontend/src/features/video/components/play/VideoPlayPageContent.tsx
@@ -82,21 +82,21 @@ export function VideoPlayPageContent({ video }: VideoPlayPageContentProps) {
   const poster = resolveImageSrc(video.coverUrl, '') || undefined;
   const showPlayer =
     accessible &&
     playbackSrc &&
     playbackMode &&
     playbackMode !== 'unsupported';
 
   return (
     <div className="flex flex-col gap-8">
       {/* 播放器 + 评价卡片 */}
-      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-stretch">
+      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(240px,280px)] gap-6 items-stretch max-w-6xl mx-auto w-full">
         <div className="relative group">
           <div className="absolute -inset-1 bg-gradient-to-br from-slate-900/20 via-primary/10 to-slate-900/20 rounded-[1.25rem] blur-sm opacity-70 group-hover:opacity-90 transition-opacity" />
           <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#0f1419] shadow-2xl ring-1 ring-black/10">
             {accessLoading ? (
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="size-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
               </div>
             ) : showPlayer ? (
               <VideoPlayerShell
                 key={`${playbackSrc}-${currentChapterId ?? ''}-${initialTime ?? 0}`}
@@ -138,27 +138,27 @@ export function VideoPlayPageContent({ video }: VideoPlayPageContentProps) {
             )}
           </div>
           {currentTitle && showPlayer ? (
             <p className="mt-3 text-sm text-slate-600 pl-1">
               正在播放：
               <span className="text-slate-900 font-medium">{currentTitle}</span>
             </p>
           ) : null}
         </div>
 
-        <div className="hidden xl:block min-h-[280px]">
+        <div className="hidden lg:block min-h-[280px]">
           <VideoPlayRatingCard video={video} />
         </div>
       </div>
 
       {/* 移动端评价卡片 */}
-      <div className="xl:hidden">
+      <div className="lg:hidden">
         <VideoPlayRatingCard video={video} />
       </div>
 
       {/* 操作栏：本节介绍 / 分享 / 播放量 */}
       <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-200/80">
         <div className="flex flex-wrap items-center gap-6 text-sm">
           <span className="inline-flex items-center gap-2 text-slate-700 font-medium">
             <BookOpen className="size-4 text-primary" />
             本节介绍
           </span>

```
