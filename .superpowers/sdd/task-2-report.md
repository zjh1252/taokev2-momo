# Task 2 Report — D2 BE highlight / book / institution Logo 必填

**Status:** DONE  
**Date:** 2026-07-29  
**Commit:** `e493f61b` — fix(user): 精彩瞬间/著作/机构 Logo 后端必填校验

## 目标

为精彩瞬间、著作、机构 Logo 三类资源在后端 DTO 层补充 `@NotBlank`，与既有 `@Valid` Controller 配合，空封面/Logo 直打 API 返回 400。案例 `SaveTrainerCaseRequest.coverImage` 已有校验，未改动。

## 改动摘要

| DTO | 字段 | 注解 |
|-----|------|------|
| `SaveTrainerHighlightRequest` | `coverImage` | `@NotBlank(message = "请上传封面图")` + 保留 `@Size` |
| `SaveTrainerBookRequest` | `coverUrl` | `@NotBlank(message = "请上传封面图")` + 保留 `@Size` |
| `InstitutionRequest` | `logoUrl` | `@NotBlank(message = "请上传机构 Logo")` + 保留 `@Size` |

## InstitutionRequest 调用点分析

| 入口 | Controller | `@Valid` | 说明 |
|------|------------|----------|------|
| `POST /institutions/apply` | `InstitutionController.apply` | ✅ | 机构入驻/重审，前端 `applyInstitution` 全量表单提交 |
| `PUT /institutions/me` | `InstitutionController.save` | ✅ | Service 层 `saveOrUpdateExtension` 为字段级 merge，但当前 **无前端调用** PUT 此路径 |

**结论：** 按 brief「优先加注解」，在 DTO 上增加 `@NotBlank` 安全。草稿/部分更新冲突未触发：精彩瞬间草稿接口（`/highlights/draft`）未加 `@Valid`，与案例草稿模式一致。机构 `PUT /institutions/me` 若未来用于省略 `logoUrl` 的部分更新会返回 400，与 spec「资料保存必填」一致；公司资料认证走独立 `InstitutionCompanyInfoRequest`，不受影响。

## 校验生效路径（`@Valid`）

- 精彩瞬间：`POST/PUT /trainers/me/highlights`（非 draft）
- 著作：`POST/PUT /trainers/me/books`、Admin `AdminBookController.create`
- 机构：`POST /institutions/apply`、`PUT /institutions/me`
- 专家入驻嵌套著作：`TrainerRequest.books` 列表元素继承 `SaveTrainerBookRequest` 约束（若父级 `@Valid` 嵌套校验启用）

## 验证

| 检查 | 结果 |
|------|------|
| `mvn -pl taoke-user -am compile` | BUILD SUCCESS |
| 单测 | N/A（brief 未要求） |
| `SaveTrainerCaseRequest.coverImage` 已有 `@NotBlank` | ✅ 确认未改 |

## 自审

| 检查项 | 结论 |
|--------|------|
| 校验文案与 brief 逐字一致 | ✅ |
| 保留既有 `@Size` | ✅ |
| 未重复修改案例 DTO | ✅ |
| 草稿路径不受影响（highlight draft 无 `@Valid`） | ✅ |
| JavaDoc `@date` 已更新 | ✅ |

## 关注点

1. **`PUT /institutions/me` 部分更新**：DTO 级 `@NotBlank` 要求每次带 `@Valid` 的请求均含非空 `logoUrl`；与 Service 层 null-skip merge 语义不完全一致，但符合本批「资料保存必填」；当前无前端调用此 PUT。
2. **Admin 爬虫批量导入著作**（`AdminCrawlService.toTrainerBooks`）：若封面为空，后续走 `@Valid` 创建时会 400，符合「防止空封面提交」目标。
3. **集成测试**：未新增；建议 Task 3 FE 完成后联调空图提交。

## 文件清单

- Modified: `backend/taoke-user/src/main/java/com/taoke/user/dto/trainerhighlight/SaveTrainerHighlightRequest.java`
- Modified: `backend/taoke-user/src/main/java/com/taoke/user/dto/trainerbook/SaveTrainerBookRequest.java`
- Modified: `backend/taoke-user/src/main/java/com/taoke/user/dto/institution/InstitutionRequest.java`

---

## Batch D Final Review 修复（2026-07-29）

**Finding：** `InstitutionRequest.logoUrl` 全局 `@NotBlank` 与 `PUT /institutions/me` 的 Service 层 null-skip merge 冲突，省略 `logoUrl` 会 400。

**修复：**

| 变更 | 说明 |
|------|------|
| `InstitutionRequest.logoUrl` | 移除 `@NotBlank`，保留 `@Size(max=512)` |
| `InstitutionServiceImpl.apply()` | 新增 `validateApplyLogo()`：请求无有效 Logo 且库中亦无时抛 `请上传机构 Logo`；重审省略 logo 但库中已有则放行 |
| `InstitutionServiceImplTest` | 新增 `apply_rejectsWhenLogoMissingAndNoExistingLogo` |

**调用点：** `POST /institutions/apply` 走 Service 校验；`PUT /institutions/me` 可部分更新省略 logoUrl；Admin 未使用 `InstitutionRequest`。

**验证：**

| 检查 | 结果 |
|------|------|
| `mvn -pl taoke-user -am compile` | BUILD SUCCESS |
| `mvn -pl taoke-user test -Dtest=InstitutionServiceImplTest` | Tests run: 1, Failures: 0 |

**Commit：** `e71a7516`
