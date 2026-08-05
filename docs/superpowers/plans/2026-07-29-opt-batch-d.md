# Batch D（D1/D2/D8 尖刀）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 落实 PDF #1/#2/#8 尖刀：城市公开课 Redis 缓存、四类图片双端必填、C 端去掉强制 1400 最小宽 + Admin 分类树/弹窗适配。

**Architecture:** D1 只扩 `PublicCourseListCache` 可缓存条件与 key 维；D2 对缺口字段补 `@NotBlank` + C/Admin 表单校验；D8 点修 public layout 与分类树/弹窗，不做 rem。

**Tech Stack:** Java 21 / Spring Boot、Next.js 16、Zod / 自研 `validateForm`、Redis、JUnit

**Spec:** `docs/superpowers/specs/2026-07-29-opt-batch-d-design.md`

## Global Constraints

- 策略：方案 1 尖刀；D1 §1.2 选 A（不改 `CityUpcomingOpenBlock` 查询参数）
- D2 范围 C 端 + Admin；仅新建/编辑，不做存量补图
- D8 不做全站 rem / PXB 全量
- 后端测试在 `backend/` 下用模块范围命令；注释中文；类注释 `@author Fangxinxin` + `@date`
- 禁止改无关架构；优先复用现有校验模式

## File map

| 区域 | 文件 | 职责 |
|------|------|------|
| D1 | `backend/.../PublicCourseListCache.java` | 可缓存条件 + key 含 city/enroll |
| D1 | `backend/.../PublicCourseListCacheTest.java`（新建） | 单测 isCacheable / listKey |
| D2 BE | `SaveTrainerHighlightRequest.java`、`SaveTrainerBookRequest.java`、`InstitutionRequest.java` | `@NotBlank` |
| D2 C | `case-form-rules.ts`、cases create/edit、highlights create/edit、`InstitutionApplyForm.tsx`、`TrainerBooksEditor.tsx` | FE 必填 |
| D2 Admin | `case-create-form.tsx`、`highlight-create-form.tsx`、`book-create-form.tsx` | FE 必填 |
| D8 | `(public)/layout.tsx`、`category-tree-table.tsx`、`category-form-dialog.tsx` | 布局适配 |

---

### Task 1: D1 — PublicCourseListCache 城市可缓存

**Files:**
- Modify: `backend/taoke-course/src/main/java/com/taoke/course/support/PublicCourseListCache.java`
- Create: `backend/taoke-course/src/test/java/com/taoke/course/support/PublicCourseListCacheTest.java`

**Interfaces:**
- Consumes: `PublicCourseQuery`（`cityIds`、`enrollStatus`、`size`、`sortBy`、`isOpen`、`page`）
- Produces: `isCacheableDefault` 对单城 + size=10 + ENROLLING 返回 true；`listKey` 区分 city/enroll

- [ ] **Step 1: 写失败单测**

```java
package com.taoke.course.support;

import com.taoke.course.dto.course.PublicCourseQuery;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class PublicCourseListCacheTest {

    @Mock StringRedisTemplate stringRedisTemplate;
    @Mock ObjectMapper objectMapper;
    @InjectMocks PublicCourseListCache cache;

    private PublicCourseQuery cityUpcoming(int cityId) {
        PublicCourseQuery q = new PublicCourseQuery();
        q.setIsOpen(true);
        q.setPage(1);
        q.setSize(10);
        q.setSortBy("time");
        q.setCityIds(List.of(cityId));
        q.setEnrollStatus("ENROLLING");
        return q;
    }

    @Test
    void isCacheable_singleCityEnrollingSize10() {
        assertTrue(cache.isCacheableDefault(cityUpcoming(2)));
    }

    @Test
    void isCacheable_rejectsMultiCity() {
        PublicCourseQuery q = cityUpcoming(2);
        q.setCityIds(List.of(2, 3));
        assertFalse(cache.isCacheableDefault(q));
    }

    @Test
    void listKey_differsByCity() throws Exception {
        // 通过 put + 捕获 key，或把 listKey 包可见后断言；
        // 实现时用 ReflectionTestUtils / package-visible helper 断言：
        // key(shanghai) != key(beijing)，且均含 city 与 enroll 维
        assertNotEquals(
                invokeListKey(cityUpcoming(2)),
                invokeListKey(cityUpcoming(1)));
    }

    // invokeListKey: 反射调用 private listKey(PublicCourseQuery)
}
```

- [ ] **Step 2: 跑测确认失败**

```bash
cd backend
mvn -pl taoke-course -Dtest=PublicCourseListCacheTest test
```

Expected: FAIL（size 10 / city 仍不可缓存，或 key 相同）

- [ ] **Step 3: 实现缓存条件与 key**

在 `PublicCourseListCache`：

1. `CACHEABLE_SIZES = Set.of(10, 15, 30, 36)`
2. `isCacheableDefault` 中：
   - `cityIds`：`null`/空 **或** `size()==1` 才过；`size()>1` → false
   - `enrollStatus`：`null`/blank **或** `"ENROLLING"`（忽略大小写 trim）才过；其它 → false
