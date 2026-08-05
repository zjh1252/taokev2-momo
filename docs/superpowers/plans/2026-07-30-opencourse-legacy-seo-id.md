# 公开课老站 SEO 编号对齐 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `/opencourse/{老场次ID}.htm`（如 `438103`）在新站 200 打开对应公开课，页面编号与站内主链使用纯数字老场次号。

**Architecture:** 对齐机构 `resolvePublicByPathId`：公开详情先按 `courses.id`，再按 `course_plans.sort_order`（迁移写入的老 `tk_course.id`）反查。列表回填 `seoPathId`。前端路径工具与展示改为纯数字 SEO 编号；`TK-` 计划 URL 仅保留兼容。

**Tech Stack:** Java 21 / Spring Data JPA / JUnit5+Mockito；Next.js 16 / Vitest（或现有前端测试 runner）

**Spec:** `docs/superpowers/specs/2026-07-30-opencourse-legacy-seo-id-design.md`

## Global Constraints

- 展示编号为**纯数字**（如 `438103`），不加 `TK-` 前缀
- 老 URL **200** 直达，本轮不做 301
- **不改** `courses.id`；本轮复用 `course_plans.sort_order` 作为 legacy 场次 ID
- 冲突时 **优先** `courses.id`，再 fallback `sort_order`
- 仅公开课 `/opencourse`；内训课不动
- **不要自动 git commit**（除非用户明确要求）
- 后端验证：`cd backend && mvn -pl taoke-course -am test -Dtest=CourseServiceImplTest`
- 前端验证：在 `frontend` 用 `pnpm` 跑相关测试

---

## File Map

| 文件 | 职责 |
|------|------|
| `backend/.../repository/CoursePlanRepository.java` | `findFirstBySortOrderOrderByIdAsc` |
| `backend/.../service/CourseServiceImpl.java` | `getPublicDetail` path 解析；列表填 `seoPathId`；详情填 `displayCourseNo` |
| `backend/.../dto/course/CourseDetailVO.java` | `displayCourseNo` |
| `backend/.../dto/course/CourseListItemVO.java` | `seoPathId` |
| `backend/.../test/.../CourseServiceImplTest.java` | 解析与展示编号单测 |
| `frontend/.../utils/routes.ts` | `getCourseDetailPath` 支持 seoPathId |
| `frontend/.../utils/open-course-seo.ts` | 纯函数：展示编号、SEO pathId、计划编号 |
| `frontend/.../utils/open-course-seo.test.ts` | 上述纯函数测例 |
| `frontend/.../api/types.ts` | 类型补字段 |
| `frontend/.../components/detail/CourseHero.tsx` | 纯数字编号 |
| `frontend/.../components/detail/CoursePlanTable.tsx` | 行编号 + 链接改 legacy |
| `frontend/.../components/detail/OpenCoursePlanHero.tsx` | 纯数字 |
| `frontend/.../components/open/OpenCourseCard.tsx` 等 | 站内链改用 `getCourseDetailPath` |
| `frontend/.../opencourses/[id]/page.tsx` | 把 URL pathId 传给 Hero（高亮/展示） |

---

### Task 1: 后端公开详情按 legacy 场次 ID 解析

**Files:**
- Modify: `backend/taoke-course/src/main/java/com/taoke/course/repository/CoursePlanRepository.java`
- Modify: `backend/taoke-course/src/main/java/com/taoke/course/service/CourseServiceImpl.java`（`getPublicDetail`）
- Modify: `backend/taoke-course/src/test/java/com/taoke/course/service/CourseServiceImplTest.java`

**Interfaces:**
- Produces: `CoursePlanRepository.findFirstBySortOrderOrderByIdAsc(Integer sortOrder)` → `Optional<CoursePlan>`
- Produces: `getPublicDetail(438103)` 在仅有 plan.sortOrder=438103、course.id=276819 时返回已上架课 276819 的详情

- [ ] **Step 1: 写失败单测（先 courses.id，再 sort_order）**

在 `CourseServiceImplTest` 增加（可先 stub `assembleDetail` 依赖：`courseMapper.toDetailVO`、空 plans、category 等最小 mock，使返回 VO 的 `id` 可断言；若 assembleDetail 过重，可只测「解析到正确 Course 后调用 assemble」——优先完整走 `getPublicDetail` 并 mock mapper 返回带 id 的 VO）：

