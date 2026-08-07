# 公开课报名 Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** C 端公开课「立即报名」弹窗提交线索；后台「公开课报名」列表管理与导出。

**Architecture:** 独立表 `open_course_enrollments` + course 域 Service；admin 薄编排；C 端 Dialog；Admin feature 对齐 trainer-messages。

**Tech Stack:** Java 21 / Spring Boot 3.5 / JPA / Flyway V158 / Next.js 16 / Apache POI

**Spec:** `docs/superpowers/specs/2026-08-06-open-course-enrollment-design.md`

## Global Constraints

- 禁止随意 `mvn` 编译（开发者自行编译）
- Admin 禁止注入 Repository；走 course 模块 api
- 注释中文；`@author Fangxinxin`
- 登录可选：`@Public` + `getCurrentUserId()`
- 包管理：frontend pnpm / admin-frontend bun

---

### Task 1: Flyway + Entity + Repository

- [x] `V158__create_open_course_enrollments.sql`
- [x] Entity `OpenCourseEnrollment`
- [x] Repository + Specification 查询支持

### Task 2: Course 域 API（提交 + 管理查询接口）

- [x] DTO：Submit / ListItem / Detail / UpdateRequest / AdminQuery
- [x] `OpenCourseEnrollmentService` api + impl
- [x] C 端 Controller `POST /open-course-enrollments` `@Public`
- [x] Admin 走 course api

### Task 3: Admin 薄编排 + Excel 导出

- [x] `AdminOpenCourseEnrollmentController`
- [x] Excel：POI XSSF
- [x] `@RequireRole(SUPER_ADMIN)`

### Task 4: C 端报名弹窗

- [x] `OpenCourseEnrollDialog` + api service
- [x] `CoursePlanTable` 改为打开弹窗

### Task 5: Admin 前端页面

- [x] `nav-config` 菜单项
- [x] feature `open-course-enrollments`
- [x] page + BFF routes
- [x] 导出 / 刷新 / 详情 / 编辑

### Task 6: 校验脚本 + 冒烟清单

- [x] `uv run python data-trans/scripts/_validate_flyway_migration.py --version 158`
- [ ] 手工测试点（见交付说明）
