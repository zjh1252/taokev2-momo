# 工作进度记录

## 2026-03-19 17:30

- 将 Service 层的 `checkRole()` 手动角色校验逻辑移除，改由 Controller 层 `@RequireRole` 注解统一鉴权，涉及 8 个 Service 和 7 个 Controller
- 确认安全链路：`SecurityUserService` 只加载 status=1 的角色，`DynamicAuthorizationManager` 天然排除非生效角色，Service 层无需重复校验
- 新增 `BusinessRole.Code` 内部常量类，将全部角色字符串字面量替换为编译期常量（`BusinessRole.Code.XXX`），覆盖 Controller 注解、Service 调用、Security 层判断，共清理约 20 处字面量
- 更新 `docs/02-架构设计.md`，新增第 8 章「权限与角色注解规范」，涵盖双层授权模型、判定优先级、角色常量规范、自服务 vs 管理后台注解用法、安全链路说明

## 2026-03-19 19:00
- 实现文件存储与上传服务（`taoke-common` 模块）
- 存储抽象层：`StorageService` 接口 + `StorageProperties` + `StoragePathUtils` + `StorageConfig`
- 两种存储实现：`LocalStorageService`（开发）和 `AliOssStorageService`（生产），配置化切换 `taoke.storage.provider`
- 上传业务层：`UploadBizType` 枚举（images/avatars/files/certificates/courses/cases）、`FileUploadService` 接口与实现、`FileUploadProperties` 校验配置
- `UploadController`：`POST /uploads/images`、`/uploads/files`、`/uploads/avatars` 三个端点
- `ErrorCode` 新增 3 个文件上传错误码（FILE_UPLOAD_FAILED / INVALID_FILE_TYPE / FILE_TOO_LARGE）
- YAML 配置：`taoke.storage.*`（存储根目录、provider）、`taoke.upload.*`（校验规则）、`spring.servlet.multipart` 大小限制
- 更新 `docs/02-架构设计.md`，新增第 9 章「文件存储与上传」

## 2026-03-19 21:00
- 实现事件总线抽象层（`taoke-common/eventbus`）
- 框架层：`DomainEvent` 基类（eventId + occurredAt + abstract getTopic）、`EventPublisher` 接口、`@DomainEventListener` 自定义消费注解、`EventBusProperties` 配置
- RabbitMQ 适配层（`eventbus/rabbitmq`）：`RabbitEventConfig`（Topic Exchange + Jackson2Json）、`RabbitEventPublisher`、`RabbitEventListenerRegistrar`（BeanPostProcessor 自动扫描 @DomainEventListener 注册队列与消费者）
- 三个 RabbitMQ 组件均加 `@ConditionalOnClass(RabbitTemplate.class)`，实现中间件可插拔
- `taoke-common/pom.xml` 新增 `spring-boot-starter-amqp`（optional）
- YAML 配置：`spring.rabbitmq.*`（dev 连接信息）、`taoke.event.exchange`（Topic Exchange 名称）

## 2026-03-19 23:00
- 事件总线迭代优化：
  - `TopicResolver` — 从包名（`events.{module}`）+ 类名自动推导 topic，无需手动定义 TOPIC 常量；启动时校验 topic 唯一性
  - `DomainEvent` 基类重构 — 去掉 `abstract getTopic()`（topic 解析职责移至 `TopicResolver`）；字段扩充为 eventId / timestamp(Instant UTC) / eventType / operatorId(自动 SecurityContext) / aggregateType / aggregateId；构造器多态（无参-Jackson / 单参-仅 aggregateId / 双参-完整）
  - `@DomainEventListener` 简化 — 去掉 `topic` 属性，从方法参数类型自动推导
- 事件 Demo 完整闭环：
  - 事件定义：`taoke-common/events/user/ApplyPassedEvent`
  - 发布：`RoleApplyService.approve()` 审核通过后发布事件
  - 消费：`taoke-user/eventlistener/UserEventListener.onApplyPassed()`
- 全局配置整理：
  - `JacksonConfig` 删除 — YAML `spring.jackson.*` 已足够，AMQP `Jackson2JsonMessageConverter(objectMapper)` 回归 `RabbitEventConfig`（注入全局 ObjectMapper）
  - `RedisConfig`（taoke-common）— `RedisTemplate` JSON 序列化替代 JDK 二进制，`@ConditionalOnClass`
  - `AsyncConfig`（taoke-common）— 自定义线程池（core=4, max=16, queue=256, CallerRunsPolicy），异步异常全局日志
  - `CorsFilter`（taoke-app/filter）— YAML 配置化跨域，dev 全放开 / prod 限定域名
  - `taoke-common/pom.xml` 新增 `spring-boot-starter-data-redis`（optional）

