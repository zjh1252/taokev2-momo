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
