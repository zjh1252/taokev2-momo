# 消息通知模块 需求文档

> 模块编码：`message`  
> 版本：v1.0  
> 最后更新：2026-03-23

---

## 1. 模块概述

**消息通知模块**是淘课网平台的统一消息中枢，负责管理和发送平台内所有消息通知，覆盖短信（SMS）、微信公众号模板消息（WeChat）、站内消息（Platform）三大通道。通过统一的模板管理、事件触发机制和渠道路由策略，为用户提供及时、准确、可追溯的消息通知服务。

### 1.1 核心职责

| 职责 | 说明 |
|------|------|
| 模板管理 | 统一管理所有 SMS / 微信 / 站内消息的通知模板，支持增删改查与启停控制 |
| 事件驱动 | 各业务模块通过事件触发通知，模板绑定触发事件，自动完成渠道路由与消息发送 |
| 多通道发送 | 支持短信、微信公众号模板消息、站内消息三种通道，按场景自动选择或组合发送 |
| 站内消息 | 为用户提供站内消息收件箱，支持已读/未读标记、删除操作 |
| 用户偏好 | 用户可自定义各事件类型的通知偏好（启用/关闭某通道） |
| 发送日志 | 记录所有短信与微信消息的发送日志，支持状态追踪与失败重试 |

### 1.2 模块边界

- **本模块包含**：通知模板管理、站内消息管理、短信发送与日志、微信模板消息发送与日志、用户通知偏好配置、消息事件路由
- **本模块不包含**：短信运营商对接实现细节（→ 基础设施层）、微信公众号用户关注/openid 绑定（→ 用户模块）、业务事件的产生与定义（→ 各业务模块）、客服即时聊天消息（→ 客服模块）

### 1.3 通道定位

| 通道 | 编码 | 定位 | 典型场景 |
|------|------|------|----------|
| 短信 | `SMS` | 强触达，用于关键通知与验证 | 注册验证码、审核结果、提现到账、远程登录告警 |
| 微信公众号 | `WECHAT` | 中等触达，用于提醒与状态更新 | 开课提醒、课程状态变更、订单确认、充值到账 |
| 站内消息 | `PLATFORM` | 轻触达，覆盖全部非紧急通知 | 审核结果、需求进度、订单状态、系统公告 |

### 1.4 典型消息流转路径

```
业务模块产生事件（如：订单支付成功）
    → 消息模块接收事件
    → 查询该事件绑定的通知模板（可能多个通道）
    → 查询用户通知偏好（是否关闭了某通道）
    → 渲染模板内容（替换占位符）
    → 按通道分发
        ├── SMS → 调用短信服务 → 记录 sms_send_logs
        ├── WECHAT → 调用微信模板消息接口 → 记录 wechat_send_logs
        └── PLATFORM → 写入 notifications 表 → 用户站内收件箱
```

---

## 2. 功能描述

### 2.1 通知模板管理（后台）

#### 2.1.1 模板列表

| 功能 | 说明 |
|------|------|
| 模板列表 | 展示全部通知模板，支持按通道（SMS/WECHAT/PLATFORM）、触发事件、启用状态筛选 |
| 新增模板 | 填写模板编码、名称、通道、内容模板（支持占位符）、触发事件、备注 |
| 编辑模板 | 修改模板内容、触发事件、启用状态 |
| 启用/停用 | 停用后该模板不再触发发送，已发送的历史消息不受影响 |
| 删除模板 | 仅允许删除停用状态的模板，已关联发送记录的模板不可物理删除 |

#### 2.1.2 模板内容规范

- 占位符格式：`{variableName}`，如 `{username}`、`{courseName}`、`{orderNo}`
- SMS 模板需符合运营商审核规范，内容长度控制在 70 字以内（单条短信计费）
- 微信模板需与微信公众平台已审核通过的模板 ID 对应
- 站内消息模板无长度限制，支持富文本

