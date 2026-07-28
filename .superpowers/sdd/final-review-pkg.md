# Review Package Task final

Base: bd013af54bee95af18c33e71db7ff374bba4ebe5
Head: 0902425c1349a585e5b870c48723f113bd5ec31d

## Commits

0902425c fix(frontend): 视频播放页高缩放布局左右留白均衡
ff73cd00 fix(frontend): Video.js 播放器控件切换为中文
a984671f fix(frontend): 视频播放页分类标签仅保留一级
539283c6 fix(frontend): 专家详情 Tab 滚动避让顶栏并居中评价按钮
a978eb76 fix(frontend): 配置顶栏集团产品外链并移除淘课网入口
a321c831 fix(frontend): 首页推荐专家大卡简介铺满可用高度
6e9e3ddf fix(frontend): 专家筛选点选关浮层并统一常驻城市文案

## Stat

 .../[locale]/(public)/videos/[id]/play/page.tsx    |  2 +-
 frontend/src/components/layout/top-nav-bar.tsx     | 17 ++++++------
 .../features/home/components/ExpertsSection.tsx    |  6 +++--
 .../components/detail/TrainerDetailContent.tsx     | 22 ++++++++++++++-
 .../trainer/components/list/TrainerFilters.tsx     | 15 +++++++----
 .../video/components/play/VideoPlayPageContent.tsx | 31 ++++------------------
 .../video/components/player/VideoJsPlayer.tsx      |  4 +++
 .../src/features/video/utils/category-tags.test.ts | 30 +++++++++++++++++++++
 frontend/src/features/video/utils/category-tags.ts | 21 +++++++++++++++
 frontend/src/messages/zh-CN/trainer.json           |  2 +-
 10 files changed, 106 insertions(+), 44 deletions(-)

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
diff --git a/frontend/src/components/layout/top-nav-bar.tsx b/frontend/src/components/layout/top-nav-bar.tsx
index 89f64b4e..e051a6c5 100644
--- a/frontend/src/components/layout/top-nav-bar.tsx
+++ b/frontend/src/components/layout/top-nav-bar.tsx
@@ -1,24 +1,23 @@
 'use client';
 
 import { HeaderUserActions } from './header-user-actions';
 
 /** 集团产品矩阵链接 */
 const GROUP_LINKS = [
-  { label: '淘课集团', href: '#' },
-  { label: '淘课网', href: '#' },
-  { label: '培训宝', href: '#' },
-  { label: '目标通', href: '#' },
-  { label: 'AI 导师', href: '#' },
-  { label: '智能创导', href: '#' },
-  { label: 'AI 陪练', href: '#' },
-];
+  { label: '淘课集团', href: 'https://www.taoke.com.cn/' },
+  { label: '培训宝', href: 'https://www.91pxb.com/' },
+  { label: '目标通', href: 'https://www.91mbt.com/' },
+  { label: 'AI 导师', href: 'https://a23880.91pxb.com/pc_elearning/#/ai/mentor/604996/list' },
+  { label: '智能创导', href: 'https://a23880.91pxb.com/pc_elearning/#/ai/extraction/604996' },
+  { label: 'AI 陪练', href: 'https://a23880.91pxb.com/pc_elearning/#/ai/training_partner/604996/list' },
+] as const;
 
 /**
  * 顶部辅助导航栏 — 集团产品矩阵 + 用户认证区域
  * <p>
  * 右侧：已登录显示购物车 + 通知 + 用户区域；未登录仅显示"登录/注册"。
  * </p>
  *
  * @author Fangxinxin
  * @date 2026-04-01 23:05
  */
