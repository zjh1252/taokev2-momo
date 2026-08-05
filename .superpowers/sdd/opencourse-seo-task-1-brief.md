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