#### 2.1.3 支持的触发事件与通道映射

| 触发事件 | 事件编码 | SMS | WECHAT | PLATFORM | 说明 |
|----------|---------|:---:|:------:|:--------:|------|
| 讲师/机构入驻审核通过 | `ENTRY_REVIEW_APPROVED` |  ✅  | — | ✅ | 审核通过通知 |
| 讲师/机构入驻审核驳回 | `ENTRY_REVIEW_REJECTED` |  ✅  | — | ✅ | 审核驳回通知，附驳回原因 |
| 公开课开课提醒 | `COURSE_OPENING_REMINDER` |  ✅  | ✅ | ✅ | 开课前 N 天提醒已报名用户 |
| 公开课信息变更 | `COURSE_INFO_CHANGED` |  ✅  | ✅ | ✅ | 通知已报名用户课程时间/地点/讲师变更 |
| 公开课确认开课 | `COURSE_CONFIRMED` |  ✅  | ✅ | ✅ | 通知已预约用户课程已确认开课 |
| 公开课已取消 | `COURSE_CANCELLED` |  ✅  | ✅ | ✅ | 通知已预约/已报名用户课程取消 |
| 支付成功 | `PAYMENT_SUCCESS` |  ✅   | ✅ | ✅ | 订单支付完成确认 |
| 退款状态更新 | `REFUND_STATUS_UPDATED` |  —  | ✅ | ✅ | 退款审核通过/驳回/到账通知 |
| 提现成功 | `WITHDRAWAL_SUCCESS` |  ✅  | ✅ | ✅ | 提现打款到账通知 |
| 需求同步失败告警 | `DEMAND_SYNC_FAILED` |  ✅  | — | ✅ | 通知前后台客服，需人工介入 |
| 版权课审核结果 | `COPYRIGHT_REVIEW_RESULT` |  ✅  | — | ✅ | 版权课审核通过/驳回通知 |
| 增值工具付费成功 | `TOOL_PAYMENT_SUCCESS` |  —  | ✅ | ✅ | 增值工具开通成功 |
| 增值工具付费失败 | `TOOL_PAYMENT_FAILED` |  —  | — | ✅ | 付费失败提示 |
| 充值折扣到账 | `RECHARGE_DISCOUNT_ARRIVED` |  —  | ✅ | ✅ | 充值成功，余额与折扣已生效 |
| 报名确认 | `REGISTRATION_CONFIRMED` |  —  | ✅ | ✅ | 公开课报名成功确认 |
| 草稿即将过期 | `DRAFT_EXPIRING` |  —  | — | ✅ | 草稿 48 小时即将到期提醒 |
| 客服消息未读超时 | `CS_MESSAGE_UNREAD_TIMEOUT` |  ✅  | — | ✅ | 客服 5 分钟未读消息告警 |
| 远程登录告警 | `REMOTE_LOGIN_ALERT` |  ✅  | — | ✅ | 异地登录安全提醒 |
| 课程审核结果 | `COURSE_REVIEW_RESULT` |  ✅  | — | ✅ | 课程审核通过/驳回通知 |
| 需求处理进度 | `DEMAND_PROGRESS_UPDATED` |  —  | — | ✅ | 需求状态变更通知企业用户 |
| 发票开具完成 | `INVOICE_ISSUED` |  —  | ✅ | ✅ | 发票已开具，可下载 |

### 2.2 站内消息（用户端）

#### 2.2.1 消息收件箱

| 功能 | 说明 |
|------|------|
| 消息列表 | 按时间倒序展示用户的全部站内消息，未读消息置顶或高亮 |
| 未读计数 | 页面顶部导航栏实时显示未读消息数量（红点 + 数字） |
| 消息详情 | 点击消息查看完整内容，自动标记为已读 |
| 标记已读 | 支持单条标记已读、批量标记已读、全部标记已读 |
| 删除消息 | 支持单条删除、批量删除，逻辑删除（用户侧不可见，数据保留） |
| 消息分类 | 按业务类型分类展示：审核通知、订单通知、课程通知、需求通知、系统通知 |

