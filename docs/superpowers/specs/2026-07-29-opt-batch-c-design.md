# 待优化记录 Batch C 设计（尖刀）

**日期**：2026-07-29  
**来源**：`docs/tmp/待优化记录.pdf` 条目 4.x、7（SEO/301；CDN 后置）  
**范围**：主要 `frontend/`（`proxy.ts`、路由常量、录播外链）  
**策略**：方案 1 — 先堵 SEO 风险最高缺口；不做全量 CDN / 全量老城 URL  

已确认：§1 尖刀范围 OK（2026-07-29）。

## 1. 目标与非目标

### 目标

1. **录播课对外 SEO 统一为 `/video`**（无 s），与老站 `https://www.taoke.com/video` 一致；站内生成链接不再用 `/videos` 频道页、`/vedio` 列表页。
2. **停止误解析**老站数字筛选 URL（如 `/trainer/501/0/0/.../1.htm`），改为 **301** 到安全目标，避免空筛选页被收录。
3. **别名页改永久跳转**：`/experts`、`/instructors` 等使用 **301 / permanentRedirect**。

### 非目标（本批不做）

- L2「仅二级名」独立 URL（当前 `field=一级_二级` 保留）
- 老站城市 URL 全表 301、`/cities/*` → `/city/*` canonical 全覆盖
- Next.js `assetPrefix` / nginx 静态 CDN 分流（PDF #7 静态后置；legacy 附件 CDN 已有）
- 智能客服 iframe、Batch D 后续

## 2. 现状摘要

| 能力 | 现状 |
|------|------|
| SEO rewrite | `frontend/src/proxy.ts`：`/video`→内部 `/videos`；`/vedio` 同；专家筛选 `field=`/`industry=` 已支持 |
| 站内链接 | `ROUTES.ONLINE_COURSES = '/videos'`；列表 `navigateToSeoPath('/vedio')`；卡片 `/vedio/{id}.htm` |
| 老数字筛选 | 落入「任意 `.htm` → slug」分支，`parseSlug` 无法解析 → **空筛选** |
| 301 | 几乎无；`experts` 等为默认 307 |

## 3. 设计细节

### 3.1 录播 canonical `/video`

**常量**

- `ROUTES.ONLINE_COURSES`、`ROUTES.VIDEOS` → **`/video`**
- 站内频道导航、搜索前缀、404 快捷入口、用户中心「录播课」等凡指向**列表页**的，统一 `/video`

**详情 / 播放**

- 对外 SEO 详情：`/video/{id}.htm`（与 proxy 已有 `/video/{id}` 能力对齐）
- 播放：`/video/{id}/play`（proxy 已支持）
- 同步改：`VideoCard`、机构/专家侧栏等 `/vedio/{id}.htm` → `/video/{id}.htm`
- `is-detail-page-path` 已将内部 `videos`/`vedio` 映到 SEO `video`；补测覆盖新路径

**proxy**

- 保留：`/video` rewrite → `/{locale}/videos`（内部 App Router 目录仍叫 `videos/`，**不强制改目录名**）
- 新增 **301**：
  - 精确 `/videos` → `/video`（保留 query）
  - 精确 `/vedio` → `/video`
- 详情：`/vedio/{id}(.htm)` → **301** `/video/{id}.htm`（可选同批；推荐同批以免双入口）
- `/video_play/{id}.htm` 已有 rewrite，本批可改为 **301** 到 `/video/{id}/play`（更利 SEO；若改动面过大可保留 rewrite）

**列表重置**

- `VideoListSection`：`navigateToSeoPath('/vedio')` → `'/video'`

### 3.2 老站数字筛选 URL（专家列表）

**识别**（在现有「筛选 `.htm` → slug」**之前**）：

```
/^\/trainer\/(\d+)(\/\d+)+(\/def)?(\/\d+)*\.htm$/
```

或等价：后缀 `.htm`、且第一段为纯数字、后续仍有数字/`def` 段 —— **且不是** `/trainer/{id}.htm` 详情、**不是** `/trainer/{id}/{section}.htm`。

**行为（本尖刀，禁止臆测段位语义）**

经检索：仓库内**无**老站 `/trainer/{catId}/0/0/.../1.htm` 段位文档或现成映射表。  
因此本批**不做**「501 → 经营战略」臆猜映射。

统一：

1. 命中数字筛选模式 → **301 → `/trainer`**（保留无关 query 若有）
2. 单测锁定：示例 PDF 路径与若干变体均 301 到 `/trainer`，且**不再** rewrite 为 `?slug=501/0/0/...`

**后续（非本批）**

- 从老库/对照表生成 `legacy-trainer-filter-map.json`（ID→`field=`/`industry=` 名称）后，再改为 301 到具体 SEO URL。

### 3.3 别名永久跳转

| 源 | 目标 | 状态码 |
|----|------|--------|
| `/experts`、`/instructors`（及 locale 内等价页） | `/trainer` | **301**（`permanentRedirect`） |
| `/experts/[id]` | `/trainer/{id}.htm` | **301** |
| `proxy` 已有 `/trainer/{id}/course.htm` → `courses.htm` | 保持 **308** 或改为 **301**（二选一，推荐统一 301） |

### 3.4 验收

- 打开 `/video`：录播列表正常；地址栏为 `/video`
- `/videos`、`/vedio` 频道页：301 到 `/video`
- 列表卡片进入详情：地址为 `/video/{id}.htm`（或经 301 后落此）
- 访问 PDF 示例型 `/trainer/501/0/0/.../1.htm`：301 到 `/trainer`，**不是**空筛选列表伪成功
- `/experts`：301 到 `/trainer`

## 4. 风险与回滚

- 站内大量 `/videos` **API** 路径（`/videos?…`、`/videos/categories`）**禁止改动**——仅改浏览器 SEO/导航 path。
- 内部 App 目录仍为 `app/.../videos/`，仅靠 proxy rewrite，降低搬目录风险。
- 数字 URL 先收口到 `/trainer` 可能暂时损失「带筛选的旧收录落地」——优于错误空页；有映射表后再精细化。

## 5. 落地顺序

1. proxy：数字筛选 301 + `/videos`/`/vedio` 频道 301  
2. ROUTES + 列表/卡片外链统一 `/video`  
3. experts/instructors permanentRedirect  
4. 单测：`proxy` 纯函数抽取或对匹配/目标 URL 的单元测试  

---

**状态**：已确认（2026-07-29）；plan：`docs/superpowers/plans/2026-07-29-opt-batch-c.md`。
