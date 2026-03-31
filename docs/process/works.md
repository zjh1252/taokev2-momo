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