3. `listKey(PublicCourseQuery)` 改为包含：
   - `city` 段：无城 → `c0`；单城 → `c{id}`
   - `enroll` 段：空白 → `e_`；否则 `e{normalized}`
   - 形如：`taoke:course:public:list:open:time:p1:s10:c2:eENROLLING`
4. `evictPublicListCaches` **保持**只删无城默认组合（不扫 `c*`）；城市 key 靠 TTL。注意：`listKey(boolean, sort, page, size)` 旧重载用于 evict 时应对齐「无城 + 无 enroll」后缀（`c0:e_`），避免清不到默认 key。

- [ ] **Step 4: 再跑测**

```bash
cd backend
mvn -pl taoke-course -Dtest=PublicCourseListCacheTest test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/taoke-course/src/main/java/com/taoke/course/support/PublicCourseListCache.java \
        backend/taoke-course/src/test/java/com/taoke/course/support/PublicCourseListCacheTest.java
git commit -m "$(cat <<'EOF'
perf(course): 允许单城公开课列表走 Redis 缓存

城市频道沪/京 SSR 的 cityIds+ENROLLING 查询此前被排除缓存；扩展可缓存条件并在 key 中区分城市与报名状态。
EOF
)"
```

---

### Task 2: D2 BE — highlight / book / institution Logo 必填

**Files:**
- Modify: `backend/taoke-user/src/main/java/com/taoke/user/dto/trainerhighlight/SaveTrainerHighlightRequest.java`
- Modify: `backend/taoke-user/src/main/java/com/taoke/user/dto/trainerbook/SaveTrainerBookRequest.java`
- Modify: `backend/taoke-user/src/main/java/com/taoke/user/dto/institution/InstitutionRequest.java`

**Interfaces:**
- Consumes: 既有 `@Valid` Controller
- Produces: 空 `coverImage` / `coverUrl` / `logoUrl` → 400

- [ ] **Step 1: 补校验注解**

`SaveTrainerHighlightRequest.coverImage`:

```java
@NotBlank(message = "请上传封面图")
private String coverImage;
```

`SaveTrainerBookRequest.coverUrl`:

```java
@NotBlank(message = "请上传封面图")
private String coverUrl;
```

`InstitutionRequest.logoUrl`（保留 `@Size`，增加）：

```java
@NotBlank(message = "请上传机构 Logo")
@Size(max = 512, message = "Logo URL 不超过512个字符")
private String logoUrl;
```

注意：若机构「草稿/部分更新」路径复用同一 DTO 且允许空 Logo，需确认调用点；本 spec 要求申请/资料保存必填。若发现 PATCH 半更新冲突，改为仅在申请入口用独立 Request 或 Service 层校验——实现前先搜 `InstitutionRequest` 调用点，优先加注解，冲突则在 Service 申请路径显式校验。

- [ ] **Step 2: 确认案例已有 NotBlank**

`SaveTrainerCaseRequest.coverImage` 已有 `@NotBlank(message = "请上传封面图")` — 勿重复改。

- [ ] **Step 3: Commit**

```bash
git add backend/taoke-user/src/main/java/com/taoke/user/dto/trainerhighlight/SaveTrainerHighlightRequest.java \
        backend/taoke-user/src/main/java/com/taoke/user/dto/trainerbook/SaveTrainerBookRequest.java \
        backend/taoke-user/src/main/java/com/taoke/user/dto/institution/InstitutionRequest.java
git commit -m "$(cat <<'EOF'
fix(user): 精彩瞬间/著作/机构 Logo 后端必填校验

与图片必填尖刀对齐，防止绕过前端空封面提交。
EOF
)"
```

---

### Task 3: D2 C 端 — 案例 / 精彩瞬间 / 机构 / 入驻著作

**Files:**
- Modify: `frontend/src/features/trainer-case/lib/case-form-rules.ts`
- Modify: `frontend/src/app/[locale]/(usercenter)/dashboard/cases/create/page.tsx`（封面 FormField `required`）
- Modify: `frontend/src/app/[locale]/(usercenter)/dashboard/cases/[id]/edit/page.tsx`
- Modify: `frontend/src/app/[locale]/(usercenter)/dashboard/highlights/create/page.tsx`
- Modify: `frontend/src/app/[locale]/(usercenter)/dashboard/highlights/[id]/edit/page.tsx`
- Modify: `frontend/src/features/role-apply/components/role-forms/InstitutionApplyForm.tsx`
- Modify: `frontend/src/features/role-apply/components/TrainerBooksEditor.tsx`

- [ ] **Step 1: 案例规则**

`CASE_RULES` 增加：

```ts
coverImage: { required: true, requiredMessage: '请上传封面图' },
description: { required: true, requiredMessage: '请填写案例描述' }, // 若 BE 已要求且 FE 缺则补；已有则跳过
```