```java
@Test
void getPublicDetail_resolvesPublishedCourseByLegacyPlanSortOrder() {
    when(courseRepository.findById(438103)).thenReturn(Optional.empty());

    CoursePlan plan = new CoursePlan();
    plan.setId(1);
    plan.setCourseId(276819);
    plan.setSortOrder(438103);
    when(coursePlanRepository.findFirstBySortOrderOrderByIdAsc(438103))
            .thenReturn(Optional.of(plan));

    Course course = new Course();
    course.setId(276819);
    course.setStatus(CourseStatus.PUBLISHED.getValue());
    course.setType(CourseType.OPEN_OFFLINE);
    course.setTitle("向HW学习流程体系建设与高效运营");
    when(courseRepository.findById(276819)).thenReturn(Optional.of(course));

    // assembleDetail 最小桩：toDetailVO + 空计划列表
    CourseDetailVO detail = new CourseDetailVO();
    detail.setId(276819);
    when(courseMapper.toDetailVO(course)).thenReturn(detail);
    when(coursePlanRepository.findByCourseIdOrderBySortOrder(276819)).thenReturn(List.of());
    when(legacyTaokeCourseReader.findCoverUrlsByCourseIds(List.of(276819))).thenReturn(Map.of());
    when(legacyTaokeCourseReader.findOrganizerUserIds(List.of(276819))).thenReturn(Map.of());
    when(legacyTaokeCourseReader.findOrganizerNamesFromLecturer(List.of(276819))).thenReturn(Map.of());

    CourseDetailVO result = service.getPublicDetail(438103);

    assertEquals(276819, result.getId());
    verify(coursePlanRepository).findFirstBySortOrderOrderByIdAsc(438103);
}

@Test
void getPublicDetail_prefersCourseIdWhenBothMatch() {
    Course course = new Course();
    course.setId(276819);
    course.setStatus(CourseStatus.PUBLISHED.getValue());
    course.setType(CourseType.OPEN_OFFLINE);
    when(courseRepository.findById(276819)).thenReturn(Optional.of(course));

    CourseDetailVO detail = new CourseDetailVO();
    detail.setId(276819);
    when(courseMapper.toDetailVO(course)).thenReturn(detail);
    when(coursePlanRepository.findByCourseIdOrderBySortOrder(276819)).thenReturn(List.of());
    when(legacyTaokeCourseReader.findCoverUrlsByCourseIds(List.of(276819))).thenReturn(Map.of());
    when(legacyTaokeCourseReader.findOrganizerUserIds(List.of(276819))).thenReturn(Map.of());
    when(legacyTaokeCourseReader.findOrganizerNamesFromLecturer(List.of(276819))).thenReturn(Map.of());

    CourseDetailVO result = service.getPublicDetail(276819);

    assertEquals(276819, result.getId());
    verify(coursePlanRepository, never()).findFirstBySortOrderOrderByIdAsc(org.mockito.ArgumentMatchers.any());
}
```

（若现有 `assembleDetail` 还调其它未 mock 依赖导致 NPE，按失败栈补 `@Mock`/`when`，保持最小。）

- [ ] **Step 2: 跑测确认失败**

```bash
cd backend && mvn -pl taoke-course -am test -Dtest=CourseServiceImplTest#getPublicDetail_resolvesPublishedCourseByLegacyPlanSortOrder
```

Expected: 编译失败或 FAIL（方法/仓库方法不存在，或仍 404）

- [ ] **Step 3: 实现仓库方法 + `getPublicDetail` 解析**

`CoursePlanRepository` 增加：

```java
Optional<CoursePlan> findFirstBySortOrderOrderByIdAsc(Integer sortOrder);
```

`getPublicDetail` 改为：

```java
@Override
public CourseDetailVO getPublicDetail(Integer pathId) {
    Course course = courseRepository.findById(pathId)
            .filter(c -> c.getStatus() == CourseStatus.PUBLISHED.getValue())
            .orElse(null);
    if (course == null) {
        course = coursePlanRepository.findFirstBySortOrderOrderByIdAsc(pathId)
                .map(CoursePlan::getCourseId)
                .flatMap(courseRepository::findById)
                .filter(c -> c.getStatus() == CourseStatus.PUBLISHED.getValue())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "课程不存在"));
    }
    return assembleDetail(course);
}
```

注意：原实现「存在但未上架」抛 NOT_FOUND；新逻辑对未上架主键也不应泄漏，与上面 filter 一致。legacy 命中未上架课同样 404。

- [ ] **Step 4: 跑测通过**

```bash
cd backend && mvn -pl taoke-course -am test -Dtest=CourseServiceImplTest
```

Expected: PASS

---

