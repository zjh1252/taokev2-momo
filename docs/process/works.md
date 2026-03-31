# 工作进度记录

## 2026-03-19 17:30

- 将 Service 层的 `checkRole()` 手动角色校验逻辑移除，改由 Controller 层 `@RequireRole` 注解统一鉴权，涉及 8 个 Service 和 7 个 Controller
- 确认安全链路：`SecurityUserService` 只加载 status=1 的角色，`DynamicAuthorizationManager` 天然排除非生效角色，Service 层无需重复校验
- 新增 `BusinessRole.Code` 内部常量类，将全部角色字符串字面量替换为编译期常量（`BusinessRole.Code.XXX`），覆盖 Controller 注解、Service 调用、Security 层判断，共清理约 20 处字面量
- 更新 `docs/02-架构设计.md`，新增第 8 章「权限与角色注解规范」，涵盖双层授权模型、判定优先级、角色常量规范、自服务 vs 管理后台注解用法、安全链路说明