#### 2.2.2 消息关联跳转

- 消息附带 `related_type` 和 `related_id`，点击消息可跳转到关联的业务详情页
- 如：订单支付成功消息 → 点击跳转至订单详情页
- 如：课程审核通过消息 → 点击跳转至课程详情页

### 2.3 用户通知偏好设置

| 功能 | 说明 |
|------|------|
| 偏好入口 | 用户个人设置页 → 通知设置 |
| 配置维度 | 按事件类型 × 通道维度配置，如"支付成功"事件可分别开关 SMS/WECHAT/PLATFORM |
| 默认策略 | 新用户默认所有通道全部开启 |
| 强制通知 | 部分关键事件不受用户偏好控制，强制发送（如：验证码、安全告警、退款到账） |
| 实时生效 | 偏好变更后立即对后续消息生效 |

### 2.4 短信发送

| 功能 | 说明 |
|------|------|
| 发送能力 | 调用第三方短信运营商 API 发送短信 |
| 模板管理 | 短信模板需先在运营商平台审核通过，平台侧记录对应模板编码 |
| 发送日志 | 每条短信记录发送状态（待发送/已发送/发送失败）、运营商消息 ID、重试次数 |
| 失败重试 | 发送失败自动重试（最多 3 次，间隔 30s/60s/120s） |
| 频率控制 | 同一手机号同一模板 60 秒内不重复发送；同一手机号每日短信上限 20 条 |

### 2.5 微信模板消息发送

| 功能 | 说明 |
|------|------|
| 发送能力 | 调用微信公众号模板消息接口推送消息 |
| 前置条件 | 用户已关注公众号且平台已绑定 openid |
| 模板管理 | 微信模板 ID 需与公众平台已审核模板对应 |
| 发送日志 | 记录发送状态、微信消息 ID、模板数据（JSON） |
| 降级策略 | 若用户未绑定 openid，自动降级为站内消息；关键通知额外降级为短信 |

### 2.6 后台消息管理

| 功能 | 说明 |
|------|------|
| 发送日志查询 | 后台客服可查看短信、微信发送日志，按手机号/openid/状态/时间筛选 |
| 失败重发 | 对发送失败的消息可手动触发重发 |
| 群发消息 | 支持后台客服向指定用户群体发送站内公告消息 |
| 消息统计 | 各通道发送量、成功率、失败率统计面板 |

---

## 3. 实体属性（字段设计）

### 3.1 通知模板表 `notification_templates`