### Task 2: 详情 `displayCourseNo` + 列表 `seoPathId`

**Files:**
- Modify: `CourseDetailVO.java`、`CourseListItemVO.java`
- Modify: `CourseServiceImpl.java`（`assembleDetail`、两处填 `nextPlan*` 的循环）
- Modify: `CourseServiceImplTest.java`
- Modify: `frontend/src/features/course/api/types.ts`

**Interfaces:**
- Produces: `CourseDetailVO.displayCourseNo: Integer` — 对外纯数字编号
- Produces: `CourseListItemVO.seoPathId: Integer` — 站内 SEO 路径数字段（优先最近场次 `sortOrder>0`，否则 `course.id`）

- [ ] **Step 1: 单测 — displayCourseNo 取最近场次 sortOrder**

```java
@Test
void getPublicDetail_setsDisplayCourseNoFromUpcomingPlanSortOrder() {
    Course course = new Course();
    course.setId(276819);
    course.setStatus(CourseStatus.PUBLISHED.getValue());
    course.setType(CourseType.OPEN_OFFLINE);
    when(courseRepository.findById(276819)).thenReturn(Optional.of(course));

    CoursePlan plan = new CoursePlan();
    plan.setId(10);
    plan.setCourseId(276819);
    plan.setSortOrder(438103);
    plan.setStartTime(LocalDateTime.now().plusDays(3));
    when(coursePlanRepository.findByCourseIdOrderBySortOrder(276819)).thenReturn(List.of(plan));

    CourseDetailVO detail = new CourseDetailVO();
    detail.setId(276819);
    when(courseMapper.toDetailVO(course)).thenReturn(detail);
    when(courseMapper.toPlanDTOList(List.of(plan))).thenReturn(List.of(/* dto with sortOrder 438103 */));
    // … 其余 assembleDetail 最小 stub 同 Task1

    CourseDetailVO result = service.getPublicDetail(276819);
    assertEquals(438103, result.getDisplayCourseNo());
}
```

实现规则（写入 `assembleDetail` 末尾，基于已加载 plans）：

1. 在 `plans` 中选：`startTime >= now` 中最早一场且 `sortOrder != null && sortOrder > 0`
2. 若无，则全部场次中 `sortOrder > 0` 的最近一场（按 startTime 倒序或与列表 nearest 一致）
3. 若无有效 sortOrder → `displayCourseNo = course.getId()`

列表：在设置 `nextPlanStartDate` 的同一 `nearest` plan 上：

```java
Integer seo = nearest.getSortOrder();
vo.setSeoPathId(seo != null && seo > 0 ? seo : c.getId());
```

两处 nearest 回填（`listByPublisher` 段与 `assembleListItems`）都要设。

- [ ] **Step 2: 实现 VO 字段 + 填充逻辑；前端 types 同步 `displayCourseNo?` / `seoPathId?`**
- [ ] **Step 3: 跑 `CourseServiceImplTest` PASS**

---

### Task 3: 前端 SEO 纯函数 + 路径工具

**Files:**
- Create: `frontend/src/features/course/utils/open-course-seo.ts`
- Create: `frontend/src/features/course/utils/open-course-seo.test.ts`
- Modify: `frontend/src/features/course/utils/routes.ts`

**Interfaces:**
- Produces:
  - `resolveOpenCourseDisplayNo(opts): number`
  - `resolveOpenCourseSeoPathId(course: { id: number; seoPathId?: number | null; plans?: { sortOrder?: number; startTime?: string }[] }): number`
  - `formatOpenCourseNo(no: number): string` → `String(no)`（纯数字，无 pad、无 TK-）
  - `getPlanDisplayNo(plan, courseId, index1Based): string`
  - `getOpenCoursePlanSeoPath(plan, courseId, index1Based): string`

- [ ] **Step 1: 写失败测例**

```ts
import { describe, expect, it } from 'vitest';
import {
  formatOpenCourseNo,
  getOpenCoursePlanSeoPath,
  getPlanDisplayNo,
  resolveOpenCourseSeoPathId,
} from './open-course-seo';

describe('open-course-seo', () => {
  it('uses seoPathId when present', () => {
    expect(resolveOpenCourseSeoPathId({ id: 276819, seoPathId: 438103 })).toBe(438103);
  });

  it('falls back to course id', () => {
    expect(resolveOpenCourseSeoPathId({ id: 276819 })).toBe(276819);
  });

  it('formats plain digits', () => {
    expect(formatOpenCourseNo(438103)).toBe('438103');
  });

  it('plan display prefers sortOrder', () => {
    expect(getPlanDisplayNo({ sortOrder: 438103 }, 276819, 1)).toBe('438103');
  });

  it('plan path uses sortOrder', () => {
    expect(getOpenCoursePlanSeoPath({ sortOrder: 438103 }, 276819, 1)).toBe(
      '/opencourse/438103.htm',
    );
  });
});
```

