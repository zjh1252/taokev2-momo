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

## 2026-04-07 17:30

- 实现课程购买支付完整流程（购物车 → 下单 → 支付 → 报名）
- Flyway V22：新建 carts、orders、order_items、payments、course_enrollments 5 张表
- 后端 taoke-course 模块新增 cart/order/pay 三个子包：
  - Entity：Cart、Order、OrderItem、Payment、CourseEnrollment
  - Enum：ProductType、OrderStatus、PaymentStatus、PaymentMethod
  - Repository / DTO / Mapper / Service / Controller 全套
  - 购物车 API：增删改查 + 数量统计（6 个接口）
  - 订单 API：创建（支持购物车结算 + 直接购买）、列表、详情、取消（4 个接口）
  - 支付 API：发起支付（模拟支付直接成功）、查询状态（2 个接口）
  - 支付成功回调自动生成 course_enrollments / video_enrollments 报名记录 + 更新 enrollment_count
  - 订单超时定时任务（@Scheduled 每分钟扫描关闭 30 分钟过期订单）
  - ErrorCode 新增 40001-40010 订单/支付错误码
  - TaokeApplication 新增 @EnableScheduling
- 前端新增 cart / order 两个 feature 模块：
  - API service + types + useCart hook
  - CartBadge（顶部购物车图标+badge）、CartItemCard、OrderCard、CheckoutSummary、PaymentModal 组件
  - /cart 购物车页面（全选/单选/数量/删除/结算）
  - /checkout 结算确认页 + 模拟支付弹窗
  - TopNavBar 左侧新增购物车入口
  - VideoSidebar / CourseSidebar 购买 + 购物车按钮对接真实 API
  - /dashboard/orders 订单列表页替换为真实数据（Tab 筛选 + 分页 + 支付弹窗）
  - i18n：新增 cart.json / order.json（zh-CN + en）、request.ts 注册命名空间
  - routes.ts 新增 CART / CHECKOUT 路由常量

## 2026-04-08 15:30

- 实现用户与资源互动模块（收藏、点赞、评价、专家留言）
- Flyway V23：新建 user_favorites、user_likes、training_reviews、trainer_lead_messages 4 张表
- 后端 taoke-course 模块新增 interaction 子包：
  - 枚举：InteractionTargetType / ReviewScope / ReviewStatus / LeadMessageStatus
  - Entity + Repository 各 4 个
  - DTO 7 个（收藏/点赞/评价/留言请求+响应 + 互动聚合状态）
  - Service 5 个（Favorite / Like / Review / TrainerMessage / InteractionTargetValidator）
  - Controller 5 个：收藏增删查、点赞增删查、评价提交+公开列表+我的列表、专家留言提交、互动聚合状态
  - API 接口 2 个：InteractionQueryService（跨模块只读查询）、ReviewModerationService（后台审核操作）
  - ErrorCode 新增 500xx 段 10 个互动错误码
- 前端新增 features/interaction 模块：
  - API 层：types.ts + service.ts（收藏/点赞/评价/留言/聚合状态）
  - ReviewDialog 评价弹窗（三维星评+培训信息表单）
  - TrainerMessageDialog 专家留言弹窗
- 前端已有页面接入：
  - TrainerHero：留言按钮 → TrainerMessageDialog、收藏按钮 → 真实收藏 API
  - CourseSidebar：收藏按钮 → 真实收藏 API、评价按钮 → ReviewDialog
  - TrainerDetailContent ReviewsView：mock 数据替换为真实 API + 新增"我要评价"
  - CourseDetailTabs 评价 Tab：从"暂无数据"改为真实评价列表
  - InstitutionHero：收藏按钮 → 真实收藏 API
  - 用户中心收藏页：mock 替换为真实 API 分页 + 取消收藏
  - 用户中心评价页：mock 替换为真实"我的评价"列表 + 提交入口
  - 用户中心学习页："去评价"按钮 → ReviewDialog