> 统一管理所有通道的通知模板，一个触发事件可对应多个不同通道的模板。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `template_code` | varchar(64) | NO | — | 模板编码，全局唯一，格式：`{CHANNEL}_{EVENT}`，如 `SMS_ENTRY_REVIEW_APPROVED` |
| `template_name` | varchar(100) | NO | — | 模板名称，如"入驻审核通过-短信通知" |
| `channel` | varchar(20) | NO | — | 通知通道：`SMS`=短信，`WECHAT`=微信公众号模板消息，`PLATFORM`=站内消息 |
| `trigger_event` | varchar(64) | NO | — | 触发事件编码，如 `ENTRY_REVIEW_APPROVED`、`PAYMENT_SUCCESS` 等 |
| `content_template` | text | NO | — | 模板内容，支持占位符，如"尊敬的{username}，您的入驻申请已通过审核" |
| `title_template` | varchar(200) | YES | NULL | 标题模板（站内消息使用），如"入驻审核结果通知" |
| `sms_sign` | varchar(20) | YES | NULL | 短信签名（SMS 通道），如"淘课网" |
| `sms_vendor_template_id` | varchar(64) | YES | NULL | 短信运营商模板 ID（SMS 通道） |
| `wechat_template_id` | varchar(64) | YES | NULL | 微信公众号模板 ID（WECHAT 通道） |
| `wechat_url` | varchar(500) | YES | NULL | 微信模板消息点击跳转 URL（WECHAT 通道） |
| `wechat_miniprogram` | varchar(500) | YES | NULL | 微信模板消息跳转小程序配置（JSON 格式） |
| `variables` | varchar(500) | YES | NULL | 模板变量列表（JSON 数组），如 `["username","courseName","courseTime"]`，用于前端展示与校验 |
| `related_type` | varchar(30) | YES | NULL | 关联业务类型，用于站内消息跳转：`ORDER`、`COURSE`、`DEMAND`、`REVIEW`、`WITHDRAWAL`、`SYSTEM` |
| `is_force` | tinyint | NO | 0 | 是否强制发送（不受用户偏好设置影响）：0=否，1=是 |
| `is_active` | tinyint | NO | 1 | 是否启用：0=停用，1=启用 |
| `remark` | varchar(500) | YES | NULL | 备注说明 |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | datetime | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引：**
- `UNIQUE idx_template_code (template_code)` — 模板编码全局唯一
- `idx_channel (channel)` — 按通道筛选
- `idx_trigger_event (trigger_event)` — 按触发事件查询关联模板
- `idx_channel_event (channel, trigger_event)` — 按通道+事件组合查询
- `idx_is_active (is_active)` — 按启用状态筛选

---

### 3.2 通知记录表 `notifications`

> 站内消息记录表，每条记录对应一个用户收到的一条站内消息。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `user_id` | int | NO | — | 接收用户 ID，关联 `users.id` |
| `template_id` | int | YES | NULL | 关联通知模板 ID，关联 `notification_templates.id`（群发消息可为 NULL） |
| `channel` | varchar(20) | NO | 'PLATFORM' | 通道：固定为 `PLATFORM`（站内消息） |
| `title` | varchar(200) | NO | — | 消息标题（渲染后） |
| `content` | text | NO | — | 消息内容（渲染后，占位符已替换为实际值） |
| `is_read` | tinyint | NO | 0 | 是否已读：0=未读，1=已读 |
| `read_at` | datetime | YES | NULL | 阅读时间 |
| `is_deleted` | tinyint | NO | 0 | 是否已删除（逻辑删除）：0=否，1=是 |
| `deleted_at` | datetime | YES | NULL | 删除时间 |
| `related_type` | varchar(30) | YES | NULL | 关联业务类型：`ORDER`=订单，`COURSE`=课程，`DEMAND`=需求，`REVIEW`=审核，`WITHDRAWAL`=提现，`REGISTRATION`=报名，`SYSTEM`=系统公告 |
| `related_id` | int | YES | NULL | 关联业务 ID（如订单 ID、课程 ID 等），用于消息点击跳转 |
| `sender_type` | varchar(20) | NO | 'SYSTEM' | 发送者类型：`SYSTEM`=系统自动，`CS`=客服手动，`ADMIN`=管理员群发 |
| `sender_id` | int | YES | NULL | 发送者 ID（客服/管理员手动发送时记录） |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 创建时间 |

**索引：**
- `idx_user_id (user_id, is_deleted, is_read)` — 用户消息列表查询（排除已删除、未读优先）
- `idx_user_unread (user_id, is_read)` — 未读消息计数
- `idx_related (related_type, related_id)` — 按关联业务查询消息
- `idx_template_id (template_id)` — 按模板查询发送记录
- `idx_created_at (created_at)` — 按时间排序
- `idx_sender (sender_type, sender_id)` — 按发送者查询

---

### 3.3 通知偏好设置表 `notification_configs`

