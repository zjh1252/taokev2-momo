# Review Package Task 3

Base: a321c83178b41ec0c269810744347a88a57c289a
Head: a978eb76877661233d70435243ec9e87c43335e7

## Commits

a978eb76 fix(frontend): 配置顶栏集团产品外链并移除淘课网入口

## Stat

 frontend/src/components/layout/top-nav-bar.tsx | 17 +++++++++--------
 1 file changed, 9 insertions(+), 8 deletions(-)

## Diff

```diff
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

```
