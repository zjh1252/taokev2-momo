# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

淘课网 v2 — 企业培训采购平台，连接培训需求方（企业/个人）与培训资源供给方（专家/机构），提供"资源展示 → 需求对接 → 价值转化 → 增值服务"的业务闭环。Monorepo 组织，包含后端、两个前端应用、UniApp 移动端和部署配置。

## 角色体系

平台共 8 个业务角色 + 3 个运营角色，一个用户可同时拥有多个角色：

| 阵营 | 角色编码 | 说明 |
|------|---------|------|
| 需求方 | `BUYER` | 个人学员（注册默认角色），购买在线课/报名公开课 |
| 需求方 | `ENTERPRISE_BUYER` | 企业培训采购方，核心付费用户，可发布培训需求 |
| 供给方 | `TRAINER` | 专家，核心内容生产者，发布4种课程，需审核入驻 |
| 供给方 | `AGENT` | 专家经纪人，管理旗下专家资源库，可关联经纪公司 |
| 供给方 | `ASSISTANT` | 专家助理，与专家一对一绑定，协助日常运营 |
| 供给方 | `ENTERPRISE_AGENT` | 专家经纪公司，多经纪人管理，需企业实名认证 |
| 供给方 | `INSTITUTION` | 机构，管理师资团队，发布公开课批量排课 |
| 供给方 | `INSTITUTION_EMPLOYEE` | 机构员工，在机构授权范围内执行业务 |
| 运营方 | `PLATFORM_AUDITOR` / `PLATFORM_CS` / `SUPER_ADMIN` | 审核员/客服/超管 |

### 供给侧绑定关系
Markdown Preview Enhanced
角色间通过绑定表关联（状态：PENDING/ACTIVE/REJECTED/UNBOUND），绑定需专家确认：
- 经纪人 ↔ 专家（多对多）、经纪公司 ↔ 专家（多对多，直管）、机构 ↔ 专家（多对多，挂靠）
- 专家 ↔ 助理（一对一）、经纪公司 → 经纪人（一对多，隶属）、机构 → 机构员工（一对多，隶属）
- 绑定为 ACTIVE 后，运营角色获得对该专家课程/案例/视频等资源的代管权限

## 核心业务模块

- **课程**：在线课（视频学习）、线下公开课（多场次排课）、内训课（企业定制，不走线上支付）、版权课（平台统一定价）
- **订单与支付**：在线课/公开课购买，支持微信/支付宝/公对公，退款/发票/提现
- **充值**：分档折扣（1000/5000/10000），充值后购课享折扣，不可提现
- **培训需求**：企业发布定制需求（不公开），AI 智能匹配专家，同步至客服工作台
- **评价**：对专家/机构/课程的星级+文字+图片评价，需后台审核
- **企业案例**：真实培训案例展示，含量化效果数据
- **分类与标签**：培训领域/行业的层级分类体系
- **消息通知**：短信/微信/站内信，按事件模板触发
- **CMS**：首页内容运营（轮播图、推荐位、热搜词等）

## 模块依赖与通信

```
taoke-app → taoke-admin → taoke-user → taoke-common
                        → taoke-course → taoke-user → taoke-common
```

依赖严格单向，禁止循环。跨模块通信规则：
- **同步**：通过目标模块 `api/` 包的 Service 接口调用，禁止直接注入对方 Repository 或 ServiceImpl
- **异步**：领域事件（`taoke-common/events/`）+ RabbitMQ，`EventPublisher` 发布，`@DomainEventListener` 消费
- **跨模块 Entity 只读不写**：可 getter 读取，禁止 setter/new；写操作传原始参数给 api 接口

### Admin 模块边界

taoke-admin 是薄编排层：禁止注入 Repository，禁止构造跨模块 Entity，复杂逻辑下沉到目标模块 Service。

## API 路由规范

- 无类级 `@RequestMapping` 前缀，无 `/api` 前缀
- 自服务：`/users/me`（通用）、`/{角色复数}/me`（角色特有），用 `@RequireRole`
- 管理后台：`/admin/{资源}`，用 `@RequirePermission`
- 双层授权：业务角色（`@RequireRole`）+ RBAC 权限（`@RequirePermission`），不叠加使用
- SUPER_ADMIN 跳过一切权限校验

## 全局约定

- 文件编码: UTF-8 | 注释语言: 中文 | 时区: Asia/Shanghai | Locale: zh-CN
- **禁止**编译 Java 或运行 `mvn` 命令，后端编译由开发者手动执行
- **禁止**读取 `/docs/ai-prd-exports`、`/docs/tmp`、`/tmp`
- Python 环境: `conda activate common-ai`
- 全新项目，无需兼容旧版本，无需 `@Deprecated`
- **优先复用**：开发前先搜索仓库已有工具类/组件，严禁重复编写
- **老站数据迁移脚本一律放 `data-trans/`**（`scripts/`、`output/`、`docs/`），Flyway 只做 schema/种子；详见 `docs/guides/data-trans-migration.md`
- **Flyway 启动失败（checksum 不匹配等）**：编写/复用 `data-trans/scripts/_fix_flyway_*.py` 后 Agent **直接执行 repair**，无需再向用户确认；详见 `docs/guides/flyway-operations.md`
- 任务完成且用户确认后，记录工作内容到 `/docs/process/works.md`