> 用户对各事件类型的各通道通知偏好配置。无记录时视为默认启用。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `user_id` | int | NO | — | 用户 ID，关联 `users.id` |
| `channel` | varchar(20) | NO | — | 通知通道：`SMS`、`WECHAT`、`PLATFORM` |
| `event_type` | varchar(64) | NO | — | 事件类型编码，如 `PAYMENT_SUCCESS`、`COURSE_OPENING_REMINDER` |
| `is_enabled` | tinyint | NO | 1 | 是否启用该通道的该事件通知：0=关闭，1=启用 |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | datetime | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引：**
- `UNIQUE idx_user_channel_event (user_id, channel, event_type)` — 同一用户同一通道同一事件唯一
- `idx_user_id (user_id)` — 按用户查询全部偏好

---

### 3.4 短信发送日志表 `sms_send_logs`

> 记录每一条短信的发送明细与状态，用于发送追踪与失败重试。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `user_id` | int | YES | NULL | 接收用户 ID（系统内用户可关联；验证码等场景可能无用户 ID） |
| `phone` | varchar(20) | NO | — | 接收手机号 |
| `template_code` | varchar(64) | NO | — | 模板编码，关联 `notification_templates.template_code` |
| `content` | varchar(500) | NO | — | 短信内容（渲染后的实际发送内容） |
| `status` | varchar(20) | NO | 'PENDING' | 发送状态：`PENDING`=待发送，`SENT`=已发送，`DELIVERED`=已送达，`FAILED`=发送失败 |
| `vendor_msg_id` | varchar(128) | YES | NULL | 短信运营商返回的消息 ID |
| `vendor_response` | varchar(1000) | YES | NULL | 运营商返回的原始响应（JSON 格式） |
| `fail_reason` | varchar(500) | YES | NULL | 失败原因 |
| `retry_count` | int | NO | 0 | 已重试次数 |
| `max_retries` | int | NO | 3 | 最大重试次数 |
| `next_retry_at` | datetime | YES | NULL | 下次重试时间（失败后计算） |
| `sent_at` | datetime | YES | NULL | 实际发送成功时间 |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 创建时间 |

**索引：**
- `idx_phone (phone)` — 按手机号查询发送记录
- `idx_user_id (user_id)` — 按用户查询
- `idx_template_code (template_code)` — 按模板查询
- `idx_status (status)` — 按发送状态筛选（重试任务扫描）
- `idx_next_retry_at (status, next_retry_at)` — 定时任务扫描待重试记录
- `idx_vendor_msg_id (vendor_msg_id)` — 按运营商消息 ID 查询（回调对账）
- `idx_created_at (created_at)` — 按时间排序

---

### 3.5 微信发送日志表 `wechat_send_logs`

> 记录每一条微信公众号模板消息的发送明细与状态。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `user_id` | int | NO | — | 接收用户 ID，关联 `users.id` |
| `openid` | varchar(64) | NO | — | 用户微信 openid |
| `template_code` | varchar(64) | NO | — | 模板编码，关联 `notification_templates.template_code` |
| `wechat_template_id` | varchar(64) | NO | — | 微信公众号模板 ID |
| `data` | json | NO | — | 模板消息数据（JSON 格式，微信接口所需的 data 字段），如 `{"first":{"value":"您好"},"keyword1":{"value":"课程A"}}` |
| `url` | varchar(500) | YES | NULL | 消息点击跳转链接 |
| `miniprogram` | varchar(500) | YES | NULL | 小程序跳转配置（JSON 格式） |
| `status` | varchar(20) | NO | 'PENDING' | 发送状态：`PENDING`=待发送，`SENT`=已发送，`DELIVERED`=已送达，`FAILED`=发送失败 |
| `vendor_msg_id` | varchar(128) | YES | NULL | 微信返回的消息 ID（msgid） |
| `vendor_response` | varchar(1000) | YES | NULL | 微信返回的原始响应（JSON 格式） |
| `fail_reason` | varchar(500) | YES | NULL | 失败原因 |
| `retry_count` | int | NO | 0 | 已重试次数 |
| `max_retries` | int | NO | 3 | 最大重试次数 |
| `next_retry_at` | datetime | YES | NULL | 下次重试时间 |
| `sent_at` | datetime | YES | NULL | 实际发送成功时间 |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 创建时间 |