## 2026-04-01 17:30
- 新增行政区划（common_regions）功能模块（`taoke-common`）
  - `Region` JPA 实体，映射 common_regions 表（code/name/parentCode/level 四级结构）
  - `RegionRepository`：按 parentCode 查子级、按 code 精确查、模糊搜索、existsByParentCode
  - `RegionService` 接口 + `RegionServiceImpl` 实现，含 ConcurrentHashMap 本地缓存
  - `RegionController`：三个 `@Public` GET 接口（`/regions/children`、`/regions/{code}`、`/regions/search`）
  - `RegionVO`、`RegionDetailVO` 响应 DTO
- `taoke-common` 包结构重构：从功能聚合包（upload/、region/）统一为按层分包
  - 新建 `controller/`、`service/`（接口）、`service/impl/`（实现）、`repository/` 包
  - upload 6 个文件迁移：UploadController → controller/，FileUploadService/Impl → service/ + service/impl/，FileUploadResponse → dto/，FileUploadProperties → config/，UploadBizType → enums/
  - region 6 个文件按分层创建，删除旧的 upload/ 和 region/ 包

## 2026-04-01 21:30
- 后端启动问题修复：
  - `Region` 实体 `code`/`parentCode` 字段改用 `columnDefinition = "CHAR(36)"`，匹配数据库 CHAR 类型，解决 Hibernate schema-validation 报错
  - RabbitMQ 开关完善：新增 `NoOpEventPublisher`（`@ConditionalOnProperty havingValue="false", matchIfMissing=true`），当事件总线关闭时兜底，避免 `EventPublisher` 注入失败
  - `DynamicAuthorizationManager` 构造器对 `RequestMappingHandlerMapping` 加 `@Lazy`，解决 Security 与 WebMvc 启动顺序循环依赖
- Frontend `modules/` → `features/` 目录重构（19 个文件）：
  - `features/auth/` — components（LoginForm、RegisterForm）+ api（types.ts、service.ts）
  - `features/home/` — components（8 个组件 + index.ts）+ data/mock.ts + types.ts
  - `features/course/` — api（types.ts、service.ts）
  - `features/user/` — api（types.ts、service.ts）
  - `lib/api/` 3 个文件迁入各 feature 的 api/service.ts，import 改为相对路径
  - 3 个 page 文件 import 路径从 `@/modules/` 更新为 `@/features/`
  - 旧 `modules/` 和 `lib/api/` 目录已删除
- Next.js 16 适配：`middleware.ts` 重命名为 `proxy.ts`（Next.js 16 约定变更）

## 2026-04-02 11:30
- 角色体系完善
  - Flyway V12：`sys_roles` 增加 `role_type` 字段（BUSINESS/PLATFORM），种子化 8 个业务角色
  - 新增 `RoleType` 枚举（`taoke-common`），替代硬编码字符串
  - `Role` 实体增加 `roleType` 字段，`AdminRoleController` 支持 `?type=` 过滤
  - `RoleRepository` 增加 `findByRoleType` 方法
- 后台用户管理 — 授权平台角色
  - 后端 `AdminUserController` 新增 `GET/PUT /admin/users/{id}/roles` 接口
  - 通过 `sys_roles.role_type` 动态判断平台角色（非硬编码），仅操作平台角色不影响业务角色
  - 前端新增 `AssignRolesDialog` 组件，仅展示平台管理角色供勾选
  - 新增 BFF 路由 `/api/users/[id]/roles`
- 分类管理（后台 CRUD）
  - `CategoryService` 补充写方法：`createCategory`、`updateCategory`、`deleteCategory`、`getFullTree`
  - `CategoryRepository` 增加 `existsByParentId`
  - `TrainerExpertise/IndustryCategoryRepository` 增加 `existsByCategoryId` 用于删除引用检查
  - 新增 `AdminCategoryController`（编排层）：树查询、增删改、删除时跨模块引用检查
  - 前端新增 `features/categories/` 模块（API + 组件）
  - `CategoryTreeTable` 树形表格：展开收起、可见性 Switch、增删改
  - `CategoryFormDialog` 新增/编辑分类弹窗
  - 侧边栏"分类管理"可折叠菜单，含课程分类、专家擅长领域、专家擅长行业子菜单
  - 动态路由 `/dashboard/categories/[type]` 共用同一页面
  - 优化侧边栏子菜单自动激活检测
- 课程分类数据入库
  - `CategoryType` 枚举新增 `COURSE_CATEGORY`
  - Flyway V13：种子化 27 个课程一级分类（来源 taoke.com/opencourse）
