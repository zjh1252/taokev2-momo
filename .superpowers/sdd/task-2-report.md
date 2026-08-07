# Task 2 Report — 内训课报名 Course 域 API（71）

**Status:** DONE  
**Date:** 2026-08-07  
**Depends on:** Task 1 commit `9f6945d4` (V159 + Entity + Repository)

## 目标

镜像公开课报名栈，提供内训课 C 端提交与管理端 Service API；无 `planId` / 场次时间；仅接受 `CourseType.INTERNAL`。

## 新增文件

| 路径 | 说明 |
|------|------|
| `dto/enrollment/SubmitInternalCourseEnrollmentRequest.java` | C 端提交 DTO（无 planId） |
| `dto/enrollment/UpdateInternalCourseEnrollmentRequest.java` | 管理端更新 status + adminRemark |
| `dto/enrollment/InternalCourseEnrollmentVO.java` | 管理端 VO（无 plan 字段） |
| `api/InternalCourseEnrollmentService.java` | 跨模块 API 接口 |
| `service/enrollment/InternalCourseEnrollmentServiceImpl.java` | 实现 submit + admin 四方法 |
| `controller/enrollment/InternalCourseEnrollmentController.java` | `POST /internal-course-enrollments` `@Public` |

## submit 关键逻辑

1. `companyPhone` / `mobile` 至少填一项 → 否则 `PARAM_INVALID`
2. `courseRepository.findById` → 不存在 `NOT_FOUND`
3. `course.getType() != INTERNAL` → `PARAM_INVALID`「仅支持内训课报名」
4. **不查** `CoursePlan`
5. 写入：`courseTitle` 冗余、`status=0`、`userId` 可 null

## admin 方法

与 Open 版签名对齐（Internal 类型）：`adminSearch`、`adminGetDetail`、`adminUpdate`、`adminListForExport`。  
`toVo` 课程已删展示 `DELETED_COURSE_LABEL = "课程已删除"`。

## C Controller

对齐 Open：`SecurityUtils.getCurrentUserId()`（未登录返回 null，不抛 UNAUTHORIZED）。

## 验证

| 检查 | 结果 |
|------|------|
| `mvn -pl taoke-course,taoke-app -am compile -q` | BUILD SUCCESS |
| 单测 | N/A（brief 未要求） |

## 自审

| 检查项 | 结论 |
|--------|------|
| 无 planId / planStartTime / planEndTime | ✅ |
| 无 CoursePlanRepository 依赖 | ✅ |
| INTERNAL 类型校验 | ✅ |
| admin 导出上限 EXPORT_MAX=5000 | ✅ |
| 模块边界（仅 Repository + CourseRepository） | ✅ |

## 关注点

1. **Admin Controller** 未在本 Task 实现，计划 File Map 中为后续 Task（`AdminInternalCourseEnrollmentController`）。
2. **前端 / admin-frontend** 未在本 Task 实现。
3. 建议 Task 3 联调：`POST /internal-course-enrollments` 对已删/非内训课 ID 的 4xx 响应。

## Commit

见下方 git log（Task 2 专用 commit）。