**索引：**
- `idx_user_id (user_id)` — 按用户查询
- `idx_openid (openid)` — 按 openid 查询发送记录
- `idx_template_code (template_code)` — 按模板查询
- `idx_status (status)` — 按发送状态筛选
- `idx_next_retry_at (status, next_retry_at)` — 定时任务扫描待重试记录
- `idx_vendor_msg_id (vendor_msg_id)` — 按微信消息 ID 查询
- `idx_created_at (created_at)` — 按时间排序

---


### 4.2 关系说明

| 关系 | 类型 | 说明 |
|------|------|------|
| `notification_templates` → `notifications` | 一对多 | 一个站内消息模板可生成多条站内消息 |
| `notification_templates` → `sms_send_logs` | 一对多 | 一个短信模板可生成多条短信发送记录 |
| `notification_templates` → `wechat_send_logs` | 一对多 | 一个微信模板可生成多条微信发送记录 |
| `users` → `notifications` | 一对多 | 一个用户接收多条站内消息 |
| `users` → `notification_configs` | 一对多 | 一个用户有多条通知偏好配置 |
| `users` → `sms_send_logs` | 一对多 | 一个用户关联多条短信发送记录 |
| `users` → `wechat_send_logs` | 一对多 | 一个用户关联多条微信发送记录 |

> **注意：** 数据库层面不建外键，所有关联关系在代码逻辑中维护。

---

## 5. 业务逻辑与规则

### 5.1 消息发送总流程

```
业务模块发布事件（EventBus / RabbitMQ）
    → 消息服务接收事件
    → 根据 trigger_event 查询 notification_templates（is_active=1）
    → 获取目标用户信息（user_id, phone, openid）
    → 遍历每个通道的模板：
        ├── 检查 is_force：强制通知跳过偏好检查
        ├── 非强制通知 → 查询 notification_configs 判断用户是否关闭了该通道
        │     ├── 已关闭 → 跳过该通道
        │     └── 未配置（无记录）→ 视为默认启用，继续发送
        └── 渲染模板（替换占位符为实际值）
            ├── PLATFORM → 写入 notifications 表
            ├── SMS → 写入 sms_send_logs（status=PENDING）→ 异步调用短信 API
            └── WECHAT → 校验 openid
                  ├── 有 openid → 写入 wechat_send_logs（status=PENDING）→ 异步调用微信 API
                  └── 无 openid → 降级为 PLATFORM（写入 notifications）
```

### 5.2 短信发送规则

| 规则 | 说明 |
|------|------|
| 频率控制 | 同一手机号 + 同一模板编码 60 秒内不重复发送 |
| 日上限 | 同一手机号每日短信发送上限 20 条（验证码类不计入） |
| 失败重试 | 发送失败后自动重试，重试间隔：30s → 60s → 120s，最多 3 次 |
| 重试扫描 | 定时任务每 30 秒扫描 `status=FAILED AND retry_count < max_retries AND next_retry_at <= NOW()` |
| 发送确认 | 运营商回调确认送达后更新 `status=DELIVERED` |

### 5.3 微信模板消息发送规则

| 规则 | 说明 |
|------|------|
| 前置校验 | 发送前校验用户已绑定 openid，未绑定则降级 |
| 降级策略 | 无 openid → 降级为站内消息；关键通知（`is_force=1`）额外降级为短信 |
| 失败重试 | 同短信重试策略：30s → 60s → 120s，最多 3 次 |
| 接口限制 | 遵守微信模板消息接口频率限制（当前为 10 万次/日） |

### 5.4 站内消息规则