- 修复 `rolesQueryOptions` 的 `queryFn` 透传 context 对象导致 URL 拼接为 `[object Object]` 的 bug
- 清理重复配置文件：删除 `application.yaml` 和 `application-dev.yaml`（旧版），保留 `.yml`（完整版）
- `application.yml` 补充 `flyway.encoding: UTF-8`

## 2026-04-02 15:30
- 前端专家路由重命名：`/experts` → `/trainers`，全站链接、导航、i18n key 同步更新，旧路由保留重定向
- 后台管理 — 专家管理
  - 侧边栏"专家管理"拆分为父菜单，子菜单：专家列表、专家申请
  - 后端 `AdminTrainerController`：`GET /admin/trainers`（专家列表）、`GET /admin/trainers/applications`（申请列表）、`PUT .../approve`、`PUT .../reject`
  - `AdminTrainerService`：三段式分页查询 + 批量组装、审批/驳回委托 `RoleApplyService`
  - `RoleApplyService` 新增 `reject()` 方法（状态 → 已驳回 + 记录原因）
  - `UserEventListener` 增强：审核通过时自动更新 Trainer 状态与 approvedAt
  - 前端专家列表表格 + 申请管理表格（含审批/驳回弹窗）
- 站内信通知模块
  - Flyway V14：`sys_notifications` 表 + 索引
  - `NotificationType` 枚举（taoke-common）：SYSTEM / APPLY_RESULT / ORDER / COMMENT
  - `Notification` 实体 + `NotificationRepository`（分页查、未读计数、批量标已读）
  - `NotificationService` 接口 + 实现：send / sendBatch / listByUser / countUnread / markRead / markAllRead
  - C端 API：`GET /notifications`、`GET /notifications/unread-count`、`PUT /{id}/read`、`PUT /read-all`
  - 新增 `ApplyRejectedEvent` 领域事件，`RoleApplyServiceImpl.reject()` 发布驳回事件
  - `UserEventListener` 增强：审核通过/驳回 → 自动创建站内通知
  - Admin API：`POST /admin/notifications/broadcast` 广播系统公告
  - C端前端：导航栏铃铛 + 未读红点（30s 轮询）+ 下拉通知面板

## 2026-04-02 21:40
- 重构 taoke-admin 模块边界：消除跨模块 Repository 直接引用和 Entity 回写
  - 新建 `UserRoleService` api 接口 + `UserRoleServiceImpl`（封装用户角色查询与平台角色分配逻辑）
  - 扩展 `UserService`：新增 searchUsers / existsById / getActiveUserIds / findAllByIds
  - 扩展 `RoleService`：新增 findByRoleType；create / update 签名改为接收原始参数
  - 扩展 `PermissionService`：create / update 签名改为接收原始参数
  - 扩展 `TrainerService`：新增 searchForAdmin / findByUserIds / hasExpertise/IndustryCategoryReference
  - 重构 4 个 admin 文件（AdminUserService / AdminTrainerService / AdminNotificationController / AdminCategoryController）：全部改为通过 api/ 接口访问
  - 重构 AdminRoleService / AdminPermissionService：不再构造跨模块 Entity，改为传递原始参数
  - 架构文档更新：3.4 Admin 边界规则、5.1 Entity 只读约定、5.3 禁止事项
- 初始化 taoke-course 模块骨架（api / controller / service / repository / entity / dto / mapper / enums / eventlistener / config）

## 2026-04-02 20:30
- 修复 admin-frontend 图标库引用错误（lucide-react → @tabler/icons-react）
  - `template-table.tsx`：Pencil/Trash2/Plus → IconEdit/IconTrash/IconPlus
  - `send-notification-form.tsx`：X/Search/Send/Users/UserCheck/Globe → 对应 @tabler 图标
- 架构文档补充图标库说明：C端 lucide-react，管理后台 @tabler/icons-react