- 新增 docs/refactor-tables-mapping.md：新旧表映射说明

## 2026-04-11 16:50

实现敏感词、专家案例、专家精彩瞬间三个功能的后端部分：

**敏感词功能（taoke-common + taoke-admin）**

- Flyway V29: sys_sensitive_words 表
- DfaTrieFilter: 基于 DFA Trie 的高效敏感词匹配算法，启动时加载到内存
- SensitiveWord Entity + Repository
- SensitiveWordService / SensitiveWordServiceImpl: 检测/查找/替换 + 词库管理（CRUD/批量导入/重载）
- AdminSensitiveWordController: 分页查询、新增、编辑、删除、批量导入（文件上传）、手动重载
- ErrorCode 新增 900xx 段 3 个敏感词错误码

**专家案例功能（taoke-user + taoke-admin）**

- Flyway V30: user_trainer_cases + user_trainer_case_files 表
- TrainerCase + TrainerCaseFile Entity + Repository
- TrainerCaseService / TrainerCaseServiceImpl: 专家自服务（案例 CRUD + 文件管理）、C 端公开列表、后台分页查询/审核
- TrainerCaseController: 自服务 /trainers/me/cases/*、C 端公开 /trainers/{id}/cases
- AdminTrainerCaseController: /admin/trainer-cases/* 列表/详情/审核通过/驳回
- TrainerCaseApprovedEvent / TrainerCaseRejectedEvent 领域事件

**专家精彩瞬间功能（taoke-user + taoke-admin）**

- Flyway V31: user_trainer_highlights 表
- TrainerHighlight Entity + Repository
- TrainerHighlightService / TrainerHighlightServiceImpl: 专家自服务（CRUD + 批量排序）、C 端公开列表、后台审核
- TrainerHighlightController: 自服务 /trainers/me/highlights/*、C 端公开 /trainers/{id}/highlights
- AdminTrainerHighlightController: /admin/trainer-highlights/* 列表/详情/审核
- TrainerHighlightApprovedEvent / TrainerHighlightRejectedEvent 领域事件

**索引优化**

- Flyway V32: 优化 V29-V31 中的低效单列索引，替换为联合索引
- ErrorCode 新增 200xx 段 8 个案例/精彩瞬间错误码

## 2026-04-11 19:30

实现敏感词、专家案例、专家精彩瞬间三个功能的前端页面：

**Admin 后台 — 案例管理（admin-frontend）**

- features/trainer-cases: API 层（types + service + queries + server-service）
- BFF 路由: api/trainer-cases/[id]/approve|reject
- 组件: cases-table（columns + cell-action + index）、case-listing
- 页面: dashboard/trainers/cases — 列表 + 状态筛选 + 审核通过/驳回操作

**Admin 后台 — 精彩瞬间管理（admin-frontend）**

- features/trainer-highlights: API 层（types + service + queries + server-service）
- BFF 路由: api/trainer-highlights/[id]/approve|reject
- 组件: highlights-table（columns + cell-action + index）、highlight-listing
- 页面: dashboard/trainers/highlights — 带缩略图的列表 + 状态筛选 + 审核操作

**Admin 后台 — 敏感词管理（admin-frontend）**

- features/sensitive-words: API 层（types + service + queries + server-service）
- BFF 路由: api/sensitive-words/[id] + import + reload
- 组件: words-table（columns + cell-action + index）、word-form-dialog（新增/编辑）、import-dialog（批量导入）、page-actions（新增/导入/重载按钮）、word-listing
- 页面: dashboard/sensitive-words — CRUD 完整管理 + 批量导入 + 词库重载

**Admin 后台 — 导航更新**

- nav-config.ts: 专家管理下新增「案例管理」「精彩瞬间管理」；新增「内容管理」分组含「敏感词管理」
- use-breadcrumbs.tsx: 新增案例/精彩瞬间/敏感词的面包屑映射

**C 端用户中心 — 我的案例（frontend）**

- features/trainer-case: API 层（types + service）
- 页面: dashboard/cases/manage — 案例列表（状态 Tab + 卡片 + 编辑/删除）
- 页面: dashboard/cases/create — 发布案例表单（含封面上传）
- 页面: dashboard/cases/[id]/edit — 编辑案例

**C 端用户中心 — 我的精彩瞬间（frontend）**

- features/trainer-highlight: API 层（types + service）
- 页面: dashboard/highlights/manage — 精彩瞬间列表（网格布局 + 状态 Tab + 媒体预览）
- 页面: dashboard/highlights/create — 发布精彩瞬间（图片/视频类型选择 + 上传）
- 页面: dashboard/highlights/[id]/edit — 编辑精彩瞬间

**C 端导航更新**

- routes.ts: 新增 UC_CASES_MANAGE/CREATE、UC_HIGHLIGHTS_MANAGE/CREATE 路由常量
- user-center-sidebar.tsx: 新增「我的案例」和「我的精彩瞬间」分组菜单

---

 2026-04-13 10:10 
 案例/精彩瞬间功能修正与增强

**状态映射修正（前端对齐后端 3 态）**

- Admin + C 端：STATUS_MAP / STATUS_TABS / cell-action isPending 判断统一对齐后端 0=待审核 1=通过 2=驳回，去掉「草稿」状态
- 涉及文件：trainer-cases/types.ts、trainer-highlights/types.ts、columns.tsx、cell-action.tsx（Admin）；trainer-case/types.ts、trainer-highlight/types.ts、manage/page.tsx（C 端）

**后端精彩瞬间重构为集合模型**

- Flyway V33：新建 user_trainer_highlight_files 子表 + ALTER 父表加 cover_image + 数据迁移
- 新增 Entity：TrainerHighlightFile；修改 Entity：TrainerHighlight 增加 coverImage
- 新增 Repository：TrainerHighlightFileRepository（含批量查询 findByHighlightIdIn）
- 修改 Service：TrainerHighlightServiceImpl — 带出 files 列表、新增 addHighlightFile/deleteHighlightFile
- 修改 Controller：TrainerHighlightController 新增文件增删接口
- 更新 DTOs：TrainerHighlightResponse 带 coverImage + files；新增 SaveTrainerHighlightFileRequest/TrainerHighlightFileResponse
- 更新 Admin：AdminTrainerHighlightVO 增加 coverImage + files；AdminTrainerHighlightController 适配

**C 端通用组件**

- 新建 components/media-gallery.tsx：全屏灯箱组件（图片/视频、键盘导航、底部缩略图条）
- 新建 components/multi-file-uploader.tsx：多文件上传组件（拖拽、图片/视频混合、网格预览、逐个删除）

**C 端精彩瞬间页面重构**

- manage：卡片显示 coverImage + 文件数角标，点击弹出 Gallery 灯箱，删除用 AlertDialog
- create/edit：标题 + 描述 + 封面图 + 多文件上传区，编辑页支持即时增删文件
- API service：新增 addHighlightFile / deleteHighlightFile

**C 端案例页面增强**

- create/edit：新增「案例附件」多文件上传区，接入 addCaseFile / deleteCaseFile API
- manage：删除操作用 AlertDialog 替代 confirm/alert
- API service：新增 addCaseFile / deleteCaseFile

**Admin 后台精彩瞬间适配**

- types.ts：新增 TrainerHighlightFile 类型，AdminTrainerHighlight 增加 files/coverImage
- columns：缩略图取 coverImage → files[0]，新增「文件数」列

---

2026-04-14 17:10
**Elasticsearch 集成 IK 中文分词插件**

- 新建 deploy/elasticsearch/Dockerfile：基于 ES 8.19.13 镜像安装 analysis-ik 8.19.13 插件
- 更新 docker-compose.test.yml：ES 镜像改为 elasticsearch-with-ik:8.19.13，支持 build 构建
- 更新 SearchIndexService.buildMapping()：所有 text 字段从 standard 改为 ik_max_word（索引）/ ik_smart（搜索）
- 修复 date 字段格式：同时支持 ISO 格式（T 分隔）和空格分隔，解决显式 mapping 下日期解析失败问题

---

2026-04-21 11:00
**专家详情页接入真实数据 + 评论计数同步**

- V38 Flyway：新增 `user_trainer_books` 表（无审核流程）；按 `training_reviews` 已通过条数重算 `user_trainers` / `user_institutions` 的 `comment_count`，写法改为可重复执行（IF NOT EXISTS + INFORMATION_SCHEMA 列守卫 + 两步 UPDATE）
- 后端：新增 TrainerBook 全套（Entity / Repository / DTO / Service / Controller），暴露自服务接口 `/trainers/me/books` 与公开接口 `/trainers/{id}/books`
- 后端：ReviewServiceImpl 在审核通过/驳回/隐藏时调用 TrainerService.adjustCommentCountByUserId、InstitutionService.adjustCommentCount 同步 commentCount
- 后端：新增公开聚合接口 `/trainers/{id}/courses`、`/trainers/{id}/videos`，分别按 trainerId / publisherType+publisherId 过滤
- 前端：/trainers/[id] 改为 SSR 并发拉取 trainer / courses / videos / cases / books 真实数据
- 前端：TrainerDetailContent 重写主页/主讲课程/授课案例/录播课/学员评价/著作 6 个 tab，全部接入真实数据；著作完全去掉价格与「免费」字样；学员评价角标使用 trainer.commentCount

---

2026-04-22 11:30
**机构员工 / 经纪人 申请流程优化与历史绑定数据修复**

- 后端 InstitutionService 新增 lookup(keyword,size) + InstitutionController 暴露 GET /institutions/lookup（@Public，按机构名模糊匹配，仅返回已发布机构的 id/userId/orgName/association/address）
- 后端 BindingServiceImpl.initiateInstitutionEmployeeFromEmployee / initiateEnterpriseAgentMemberFromAgent 改为幂等：同一申请人对同一机构 / 经纪公司已存在 PENDING 时直接返回原绑定，不再误报「已有待处理的申请」
- 后端 requireEmployeeBindingConfirmer / requireEnterpriseAgentMemberConfirmer：当 initiator_user_id IS NULL（V41 之前的旧绑定）时，机构 / 经纪公司与员工 / 经纪人任一方均可处理，避免老数据卡住「无权处理该绑定」
- 新增 V42__backfill_binding_initiator.sql：把 user_institution_employee_bindings、user_enterprise_agent_members 中 initiator_user_id IS NULL 的旧记录回填为机构 / 经纪公司的 user_id
- 前端 features/institution-employee/api/service.ts 新增 lookupInstitutions + InstitutionLookupItem 类型
- 前端 InstitutionEmployeeForm 重写：移除「所属机构ID」输入框，改用 InstitutionPicker（与 EnterpriseAgentPicker 同款的关键字搜索 + 卡片选择）
- 前端新增通用拒绝弹窗 features/binding/components/reject-reason-dialog.tsx（shadcn Dialog + Textarea，200 字限制 + loading 状态）
- 前端替换所有 prompt('请输入拒绝理由（可选）') 为 RejectReasonDialog：my-employees / my-agents-team / my-enterprise-agent / my-institution / my-agents 共 5 个页面
- 前端统一发起方文案：「我方发起」→「我方发起邀请」、「对方发起」→「对方发起申请」（机构/公司侧）；「我方申请」→「我方发起申请」、「机构/公司邀请」→「对方发起邀请」（员工/经纪人侧）；my-experts 同步对齐

---

2026-05-23 19:10
**机构列表混入专家 — 应用层过滤**

- 根因：老站 `/company/` 含「organid 发过课」的全部会员（含 mold=2 专家课），迁移后 `org_name` 回退人名 + 会员头像，列表像专家页
- 后端：`Institution.publicListEligible` 字段 + `InstitutionServiceImpl.listPublic()` 仅返回 `public_list_eligible=1` 的行
- 手工脚本：`data-trans/scripts/run_institution_public_list_filter.py` 在 v3test 预跑收紧规则，并将应隐藏的专家 organ 行 `status=2`（旧后端只筛 `status=1` 时刷新即生效）
- 文档：`data-trans/docs/problem/机构列表混入专家-原因与修复.md`
- 数据库 DDL/回填见 `docs/guides/flyway-operations.md` §7（V70 / V71）

**专家详情主讲课程 404 + 标题 HTML 实体解码**

- 新增 `frontend/src/features/course/utils/routes.ts`：`getCourseDetailPath` 按课程类型跳转 `/opencourses/` 或 `/innercourses/`（C 端无 `/courses/[id]` 公开页）
- 修复 `TrainerDetailContent`、`TrainerSidebar` 中主讲课程/推荐课程链接 404
- 后端 `RecommendedCourseVO` 增加 `type` 字段，推荐课程侧边栏可正确区分路由
- 新增 `frontend/src/lib/html-entities.ts`：`decodeHtmlEntities` 解码老库标题中的 `&mdash;` 等实体；专家详情课程标题与 `OpenCourseCard` 接入

**C 端列表分页与 URL 同步（详情返回保留页码）**

- 新增 `frontend/src/hooks/use-list-page-url.ts`：翻页写入 `?page=`，浏览器后退时按 URL 恢复并拉取对应页数据
- 专家 / 公开课 / 内训课 / 录播课 / 机构（含培协）五个 `*ListSection` 接入 `useListPageUrlSync`；筛选/排序/搜索重置时清除 `page` 参数
- 各列表组件外包 `Suspense`，满足 `useSearchParams` 要求

---

2026-05-24 14:30
**C 端旧站媒体路径解析 + 录播/案例封面展示**

- `frontend/src/lib/media.ts`：`resolveImageSrc` 对 `/attachments/`、`/u/` 拼 `NEXT_PUBLIC_LEGACY_ASSET_BASE_URL`（默认 `https://www.taoke.com`）；支持 FSM hash、`preview.kuanxue.com`、`cdn5-pxb-videos.taoke.com` 等形态；`/statics`、`/uploads` 仍走本地或 ingress
- 录播课列表大量默认图根因：库内相对路径在 `localhost:3000` 404，`SafeImage` 回退占位图（库内 URL 批量规范化见 Flyway V67，`docs/guides/flyway-operations.md` §7）
- 专家详情「授课案例」Tab：`TrainerDetailContent` 案例封面由 Next `Image` 改为 `SafeImage`，修复 `/attachments/case/...` 在本地 404
- 新增 `data-trans/docs/guides/媒体资源路径说明.md`：迁移后各表 URL 形态统计、展示链路、老站下线前 OSS 永久化规划

**专家头衔展示过滤 + 运行时修复**

- 新增 `frontend/src/features/trainer/utils/displayTitle.ts`：`isDisplayTitle` / `pickDisplayTitle` 过滤 biography / 营销长段落误填为 `title` 的情况（>48 字、含「合作价值」等）
- `TrainerCard`、`TrainerHero`、`TrainerRecommendedScroller`、`TrainerSidebar` 副标题统一走 `pickDisplayTitle`
- 修复 `TrainerSidebar.tsx` 漏 import `pickDisplayTitle` 导致专家详情页 `ReferenceError`

**课程列表移除讲师头像/缩略图**

- `OpenCourseCard`、`InnerCourseCard`：移除左侧 48×48 封面/讲师头像，保留文字信息
- 首页 `CoursesSection`（热门内训课）：移除讲师圆形头像
- `CourseDetailTabs`（授课专家）：移除圆形首字母头像
- 搜索 `CourseResultCard`：公开课/内训课结果不再显示左侧缩略图

---

2026-05-25 16:00
**机构 Logo — 前端展示 + 运行时兜底**

- 根因：约 35% 机构 `logo_url` 为空；非空项多为旧站相对路径，部分组件未走 `resolveImageSrc` 导致 404
- 后端 `InstitutionServiceImpl.fillMissingLogos()` + `InstitutionRepository.findLogoRowsByOrgNames()`：公开列表/详情对仍缺 logo 的行按 `org_name` 从老库 organ 表运行时回填
- 前端 `InstitutionCard` / `InstitutionListSection` / `InstitutionHero` 改用 `SafeImage` + `resolveMediaUrl`；无图时用 `ui-avatars.com` 首字占位
- 样例机构 id 4/8/9 手工补 logo（`data-trans/scripts/_patch_sample_institution_logos.py`）；id 3/6/7 老库无可用图源仍为空
- 库内 URL 规范化与同名回填见 `docs/guides/flyway-operations.md` §7（V72 / V73）

**内训课侧栏筛选 — 前后端全量接入**

- 根因：`InnerCourseFilters.tsx` 除「课程分类」外均为 UI 占位未传参；后端原先未支持讲师维度筛选，L2 分类只匹配 `category_id` 导致结果为 0
- 前端：重写 `InnerCourseFilters.tsx`（综合类 / 课程行业 / 讲师城市 / 讲师独家 + L2 分类面板 + 已选 chips）；`InnerCourseListSection` 将筛选写入 API；`innercourses/page.tsx` 预载 `TRAINER_INDUSTRY` 分类树
- 前端 `getCourses` 扩展参数：`trainerIndustryCategoryId`、`trainerProvinceId`、`trainerCityId`、`trainerIsTrusted`、`trainerHasCopyright`（传 `1`，勿传 `true`）
- 后端 `PublicCourseQuery` 讲师维度字段；`TrainerService.findPublishedTrainerIds()` + `buildTrainerDimensionSpec()`；`CourseServiceImpl.listPublic()` 按专家 ID 过滤；`resolveExpandedCourseCategoryIds()` 同时匹配 `category_id` / `sub_category_id` 并展开 L1
- 修复 `CourseServiceImpl` 编译错误：`vo.setType(course.getType().name())`
- v3test API 验证（新代码）：无筛选 48016；L1 `188` → 2254；L2 `304` → 1241；行业 `157` → 6462；信得过 `1` → 1824
- 内训课分类 ID 与老 `tk_cate` 对齐见 `docs/guides/flyway-operations.md` §7（V74）

**专家详情子资源挂错 id + 授课案例接口异常**

- 根因：迁移后同名双行 `user_trainers`（canonical `status=2` vs donor 残留 id），课程/案例/视频/评价挂在 donor 行；部分案例 `created_at` 零日期导致 JPA 500
- `data-trans/scripts/merge_trainer_duplicate_resources.py`：将 donor 子资源归并到 canonical，donor `status=4`（约 131 组）
- `data-trans/scripts/fix_trainer_cases_books.py`：零日期修复 + 从 `taoke.tk_trainer_books` 补迁著作到 canonical `trainer_id`
- 文档：`data-trans/docs/problem/专家详情子资源挂错id-原因与修复.md`
- 零日期批量 UPDATE 见 `docs/guides/flyway-operations.md` §7（V69）

**本地后端启动（加载 IDE 编译产物）**

- IDE argfile 默认 classpath 指向 Maven 仓库 JAR，改 Java 后不 Rebuild 则筛选等新逻辑不生效
- 新增 `backend/scripts/run-dev-with-classes.ps1`：将 `taoke-user/course/admin/common` 的 `target/classes` 置于 classpath 最前
- 本机若无 `pwsh`，可用等价 PowerShell inline 命令启动；确认日志出现 `Started TaokeApplication` 后再验 API

---

2026-05-25 17:30
**首页专家案例「查看更多」跳转修正**

- `CasesSection.tsx`：`viewMoreHref` 由 `/cases` 改为 `/trainers`，与「推荐专家」区块一致

**机构 31513（CareerPower / 安秋明）排查 + V75 规则补漏**

- 老站无 `/company/31513`；老库为讲师安秋明（23 门 mold=2 讲师课），company 字段含地址，非真实培训机构
- 新增 Flyway `V75__exclude_trainer_only_organs_with_company_name.sql`：非合伙人、无机构课、有讲师课或专家档案 → 机构列表不可见（不再因名称含「有限公司」放行）
- 文档：`data-trans/docs/problem/机构31513-CareerPower-原因与修复.md`；审计脚本 `_audit_institution_31513.py`
- v3test：id=31513 已为 `status=2`、`public_list_eligible=0`，机构列表应不再出现；直接访问详情 URL 仍可能打开（需后续 API 按 status 拦截时可另做）

---

2026-06-11 11:30
**录播课播放迁移与第三方签发**

- 数据修复（v3test）：SWF→embed/置空、老库回填、第三方 canonical URL；约 5200+ 章节更新
- 后端签发：`LegacyThirdPartyPlaybackSigner`（eceibs/kuaike）、`KuanxuePlaybackSigner`、`SchoPlaybackSigner`；路由 `GET /videos/{id}/chapters/{chapterId}/playback-url`（`VideoPlaybackController` + `VideoChapterPlaybackService`）
- 配置：`taoke.legacy-video.{eceibs,kuaike,kuanxue,scho}`（`application.yaml`）
- 修复：`ErrorCode.BAD_REQUEST` → `PARAM_INVALID`；eceibs/kuaike 查询参数含中文昵称时 `UriComponentsBuilder.build(true)` 抛 500 → `appendQuery.encode(UTF_8)`
- 前端：`playback-mode.ts`（SWF→embed、识别需签发 URL）；`VideoEmbedPlayer` 调 playback-url；`video-playback-context` 空 URL 仅封面、无 toast；PXB 本地反代 `frontend/src/app/pxb-videos/[...path]/route.ts`
- 抽测：`data-trans/scripts/run_playback_api_test.py`（dev JWT，userId=1）；资源可达性 smoke test
- playback-url API：**2/2 通过** — eceibs 试看 `7449/2447`、思酷免费课 `15832/39652`
- v3test 章节 URL 分布（33697 章）：直链/CDN ~68.6%、embed ~11.8%、思酷租赁 ~4.3%、空 URL ~2.4%（797）、SWF ~0.9%（292）、eceibs 签发 ~0.2%（58）
- **可播性结论**：有地址且有权看的章节链路已通；约 **97%** 数据层可解析播放；**~3.3%** 仅封面或无法播放（空 URL 对齐老站 UX、SWF 无法 inline、56.com 等死链、第三方 iframe 环境/内容过期、付费章未购 403）
- 浏览器抽测样例：`/videos/7449`（eceibs 试看）、`/videos/15832`（思酷）、`/videos/6579`（PXB 直链）、`/videos/6736`（优酷 embed）

---

2026-06-17 18:00
**专家默认头像走素材库 + 首页客服与城市频道**

**专家列表/详情默认头像**

- 问题：无真实头像的专家出现空白、旧站「暂无照片」占位图或淘课 Logo，未回退到后台「头像素材库 → 专家头像 → 默认」
- 根因：`LegacyAvatarUrls.isUsable()` 过宽，占位 URL / 无路径脏数据被当作有效头像，`pickFirstUsable()` 提前返回，未走 `OpsMaterialResolver.resolveAvatarUrl()`
- 后端：`LegacyAvatarUrls` 扩展 `isPlaceholder()`（logo、expert-main、nophoto 等）；新增 `isUsableAvatar()`；`OpsMaterialResolver.resolveAvatarUrl()` 改用 `isUsableAvatar`；`TrainerServiceImpl` / `TrainerDocumentProvider` 统一经 `resolveAvatarUrl(raw, "TRAINER", …)` 解析
- 前端：`media.ts` 的 `isPlaceholderLegacyAvatar()` 与后端占位规则对齐
- 需手动重启后端后生效

**首页 AI 智能客服与城市频道**

- 首页「智能客服」入口（红色平台优势 Banner、右侧悬浮「在线客服」）改为唤起 `CustomerServiceChatDialog`，嵌入 `https://tk-service.taoke.com/chat-box?collection=tkw`（替换原 `/support`、`/ai-chat` 无效跳转）
- 移除首页底部暗色 `AiEngagementBanner`（「有任何培训疑问？随时咨询 AI 智能客服」卡片）
- 城市频道卡片全宽展示；展示城市数 9 → 18；网格 3/4/6 列响应式布局

---

## 2026-06-26 UC 组织成员对接 — 产品决策确认

**集成方式（已修正）**：淘课 v2 主动调 UC OpenAPI（`/app/AppToken/Get` + `ACCESS-TOKEN` + `AUTH`），复用培训宝模式；不在 uc_src 新增 syncUser 风格验签接口。

**已确认的产品规则：**

1. **身份标识 UI**：跟随 UC 租户 `unique_value` 动态展示（字段类型与 placeholder 随组织变化；淘课侧维护 fieldCode→中文标签映射，与 UC `unique_value` 枚举 1~4 对齐：姓名/工号/手机/邮箱）。
2. **Lookup 消歧**（同一 `unique_value` 命中多人）：
   - 优先取已开通移动学习账号（`elearning=1`）的成员；业务上仅一人开通。
   - 若均未开通，取创建时间最早（`createtime` 最小）的成员。
   - 未命中：提示未找到，允许纯淘课侧绑定（不阻断）。
   - **技术注记**：UC 现有 `GetStuIdByIdNo` 用 `getSingleStudent`→`current($res)` 无消歧，需在 UC 侧增强该接口或在淘课调用前走 list+排序逻辑。
3. **详情字段**：不设白名单；用户同意后原样展示/存储 `userList` 返回的全量字段（JSON）。
4. **企业买家员工**：
   - 记录淘课组织 ↔ UC 组织映射 + 成员 `p_stu_id` 关系。
   - **不与**机构员工、经纪经纪人共用「同类仅 1 条 ACTIVE 隶属」限制；同一用户可同时关联多家企业买家组织。
   - 机构（`INSTITUTION_EMPLOYEE`）、经纪公司（`AGENT`）仍保持现有单 ACTIVE 组织约束。

**待实现（淘课 v2 侧重）**：`user_uc_org_links`、`user_uc_member_links`；`UcOpenApiClient`（复用 `PxbGatewaySmsProvider` Token 逻辑）；组织设置「关联培训宝组织」；绑员工流程（lookup → 确认 → 拉详情）。

---

## 2026-06-26 UC 组织成员对接 — 代码实现

**后端（taokev2）**
- Flyway `V118__uc_org_member_links.sql`：`user_uc_org_links`、`user_uc_member_links`
- `UcOpenApiClient` + `taoke.uc.open-api` 配置（AppToken，凭据与 sms.pxb 共用）
- `UcIntegrationService` / `UcIntegrationController`：三类组织 `/me/uc-link`、`/uc-members/lookup`、`/sync-profile`
- `InitiateBindingRequest.ucMemberLinkId` + `BindingServiceImpl` 绑定成功后回填 UC 关联
- 企业买家成员 attach 接口（无单组织 ACTIVE 限制）

**UC（uc_src）**
- 新增 `/app/Company/GetUniqueValue` — 返回租户 unique_value 与 field_code
- 增强 `GetStuIdByIdNo` — 多人消歧（elearning 优先，否则 createtime 最早）

**前端（C 端）**
- `features/uc-integration/`：API + `UcOrgLinkPanel`
- 「我的员工」：UC 组织关联 + 添加员工对话框 UC lookup/详情同步
- 「我的经纪人」：UC 组织关联面板

