# Task 7 Report: 登录去格式校验 + 改密提示（§79）

**日期**: 2026-08-07  
**状态**: ✅ 完成

## 改动摘要

| 区域 | 变更 |
|------|------|
| 后端 | `UsernameLoginRequest.password` 删除 `@Size(6-32)`，保留 `@NotBlank` |
| 登录 | `LoginForm` 去掉密码 `<6` 提交拦截，保留非空校验；`RegisterForm` 未改 |
| 改密页 | `user.oldUser` 时展示迁移账号提示（6‑32 新密码说明） |
| 忘记密码 | `ForgotPasswordForm` 增加简短兼容说明；重置仍 6‑32 |
| 类型 | `UserProfileResponse` / `AuthUser` 增加 `oldUser` 映射 |

## 强制改密弹窗

全仓搜索 `forceChange` / `mustChangePassword` / `强制改密`：**无相关逻辑**，无需禁用。

## 验证

| 项 | 结果 |
|---|---|
| `mvn -pl taoke-user -am compile` | ✅ |
| ESLint（改动文件） | ✅ 无新增问题 |
| 弱密码老账号登录 / 注册 6-32 / 改密提示 | ⏳ 需人工冒烟 |

## Commit

```
fix(auth): allow legacy weak passwords at login (#79)
```
