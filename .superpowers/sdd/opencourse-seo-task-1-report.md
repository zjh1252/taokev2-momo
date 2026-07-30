# Task 1 Report — 后端公开详情按 legacy 场次 ID 解析

## Status
DONE (inline; Task subagent quota exhausted)

## Implemented
- `CoursePlanRepository.findFirstBySortOrderOrderByIdAsc(Integer sortOrder)`
- `CourseServiceImpl.getPublicDetail`: published `courses.id` first, else `sort_order` → course, else NOT_FOUND

## TDD Evidence
- RED: `mvn -pl taoke-course -am test -Dtest=CourseServiceImplTest#getPublicDetail_resolvesPublishedCourseByLegacyPlanSortOrder`
  - Error: `findFirstBySortOrderOrderByIdAsc` undefined on `CoursePlanRepository`
- GREEN: `mvn -pl taoke-course -am test -Dtest=CourseServiceImplTest` → exit 0 (3 tests)

## Files changed
- `backend/taoke-course/.../CoursePlanRepository.java`
- `backend/taoke-course/.../CourseServiceImpl.java`
- `backend/taoke-course/.../CourseServiceImplTest.java`

## Commit
`e04221d7` feat(course): resolve public detail by legacy plan sort_order

## Self-review
- Prefer courses.id then sort_order: yes
- Unpublished filtered out: yes
- Scope limited to Task 1: yes