| 规则 | 说明 |
|------|------|
| 消息保留 | 站内消息保留 180 天，超期由定时任务物理清理 |
| 逻辑删除 | 用户删除消息为逻辑删除（`is_deleted=1`），不影响后台统计与日志 |
| 未读计数 | 通过 `COUNT(user_id, is_read=0, is_deleted=0)` 实时查询或 Redis 缓存 |
| 群发消息 | 后台群发时按用户列表批量写入 notifications 表，每个用户一条独立记录 |
| 数据隔离 | 用户仅可查看 `user_id` = 当前登录用户的消息，不可跨用户查看 |

### 5.5 强制通知事件

以下事件为强制通知，不受用户偏好设置影响，始终按模板配置的通道发送：

| 事件 | 原因 |
|------|------|
| 验证码（注册/登录/修改密码） | 安全类通知，必须送达 |
| 远程登录告警 `REMOTE_LOGIN_ALERT` | 账户安全，必须及时告知 |
| 退款到账 `REFUND_STATUS_UPDATED` | 涉及资金，必须确认 |
| 提现成功 `WITHDRAWAL_SUCCESS` | 涉及资金，必须确认 |
| 公开课取消 `COURSE_CANCELLED` | 涉及已付费用户权益 |
| 客服消息未读超时 `CS_MESSAGE_UNREAD_TIMEOUT` | 内部运营告警 |
| 需求同步失败 `DEMAND_SYNC_FAILED` | 内部运营告警 |

### 5.6 模板变量渲染规则

- 占位符格式：`{variableName}`
- 渲染时从事件负载（Event Payload）中取值填充
- 变量缺失时填充默认值（空字符串），不抛异常，但记录警告日志
- 常用变量列表：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `{username}` | 用户名/昵称 | 张三 |
| `{phone}` | 手机号（脱敏） | 138****8888 |
| `{courseName}` | 课程名称 | 《高效沟通技巧》 |
| `{courseTime}` | 开课时间 | 2026-04-15 09:00 |
| `{courseCity}` | 开课城市 | 上海 |
| `{orderNo}` | 订单号 | ORD20260319143000123456 |
| `{amount}` | 金额 | ￥2,980.00 |
| `{reviewResult}` | 审核结果 | 已通过 / 已驳回 |
| `{rejectReason}` | 驳回原因 | 证书信息不完整 |
| `{trainerName}` | 讲师姓名 | 王教授 |
| `{orgName}` | 机构名称 | 某某培训学院 |

### 5.7 各场景通知策略明细

| 业务场景 | 触发条件 | 通知对象 | 通道 | 强制 |
|---------|---------|---------|------|:----:|
| 讲师/机构入驻审核通过 | 后台审核通过 | 讲师/机构管理员 | SMS + PLATFORM | 否 |
| 讲师/机构入驻审核驳回 | 后台审核驳回 | 讲师/机构管理员 | SMS + PLATFORM | 否 |
| 公开课开课提醒 | 定时任务（开课前 N 天） | 已报名用户 | WECHAT + PLATFORM | 否 |
| 公开课信息变更 | 课程编辑保存 | 已报名用户 | WECHAT + PLATFORM | 否 |
| 公开课确认开课 | 排课状态变更为 CONFIRMED | 已预约用户 | WECHAT + PLATFORM | 否 |
| 公开课已取消 | 排课状态变更为 CANCELLED | 已预约/已报名用户 | SMS + WECHAT + PLATFORM | ✅ |
| 支付成功 | 支付回调/客服确认到账 | 下单用户 | WECHAT + PLATFORM | 否 |
| 退款状态更新 | 退款审核通过/驳回/到账 | 申请退款用户 | WECHAT + PLATFORM | ✅ |
| 提现成功 | 打款完成 | 讲师/机构 | SMS + WECHAT + PLATFORM | ✅ |
| 需求同步失败 | 重试 3 次仍失败 | 前后台客服 | SMS + PLATFORM | ✅ |
| 版权课审核结果 | 后台审核通过/驳回 | 讲师/机构 | SMS + PLATFORM | 否 |
| 增值工具付费成功 | 支付回调 | 付费用户 | WECHAT + PLATFORM | 否 |
| 增值工具付费失败 | 支付失败回调 | 付费用户 | PLATFORM | 否 |
| 充值折扣到账 | 充值成功 | 充值用户 | WECHAT + PLATFORM | 否 |
| 报名确认 | 报名成功 | 报名用户 | WECHAT + PLATFORM | 否 |
| 草稿即将过期 | 定时任务（过期前 4 小时） | 草稿所有者 | PLATFORM | 否 |
| 客服消息未读超时 | 定时检测（5 分钟阈值） | 对应客服 | SMS + PLATFORM | ✅ |
| 远程登录告警 | 异地 IP 登录检测 | 登录用户 | SMS + PLATFORM | ✅ |
| 课程审核结果 | 后台审核通过/驳回 | 课程发布者 | SMS + PLATFORM | 否 |
| 需求处理进度 | 需求状态变更 | 需求提交企业 | PLATFORM | 否 |
| 发票开具完成 | 发票审核通过并开具 | 申请人 | WECHAT + PLATFORM | 否 |

