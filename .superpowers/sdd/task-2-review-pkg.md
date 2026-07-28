# Review Package Task 2

Base: 6e9e3ddfe7f0ec26f40d5b9b2f4f6ca39dee6181
Head: a321c831

## Commits

a321c831 fix(frontend): 首页推荐专家大卡简介铺满可用高度

## Stat

 frontend/src/features/home/components/ExpertsSection.tsx | 6 ++++--
 1 file changed, 4 insertions(+), 2 deletions(-)

## Diff

```diff
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

```