- [ ] **Step 2: 实现 `open-course-seo.ts`；扩展 `getCourseDetailPath`**

```ts
export function getCourseDetailPath(
  id: number,
  type?: CourseType | string | null,
  seoPathId?: number | null,
): string {
  if (isOpenCourseType(type)) {
    const pathId = seoPathId != null && seoPathId > 0 ? seoPathId : id;
    return `/opencourse/${pathId}.htm`;
  }
  return `/inhousecourse/${id}.htm`;
}
```

- [ ] **Step 3: `cd frontend && pnpm exec vitest run src/features/course/utils/open-course-seo.test.ts`（或项目惯用 test 命令）PASS**

---

### Task 4: 详情展示 + 计划表链接改纯数字 SEO

**Files:**
- Modify: `CourseHero.tsx` — `formatOpenCourseNo(course.displayCourseNo ?? pathDisplayNo ?? course.id)`
- Modify: `opencourses/[id]/page.tsx` — 将 URL `id` 作为 `pathId` 传给 `CourseHero`（若 `Number(id)` 命中某 `plan.sortOrder`，Hero 优先显示该数字；可覆盖 `displayCourseNo`）
- Modify: `CoursePlanTable.tsx` — 行编号 `getPlanDisplayNo`；链接 `getOpenCoursePlanSeoPath`（替代 `formatPlanCode`/`getOpenCoursePlanPath` 作为对外主链）
- Modify: `OpenCoursePlanHero.tsx` — 纯数字
- Modify: `opencourses/plan/[code]/page.tsx` — 展示编号用 plan.sortOrder

规则：`activePlanCode` 高亮若仍用 TK- code，可改为同时支持数字 pathId；最小改法：计划表链接改为 `/opencourse/{sortOrder}.htm`，高亮比较改为 `String(plan.sortOrder) === activePathId`。

- [ ] **Step 1: 改展示与链接**
- [ ] **Step 2: 本地打开逻辑自检（或组件级测）：编号无 `TK-` 前缀**

---

### Task 5: 站内公开课主链统一走 SEO pathId

**Files:**
- Modify: `OpenCourseCard.tsx`
- Modify: `PublicCoursesSection.tsx`
- Modify: `CourseResultCard.tsx`（若搜索 item 暂无 seoPathId，先 `course.id`；后端列表有字段后自动生效）
- Modify: `CityCourseScheduleList.tsx`、`CityLatestCourseList.tsx`
- Modify: `InstitutionDetailSidebar.tsx`、`InstitutionDetailTabs.tsx`
- Modify: `TrainerDetailContent.tsx`、`TrainerSidebar.tsx`、`VideoRelatedCourses.tsx`（经 `getCourseDetailPath` 传第三参）

模式：

```tsx
href={getCourseDetailPath(course.id, course.type, course.seoPathId)}
```

硬编码 `` `/opencourse/${c.id}.htm` `` 一律改为上述工具。

- [ ] **Step 1: 全局搜 `/opencourse/${` 与 `getCourseDetailPath(`，改完**
- [ ] **Step 2: `pnpm lint`（或至少相关文件无 TS 错误）**

---

### Task 6: 端到端验收

- [ ] **Step 1:** 后端/前端启动或打 test 环境后访问：
  - `/opencourse/438103.htm` → 200，标题正确，编号 `438103`
  - `/opencourse/276819.htm` → 200，同课
  - 列表卡片 href 含 `438103`（有 seoPathId 时）
- [ ] **Step 2:** 确认计划表编号为纯数字、无 `TK-438103`

---

## Spec Coverage

| Spec 项 | Task |
|---------|------|
| path 解析 courses.id → sort_order | Task 1 |
| display 纯数字 / displayCourseNo | Task 2–4 |
| 列表 seoPathId + 站内链 | Task 2、5 |
| TK- 兼容保留、不做 301 | Task 4 不删 proxy TK- 分支 |
| 验收 438103 | Task 6 |

## Placeholder / 一致性自检

- 字段名统一：`displayCourseNo`、`seoPathId`、`sortOrder`（legacy）
- 无 TBD；commit 步骤已按仓库约定省略
