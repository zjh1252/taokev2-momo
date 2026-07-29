# 待优化记录 Batch D 设计（尖刀）

**日期**：2026-07-29  
**来源**：`docs/tmp/待优化记录.pdf` 条目 1、2、8  
**范围**：`backend/` + `frontend/` + `admin-frontend/`  
**策略**：方案 1 — 分项尖刀，每项可独立验收；不做全量聚合/全站 rem  

已确认：

| 项 | 约定 |
|----|------|
| D1 §1.2 | **A**：保留 `sortBy=time` + `ENROLLING`，靠 Redis 缓存 |
| D2 范围 | **C**：C 端 + 管理端 |
| D8 | 分域点修，**不做**全站 rem |

## 1. 目标与非目标

### 目标

1. **D1**：降低城市综合页（尤其沪/京）SSR TTFB，使带 `cityIds` 的公开课列表可走 Redis。
2. **D2**：案例封面、机构 Logo、精彩瞬间封面、著作封面在新建/编辑提交时双端必填。
3. **D8**：Win11 125%/150% 下 C 端不被 `min-w-[1400px]` 撑死；Admin 分类树可横滚、弹窗不溢出。

### 非目标（本批不做）

- `/cities/{en}/home` 聚合接口、非首屏 lazy、物化列（D1 后续）
- 评价晒图、账号头像、CMS 轮播/页脚 QR、场地多图、存量补图（D2 后续）
- 全局 rem / PXB 全量适配（D8 后续）
- Batch C（URL/301/SEO）、智能客服 iframe（#15–17/#19–20）

## 2. D1 上海/北京性能

### 2.1 问题

`/city/{en}` 综合页并行打多块列表；带 `cityIds` 的公开课查询被 `PublicCourseListCache.isCacheableDefault` 排除；`CityUpcomingOpenBlock` 使用 `sortBy=time` + `enrollStatus=ENROLLING` + `size=10`，最重且无法命中缓存。

### 2.2 改动

**文件**：`backend/taoke-course/.../support/PublicCourseListCache.java`

1. `CACHEABLE_SIZES` 增加 `10`。
2. `isCacheableDefault`：
   - 允许 `cityIds` **恰好 1 个**（多城仍不缓存）。
   - 允许 `enrollStatus` 为空白或 `ENROLLING`（其它状态仍不缓存）。
3. **`listKey` 必须写入** `cityIds` 与 `enrollStatus`（当前 key 仅 `open|internal:sort:p:s`，否则多城串缓存）。
4. `evictPublicListCaches`：本轮 **不** 扫城市维 key；依赖 ~60min TTL + jitter。上架/下架仍清无城默认 key。
5. 前端 `CityUpcomingOpenBlock` **不改**查询参数（策略 A）。

### 2.3 验收

- 同城二次 SSR：公开课列表走 Redis（日志/断点可见 hit）。
- 沪/京列表口径与改前一致。
- 不同 `cityId` 不串缓存。

## 3. D2 图片必填

### 3.1 四类资源

| 资源 | 字段 | BE | C 端 | Admin |
|------|------|-----|------|-------|
| 专家案例 | `coverImage` | 已 `@NotBlank` | `CASE_RULES` 补必填；create/edit 标 `required` | create/edit 拒空封面 |
| 机构 Logo | `logoUrl` | `InstitutionRequest` 补 `@NotBlank`（申请/资料保存路径） | `InstitutionApplyForm` 规则 + UI `required` | 若有机构编辑 Logo 表单则同步；无则跳过 |
| 精彩瞬间 | `coverImage` | `SaveTrainerHighlightRequest` 补 `@NotBlank` | create/edit 页必填校验 | create 表单必填 |
| 著作封面 | `coverUrl` | `SaveTrainerBookRequest` 补 `@NotBlank` | 著作页已必填；入驻 `TrainerBooksEditor` 补校验 | create 表单必填 |

### 3.2 原则

- FE 拦截 + BE `@NotBlank`；仅新建/编辑提交；不做存量清洗。
- 文案：「请上传封面图」「请上传机构 Logo」。

### 3.3 验收

四类在 C/Admin 空图无法提交；直打 API 返回 400。

## 4. D8 Win11 DPI

### 4.1 C 端

`frontend/src/app/[locale]/(public)/layout.tsx`：去掉强制 `min-w-[1400px]`；保留外层 `overflow-x-auto` 作兜底；内容区继续用既有 `max-w-[1400px]`。

### 4.2 Admin

- `category-tree-table.tsx`：表格外层 `overflow-x-auto`，表 `min-w-[720px]`（或等价），窄视口可横滚。
- `category-form-dialog.tsx`：`DialogContent` 使用 `max-w-[min(420px,calc(100vw-2rem))]`（基座 Dialog 已有 `max-w-[calc(100%-2rem)]`，覆盖 `sm:max-w` 避免宽屏类名盖掉）。
- 课程 `DataTable` 已有横向 `ScrollBar`，本轮不改除非验收失败。

### 4.3 验收

125%/150%：C 端首页/列表可浏览；Admin 分类树可横滚、分类弹窗不溢出。

## 5. 落地顺序

1. D1（BE 缓存）→ 2. D2（BE 校验 + 双端表单）→ 3. D8（双端 layout）  
每项可单独 commit / PR。