@@ -26,20 +25,22 @@ export function TopNavBar() {
   return (
     <div className="w-full bg-slate-50 border-b border-slate-100 text-xs py-1.5 px-8 z-50 sticky top-0">
       <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
         {/* 左侧：集团站点 */}
         <div className="flex items-center gap-3 text-slate-500">
           {GROUP_LINKS.map((link, i) => (
             <span key={link.label} className="flex items-center gap-3">
               {i > 0 && <span className="text-slate-300">|</span>}
               <a
                 href={link.href}
+                target="_blank"
+                rel="noopener noreferrer"
                 className="hover:text-primary transition-colors"
               >
                 {link.label}
               </a>
             </span>
           ))}
         </div>
 
         <HeaderUserActions />
       </div>
diff --git a/frontend/src/features/home/components/ExpertsSection.tsx b/frontend/src/features/home/components/ExpertsSection.tsx
index 6127df2c..24e1e6d1 100644
--- a/frontend/src/features/home/components/ExpertsSection.tsx
+++ b/frontend/src/features/home/components/ExpertsSection.tsx
@@ -148,23 +148,25 @@ function MainExpertCard({ expert }: { expert: Expert }) {
         <h3 className="text-3xl font-black mb-2 text-slate-800 truncate">
           {expert.name}
           {copy.title ? (
             <span className="text-lg font-normal text-slate-500 ml-2">{copy.title}</span>
           ) : null}
         </h3>
         {copy.subtitle ? (
           <p className="text-primary text-sm font-bold mb-3 line-clamp-2">{copy.subtitle}</p>
         ) : null}
         {copy.bio ? (
-          <p className="text-slate-500 text-sm mb-4 leading-relaxed line-clamp-6">{copy.bio}</p>
+          <p className="text-slate-500 text-sm mb-4 leading-relaxed flex-1 min-h-0 overflow-hidden">
+            {copy.bio}
+          </p>
         ) : null}
-        <div className="mt-auto flex flex-col gap-4 pt-2">
+        <div className="mt-auto flex flex-col gap-4 pt-2 shrink-0">
           <ExpertTagList
             tags={expert.tags}
             limit={4}
             tagClassName="bg-slate-100 text-slate-600 px-3 py-1 rounded text-xs font-medium"
           />
           <span className="bg-primary text-white px-6 py-3 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 w-full shadow-sm">
             查看专家详情
           </span>
         </div>
       </div>
diff --git a/frontend/src/features/trainer/components/detail/TrainerDetailContent.tsx b/frontend/src/features/trainer/components/detail/TrainerDetailContent.tsx
index 100508d1..1f9e87ef 100644
--- a/frontend/src/features/trainer/components/detail/TrainerDetailContent.tsx
+++ b/frontend/src/features/trainer/components/detail/TrainerDetailContent.tsx
@@ -123,37 +123,46 @@ export function TrainerDetailTabs({
                 )}
               </Link>
             );
           })}
         </div>
       </nav>
     </div>
   );
 }
 
