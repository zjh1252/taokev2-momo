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