create/edit 页封面 `FormField` 加 `required`。

- [ ] **Step 2: 精彩瞬间 create/edit**

提交前：

```ts
if (!form.coverImage?.trim()) {
  toast.error('请上传封面图');
  return;
}
```

封面 `FormField label="封面图" required`。

- [ ] **Step 3: 机构入驻**

`InstitutionApplyForm`：

```tsx
<FormField label="公司 Logo" required>
```

规则对象加：

```ts
logoUrl: { required: true, requiredMessage: '请上传机构 Logo' },
```

- [ ] **Step 4: 入驻著作编辑器**

`TrainerBooksEditor`：保存单条时若缺 `coverUrl` toast「请上传封面图」并 return；Label 改为必填样式。

- [ ] **Step 5: 手测 / lint（有测则跑相关）**

```bash
cd frontend
pnpm lint
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/trainer-case/lib/case-form-rules.ts \
        frontend/src/app/[locale]/(usercenter)/dashboard/cases \
        frontend/src/app/[locale]/(usercenter)/dashboard/highlights \
        frontend/src/features/role-apply/components/role-forms/InstitutionApplyForm.tsx \
        frontend/src/features/role-apply/components/TrainerBooksEditor.tsx
git commit -m "$(cat <<'EOF'
fix(frontend): 案例/精彩瞬间/机构Logo/著作封面必填

对齐 Batch D 图片必填尖刀，C 端提交前拦截空图。
EOF
)"
```

---

### Task 4: D2 Admin — 案例 / 精彩瞬间 / 著作创建表单

**Files:**
- Modify: `admin-frontend/src/features/trainer-cases/components/case-create-form.tsx`
- Modify: `admin-frontend/src/features/trainer-highlights/components/highlight-create-form.tsx`
- Modify: `admin-frontend/src/features/books/components/book-create-form.tsx`

- [ ] **Step 1: 案例**

提交前：

```ts
if (!coverUrl.trim()) {
  toast.error('请上传封面图');
  return;
}
```

Label 标必填；`coverImage: coverUrl`（勿再 `|| undefined`）。

- [ ] **Step 2: 精彩瞬间 / 著作**

同样：空封面 toast + 必填 Label；payload 传非空 URL。

- [ ] **Step 3: lint**

```bash
cd admin-frontend
bun lint
```

- [ ] **Step 4: Commit**

```bash
git add admin-frontend/src/features/trainer-cases/components/case-create-form.tsx \
        admin-frontend/src/features/trainer-highlights/components/highlight-create-form.tsx \
        admin-frontend/src/features/books/components/book-create-form.tsx
git commit -m "$(cat <<'EOF'
fix(admin): 案例/精彩瞬间/著作创建封面必填

管理端创建表单与后端 NotBlank 对齐，禁止空封面提交。
EOF
)"
```

---

### Task 5: D8 — C 端去掉 min-w-1400 + Admin 分类适配

**Files:**
- Modify: `frontend/src/app/[locale]/(public)/layout.tsx`
- Modify: `admin-frontend/src/features/categories/components/category-tree-table.tsx`
- Modify: `admin-frontend/src/features/categories/components/category-form-dialog.tsx`

- [ ] **Step 1: public layout**

```tsx
return (
  <div className="w-full overflow-x-auto">
    <div className="min-w-0">
      <PublicHeader />
      <main className="flex-1 bg-[var(--page-bg)]">{children}</main>
      <AppFooter />
    </div>
    <FloatingActions />
  </div>
);
```

- [ ] **Step 2: 分类树**

表格外包：

```tsx
<div className="w-full overflow-x-auto">
  <Table className="min-w-[720px]">
    ...
  </Table>
</div>
```

- [ ] **Step 3: 分类弹窗**

```tsx
<DialogContent className="max-w-[min(420px,calc(100vw-2rem))] sm:max-w-[min(420px,calc(100vw-2rem))]">
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/[locale]/(public)/layout.tsx \
        admin-frontend/src/features/categories/components/category-tree-table.tsx \
        admin-frontend/src/features/categories/components/category-form-dialog.tsx
git commit -m "$(cat <<'EOF'
fix(ui): Win11 缩放下取消强制 1400 宽并适配分类树

去掉 C 端 public layout 的 min-w-1400；Admin 分类表可横滚、弹窗限视口宽。
EOF
)"
```

---

## Spec coverage check

| Spec | Task |
|------|------|
| D1 单城缓存 + size10 + ENROLLING + key 维 | Task 1 |
| D1 不改 Upcoming 查询 / TTL 失效 | Task 1（evict 不扫城） |
| D2 案例 FE | Task 3 |
| D2 highlight/book/logo BE | Task 2 |
| D2 C 表单 | Task 3 |
| D2 Admin 表单 | Task 4 |
| D8 layout / 分类树 / 弹窗 | Task 5 |

## Placeholder scan

无 TBD；`InstitutionRequest` 半更新冲突处理已写明排查路径。