+const TRAINER_DETAIL_HEADER_OFFSET = 120;
+
 export function TrainerDetailContent({
   activeTab,
   trainer,
   courses,
   coursesTotal,
   cases,
   highlights = [],
   videos,
   videosTotal,
   books,
 }: TrainerDetailContentProps) {
   const displayName = getTrainerDisplayName(trainer);
 
+  useEffect(() => {
+    if (activeTab === 'comments') return;
+    const el = document.getElementById('trainer-detail-tab-panel');
+    if (!el) return;
+    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
+  }, [activeTab]);
+
   return (
     <>
       {/* Tab 内容区 */}
-      <div className="min-h-[800px]">
+      <div id="trainer-detail-tab-panel" className="min-h-[800px] scroll-mt-[120px]">
         {activeTab === 'home' && (
           <HomeView trainer={trainer} courses={courses} coursesTotal={coursesTotal} cases={cases} />
         )}
         {activeTab === 'courses' && (
           <CoursesView trainerId={trainer.id} initialCourses={courses} total={coursesTotal} />
         )}
         {activeTab === 'cases' && <CasesView cases={cases} />}
         {activeTab === 'highlights' && (
           <HighlightsView trainerId={trainer.id} initialHighlights={highlights} />
         )}
@@ -917,36 +926,47 @@ function ReviewsView({
 
   useEffect(() => {
     getPublicReviews('TRAINER', { trainerUserId, page: 0, size: 50 })
       .then((page) => {
         setReviews(page.list);
         setLoaded(true);
       })
       .catch(() => setLoaded(true));
   }, [trainerUserId]);
 
+  useEffect(() => {
+    const el = document.getElementById('trainer-review-cta');
+    if (!el) return;
+    const rect = el.getBoundingClientRect();
+    const absoluteTop = window.scrollY + rect.top;
+    const target = absoluteTop - window.innerHeight / 2 + rect.height / 2;
+    const y = Math.max(target, absoluteTop - TRAINER_DETAIL_HEADER_OFFSET);
+    window.scrollTo({ top: y, behavior: 'smooth' });
+  }, [trainerUserId]);
+
   const summaryScore =
     trainerScore > 0
       ? trainerScore
       : reviews.length
         ? reviews.reduce((sum, r) => sum + Number(r.avgScore), 0) / reviews.length
         : 0;
   const summaryTotal = reviewTotal > 0 ? reviewTotal : reviews.length;
 
   return (
     <div className="bg-white border border-slate-200 rounded-xl p-6">
       <div className="space-y-3">
         <ReviewScoreSummary
           score={summaryScore}
           total={summaryTotal}
           action={
             <button
+              id="trainer-review-cta"
               type="button"
               onClick={handleOpenReview}
               className="shrink-0 px-4 py-2 rounded-md bg-primary text-white text-sm cursor-pointer hover:bg-primary/90 transition-colors"
             >
               我要评价
             </button>
           }
         />
         {reviews.length === 0 && loaded && (
           <p className="text-sm text-slate-400 py-8 text-center">暂无评价数据</p>
diff --git a/frontend/src/features/trainer/components/list/TrainerFilters.tsx b/frontend/src/features/trainer/components/list/TrainerFilters.tsx
index 33c28eb3..caf4b76e 100644
--- a/frontend/src/features/trainer/components/list/TrainerFilters.tsx
+++ b/frontend/src/features/trainer/components/list/TrainerFilters.tsx
@@ -7,59 +7,59 @@ import type { CategoryTreeNode } from '../../types';
 
 /**
  * 专家列表页 — 左侧筛选侧栏
  *
  * <p>设计要点：</p>
  * <ul>
  *   <li>左侧只列分类标题，鼠标 hover 弹出右侧浮层选项面板。</li>
  *   <li>「擅长领域」按二级分类展示：选中一级直接传一级名；
  *       选中二级传 {@code "一级_二级"}；后端按叶子节点搜索。</li>
  *   <li>「擅长行业」单选，点击即替换。</li>
- *   <li>「长驻省市」单选，从 {@code GET /regions/children} 拉取省份列表。</li>
+ *   <li>「常驻城市」单选，从 {@code GET /regions/children} 拉取省份列表。</li>
  *   <li>全部参数均可选可清，点「全部/不限」清除。</li>
  * </ul>
  *
  * @author Fangxinxin
  * @date 2026-04-22 18:00
  */
 
 export interface TrainerFilterValue {
   /** 擅长领域 — 一级名称（无二级时直接传一级） */
   fieldParentName?: string;
   /** 擅长领域 — 二级名称（有则传 "一级_二级"） */
   fieldChildName?: string;
   /** 擅长领域分类 ID（优先于名称解析） */
   expertiseCategoryId?: number;
   /** 擅长行业 — 行业名称 */
   industryName?: string;
   /** 擅长行业分类 ID */
   industryCategoryId?: number;
-  /** 长驻省市 — 省份名称 */
+  /** 常驻城市 — 省份名称 */
   regionName?: string;
-  /** 长驻省市 — 省份 ID（传给后端筛选） */
+  /** 常驻城市 — 省份 ID（传给后端筛选） */
   provinceId?: number;
   /** 质量承诺 */
   trustedOnly?: boolean;
 }
 
 type FilterKey = 'expertise' | 'industry' | 'province';
 
 interface FilterMeta {
   key: FilterKey;
   label: string;
   flyoutWidth: number;
 }
 
 const FILTER_ITEMS: FilterMeta[] = [
   { key: 'expertise', label: '擅长领域', flyoutWidth: 520 },
   { key: 'industry', label: '擅长行业', flyoutWidth: 520 },
-  { key: 'province', label: '长驻省市', flyoutWidth: 520 },
+  { key: 'province', label: '常驻城市', flyoutWidth: 520 },
 ];
 
 interface RegionItem {
   id: number;
   code: string;
   name: string;
   level: number;
   hasChildren: boolean;
 }
 
@@ -93,38 +93,43 @@ export function TrainerFilters({
 
   const handleMouseEnter = useCallback((key: FilterKey) => {
     if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null; }
     setActiveFilter(key);
   }, []);
 
   const handleMouseLeave = useCallback(() => {
     leaveTimer.current = setTimeout(() => setActiveFilter(null), 80);
   }, []);
 
+  const closeFlyout = () => setActiveFilter(null);
+
   // ---- 擅长领域：追踪 parent + child + 分类 ID ----
   const handleExpertisePick = (parentName?: string, childName?: string, categoryId?: number) => {
     onChange({
       ...value,
       fieldParentName: parentName,
       fieldChildName: childName,
       expertiseCategoryId: categoryId,
     });
+    closeFlyout();
   };
 
   // ---- 擅长行业：单选 ----
   const handleIndustryPick = (name?: string, categoryId?: number) => {
     onChange({ ...value, industryName: name, industryCategoryId: categoryId });
+    closeFlyout();
   };
 
-  // ---- 长驻省市：单选 ----
+  // ---- 常驻城市：单选 ----
   const handleProvincePick = (item?: RegionItem) => {
     onChange({ ...value, regionName: item?.name, provinceId: item?.id });
+    closeFlyout();
   };
 
   const activeMeta = FILTER_ITEMS.find((f) => f.key === activeFilter);
 
   return (
     <div className="w-[227px] h-[306px] shrink-0 relative" onMouseLeave={handleMouseLeave}>
       <aside className="h-full bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
         <h2 className="px-4 py-3 text-sm font-bold text-slate-800 border-b border-slate-100">
           讲师筛选条件
         </h2>
diff --git a/frontend/src/features/video/components/play/VideoPlayPageContent.tsx b/frontend/src/features/video/components/play/VideoPlayPageContent.tsx
index 7018fb9f..ace23aac 100644
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
@@ -103,21 +82,21 @@ export function VideoPlayPageContent({ video }: VideoPlayPageContentProps) {
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
@@ -159,27 +138,27 @@ export function VideoPlayPageContent({ video }: VideoPlayPageContentProps) {
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
diff --git a/frontend/src/features/video/components/player/VideoJsPlayer.tsx b/frontend/src/features/video/components/player/VideoJsPlayer.tsx
index e5a2d803..583199dd 100644
--- a/frontend/src/features/video/components/player/VideoJsPlayer.tsx
+++ b/frontend/src/features/video/components/player/VideoJsPlayer.tsx
@@ -1,15 +1,18 @@
 'use client';
 
 import { useEffect, useRef, useCallback, useMemo } from 'react';
 import videojs from 'video.js';
 import type Player from 'video.js/dist/types/player';
+import zhCN from 'video.js/dist/lang/zh-CN.json';
+
+videojs.addLanguage('zh-CN', zhCN);
 import 'video.js/dist/video-js.css';
 import './video-player.css';
 import { inferVideoMimeType } from '../../lib/playback-sources';
 import { resolveVideoPlaybackSrc } from '@/lib/media';
 import { updateVideoProgress } from '../../api/service';
 
 type VideoJsPlayerProps = {
   src: string;
   poster?: string | null;
   className?: string;
@@ -75,20 +78,21 @@ export function VideoJsPlayer({
 
     const videoEl = document.createElement('video-js');
     videoEl.classList.add('video-js', 'vjs-big-play-centered', 'vjs-fill');
     videoEl.setAttribute('playsinline', '');
     videoEl.setAttribute('referrerpolicy', 'no-referrer');
     container.replaceChildren(videoEl);
 
     const player = videojs(videoEl, {
       controls: true,
       fill: true,
+      language: 'zh-CN',
       autoplay: autoplay ?? false,
       preload: 'metadata',
       poster: poster ?? undefined,
       playbackRates: [0.5, 1, 1.25, 1.5, 2],
       html5: {
         vhs: {
           overrideNative: !useNativeMp4,
         },
       },
       sources: [{ src: playbackUrl, type: mimeType }],
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
diff --git a/frontend/src/messages/zh-CN/trainer.json b/frontend/src/messages/zh-CN/trainer.json
index 0e8ea4e5..a8377a51 100644
--- a/frontend/src/messages/zh-CN/trainer.json
+++ b/frontend/src/messages/zh-CN/trainer.json
@@ -1,20 +1,20 @@
 {
   "page": {
     "listTitle": "培训专家",
     "listDesc": "发现全国优秀培训专家，助力企业人才发展",
     "detailTitle": "专家详情"
   },
   "filters": {
     "expertise": "擅长领域",
     "industry": "擅长行业",
-    "city": "常驻省市",
+    "city": "常驻城市",
     "sort": "排序",
     "all": "不限",
     "sortDefault": "综合排序",
     "sortScore": "好评率"
   },
   "tabs": {
     "home": "主页",
     "courses": "主讲课程",
     "cases": "授课案例",
     "clips": "录播课",

```