### 5.8 消息事件投递规则

| 规则 | 说明 |
|------|------|
| 投递方式 | 业务模块通过 RabbitMQ 发送消息事件到统一消息队列 |
| 消息格式 | `{ "event": "PAYMENT_SUCCESS", "userId": 123, "payload": { "orderNo": "ORD...", "amount": "2980.00", ... }, "timestamp": "..." }` |
| 幂等处理 | 消息消费端做幂等校验，同一 `event + userId + relatedId` 在短时间窗口内不重复发送 |
| 消费失败 | 消费失败进入死信队列，由定时任务扫描重试或人工处理 |
| 异步解耦 | 消息发送全异步，不阻塞业务主流程；发送失败不回滚业务操作 |

---

## 6. 与其他模块的依赖关系

| 依赖模块 | 依赖方向 | 说明 |
|----------|---------|------|
| **用户模块 (users)** | 消息模块 ← 用户模块 | `notifications.user_id → users.id`，获取用户手机号、openid 等联系方式；用户通知偏好管理 |
| **订单模块 (orders)** | 消息模块 ← 订单模块 | 接收支付成功、退款状态更新、发票开具等事件，发送对应通知 |
| **课程模块 (courses)** | 消息模块 ← 课程模块 | 接收课程审核结果、公开课状态变更、开课提醒等事件，发送对应通知 |
| **讲师模块 (trainers)** | 消息模块 ← 讲师模块 | 接收入驻审核结果事件，发送对应通知 |
| **机构模块 (organizations)** | 消息模块 ← 机构模块 | 接收入驻审核结果事件，发送对应通知 |
| **需求模块 (demands)** | 消息模块 ← 需求模块 | 接收需求同步失败告警、需求进度更新事件，发送对应通知 |
| **评价模块 (reviews)** | 消息模块 ← 评价模块 | 接收评价审核结果等事件（如有需要） |
| **客服模块 (cs)** | 消息模块 ← 客服模块 | 接收客服消息未读超时告警事件 |
| **账户财务模块 (accounts)** | 消息模块 ← 账户模块 | 接收提现成功、充值到账等事件 |
| **安全模块 (security)** | 消息模块 ← 安全模块 | 接收远程登录告警事件 |
| **短信运营商 (外部)** | 消息模块 → 短信运营商 | 调用短信 API 发送短信，接收送达回调 |
| **微信公众平台 (外部)** | 消息模块 → 微信平台 | 调用微信模板消息接口发送推送，接收送达回调 |
| **消息队列 (RabbitMQ)** | 消息模块 ← 各业务模块 | 通过 RabbitMQ 接收各模块发布的业务事件 |

---