## 仓库结构

```
backend/              # Java 21 + Spring Boot 3.5 模块化单体
  taoke-common/       # 公共基础层（工具、DTO、事件总线、安全注解、文件上传）
  taoke-user/         # 用户域（认证、权限、RBAC、各角色档案、供给侧）
  taoke-course/       # 课程域（课程、订单、支付、需求、案例、评价、CMS、消息）
  taoke-admin/        # 后台管理编排层（薄编排，调用 user/course 的 api 接口，不直接访问 Repository）
  taoke-app/          # 启动入口（TaokeApplication, scanBasePackages="com.taoke"）
frontend/             # C端 Next.js 16 (pnpm)
admin-frontend/       # 管理后台 Next.js 16 (bun)
taoke-uniapp/         # UniApp 移动端 (Vue)
deploy/               # Docker Compose, Nginx, Nacos, ES 配置
```

## 开发命令

### Frontend（C端）— 仅用 pnpm
```bash
cd frontend
pnpm install
pnpm dev        # next dev
pnpm build      # next build
pnpm lint       # eslint
```

### Admin Frontend — 仅用 bun
```bash
cd admin-frontend
bun install
bun dev         # next dev
bun run build   # next build
bun lint        # oxlint
bun lint:fix    # oxlint --fix + oxfmt
bun format      # oxfmt --write .
```

包管理器锁死：frontend 用 pnpm，admin-frontend 用 bun，**勿混用**。

## 后端技术栈与规范

- **架构**: 模块化单体（Modular Monolith），单 JAR 部署，Maven Module 隔离边界
- **ORM**: Spring Data JPA（不用 MyBatis）
- **认证**: Spring Security + JWT
- **缓存**: Redis + Redisson（分布式锁、延迟队列）
- **消息队列**: RabbitMQ
- **数据迁移**: Flyway（脚本在 `taoke-app/src/main/resources/db/migration/`）
- **接口文档**: springdoc-openapi
- **DTO 映射**: MapStruct + Lombok

### JPA 性能规范
- Entity 必须加 `@DynamicInsert`，推荐加 `@DynamicUpdate`
- 关联关系一律 `FetchType.LAZY`，禁止默认 EAGER
- 禁止在循环中访问懒加载属性
- 列表分页查询用三段式（分页查 ID → 回表主表 → 批量查集合）
- 单条详情用 `@EntityGraph` 或 `JOIN FETCH`
- 列表查询优先用 DTO 投影（Interface Projection 或 JPQL new）

### Controller 规范
- 路由无类级 `@RequestMapping` 前缀，每个方法写完整路径（如 `@PutMapping("/users/me/password")`）
- API 路由无 `/api` 前缀，ingress 直达资源

### MySQL 规范
- 表名复数，`id` int 自增主键，`created_at` / `updated_at` datetime
- 索引以 `idx_` 前缀，不使用外键（代码逻辑维持）
- 布尔字段：列名禁止 `is_` 前缀，用语义词（`enabled`、`deleted` 等）；类型 `TINYINT(1)`；Java 用 `Boolean` 包装类型，默认值由数据库 DEFAULT 控制
- 非布尔小整型（status、rating）用 `TINYINT(2)` + Java `Integer`

### JavaDoc 规范
- 类注释: `@author Fangxinxin` + `@date yyyy-MM-dd HH:mm`
- 方法注释: 仅复杂逻辑需要
- 未实现处标记 `// TODO` + 原因

## 前端共通

- 两个前端均为 Next.js 16 + Tailwind CSS + shadcn-ui
- 暂不写单元测试
- 主题参考 themes 目录

### C端 Frontend 特有
- i18n: next-intl，`[locale]` 路由段
- 功能模块在 `src/features/`

### Admin Frontend 特有
- 数据获取: React Query（服务端 `prefetchQuery` + 客户端 `useSuspenseQuery`）
- API 层按 feature: `api/types.ts` → `api/service.ts` → `api/queries.ts`
- URL 参数: nuqs（服务端 `searchParamsCache`，客户端 `useQueryStates`）
- 表单: TanStack Form + Zod（`useAppForm` + `useFormFields<T>()`）
- 图标: 仅从 `@/components/icons` 导入，禁止直接引用 `@tabler/icons-react`
- 页面标题: 用 `PageContainer` props，不手动导入 `<Heading>`
- 状态管理: Zustand
- 格式: 单引号、无尾逗号、2 空格缩进