## 2026-04-02 23:50
- 课程模块后端完成 + 前端课程页面实现
  - 后端：设计并实现 `taoke-course` 模块
    - Flyway V16：创建 `courses` 和 `course_plans` 表
    - Flyway V17：`courses.type` 默认值改为 `INTERNAL`
    - `CourseType`（INTERNAL/OPEN_OFFLINE/OPEN_ONLINE）、`CourseStatus`（DRAFT→PENDING→PUBLISHED/REJECTED/UNPUBLISHED）枚举
    - `Course`/`CoursePlan` 实体、Repository、MapStruct Mapper
    - `SaveCourseRequest`/`CoursePlanDTO`/`CourseDetailVO`/`CourseListItemVO` DTO
    - `CourseService` API + `CourseServiceImpl`：发布者 CRUD、状态流转、公开接口、后台管理
    - `PublicCourseController`（`GET /courses` + `GET /courses/{id}`）：新增 `isOpen` 参数，`true`=公开课、`false`=内训课
    - `CourseController`（C 端发布者 CRUD，需 TRAINER/INSTITUTION 角色）
    - `AdminCourseController`（后台审核、上下架、主打切换）
    - `ErrorCode` 新增 4 个课程错误码（300xx 段）
    - `TrainerService` 新增 `findByIds` 方法，支持按 trainer_id 批量查讲师
  - 前端：课程路由重命名 + 列表/详情页实现
    - 路由变更：`/internal-courses` → `/innercourses`，`/public-courses` → `/opencourses`
    - `features/course/api/types.ts`：全新类型定义对齐后端 DTO
    - `features/course/api/service.ts`：`getCourseList`（支持 isOpen）、`getCourseDetail`、`getCourseCategoryTree`
    - 内训课列表页（`/innercourses`）：`InnerCourseListSection` + `InnerCourseCard` + `InnerCourseFilters`
    - 内训课详情页（`/innercourses/[id]`）：复用 `CourseHero` + `CourseSidebar` + `CourseDetailTabs`
    - 公开课列表页（`/opencourses`）：`OpenCourseListSection` + `OpenCourseCard` + `OpenCourseFilters`
    - 公开课详情页（`/opencourses/[id]`）：复用详情组件 + `CoursePlanTable`（开课计划表格）
    - 首页 `CoursesSection`/`PublicCoursesSection` 链接路径同步更新
    - `zh-CN/course.json` + `en/course.json` i18n 文案补充
    - 删除旧 `courses/page.tsx` 占位页
  - Flyway V18：插入 20 门种子课程（13 内训课 + 5 线下公开课 + 2 线上公开课）+ 16 条开课计划

## 2026-04-03 10:30
- 课程列表排序功能接入后端
  - 后端：`CourseService.listPublic()` 和 `PublicCourseController` 新增 `sortBy` 可选参数
  - 后端：`CourseServiceImpl` 新增 `resolvePublicSort()` 方法，支持 default/price/score/time/viewCount 五种排序方式
  - 前端：`CourseListParams` 新增 `sortBy` 字段，API 请求时传递
  - 前端：`OpenCourseListSection` 排序按钮点击后传递 sortBy 参数给后端（默认/开课时间/价格/评价）
  - 前端：`InnerCourseListSection` 排序按钮点击后传递 sortBy 参数给后端（默认/评分）
  - 前端：两个列表页的"默认"排序按钮后面新增 ArrowUpDown 排序图标

## 2026-04-01 20:25
- 从 taoke.com 抓取 15 位人力资源类专家种子数据并入库
  - 下载 15 张专家头像到 `frontend/public/statics/images/trainers/`，以 taoke ID 命名
  - 编写 Flyway V10 迁移 SQL（`V10__seed_trainer_data.sql`），共约 75 条语句：
    - `sys_users`：15 条虚拟用户（phone: `13266660001`~`13266660015`，avatar_url 指向本地路径）
    - `sys_user_roles`：15 条 TRAINER 角色分配
    - `user_trainers`：15 条专家主表记录（含省市 ID 映射，直辖市取"市辖区"条目）
    - `trainer_expertise_categories`：29 条擅长领域关联（人力资源/领导力/培训发展/经营战略/职业素养/质量管理/国学心理学）
  - SQL 使用 `SELECT id WHERE phone=...` 变量方式获取 user_id/trainer_id，不依赖硬编码自增 ID

## 2026-04-03 14:00
- 实现 C 端用户中心（个人用户中心）完整 UI，参照设计稿 `student_center_demo.html`
  - 将 `(portal)` Route Group 重命名为 `(usercenter)`，语义更清晰
  - 新建 `features/user-center` 模块，包含 `UserCenterHeader`（红色主题）、`UserCenterSidebar`（可折叠子菜单）、`UserCenterBreadcrumb` 三个核心组件
  - `(usercenter)/layout.tsx` 整体布局：红色 Header + 面包屑 + 侧边栏(220px) + 内容区 + 复用公共 AppFooter
  - 新增 15 个子页面（含 15 个路由常量和 i18n 文本）：
    - 已接入后端：个人主页(useAuth)、消息中心(GET /notifications + 标记已读)、账号信息(PUT /users/me)、身份信息、修改身份
    - 写死/TODO：我的学习(录播课+公开课)、我的订单(4 tabs)、我的需求、我的收藏(4 tabs)、我的点评、推广大使(协议)、培训合伙人(协议+表单)、721讲师合作(协议+表单)、账号认证、账号绑定
  - `next.config.ts` 添加 Unsplash / ui-avatars 图片域名白名单
