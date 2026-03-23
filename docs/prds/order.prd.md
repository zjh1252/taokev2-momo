# 订单与支付模块 需求文档

> 模块编码：`order`  
> 版本：v1.0  
> 最后更新：2026-03-23

---

## 1. 模块概述

**订单与支付模块**是淘课网平台的交易核心，承担课程购买、支付结算、退款处理、发票管理、提现结算等完整交易闭环职责。

### 1.1 核心职责

| 职责 | 说明                                        |
|------|-------------------------------------------|
| 订单管理 | 支持在线课的在线下单与订单全生命周期管理                      |
| 多方式支付 | 企业用户支持【公对公转账、企业微信/支付宝支付】；个人用户支持微信/支付宝个人支付 |
| 退款处理 | 课程订单退款申请、审核与退款记录管理                        |
| 发票申请 | 支持增值税普通发票与专用发票的申请、审核与电子发送                 |
| 提现结算 | 机构/讲师企业账户提现申请与平台结算                        |
| 充值折扣 | 充值余额支付享受阶梯折扣，公开课团购折扣                      |
| 订单凭证 | 支付成功后生成电子订单凭证，支持下载/打印                     |

### 1.2 模块边界

- **本模块包含**：订单创建与管理、支付记录、退款管理、发票申请、提现结算、订单操作日志
- **本模块不包含**：课程详情与发布（→ 课程模块）、用户充值与余额管理（→ 账户财务模块）、折扣规则配置（→ 后台运营模块）、课程评价（→ 评价模块）、消息通知发送（→ 消息模块）

### 1.3 业务范围说明

| 课程类型 | 是否支持在线下单 | 说明 |
|----------|:---------------:|------|
| 在线课 | ✅ | 个人/企业均可在线购买 |
| 线下公开课 | ✅ | 确认开课状态方可下单，支持团购折扣 |
| 内训课 | ❌ | 不开放平台直接下单，由后台客服线下对接签约 |
| 版权课 | ✅ | 按平台统一定价下单 |

---

## 2. 功能描述

### 2.1 订单创建

#### 2.1.1 在线课购买

| 项目 | 说明 |
|------|------|
| 入口 | 课程详情页"立即购买"按钮 |
| 购买人 | 企业用户（`ENTERPRISE_BUYER`）、个人用户（`INDIVIDUAL_BUYER`） |
| 下单信息 | 课程 ID、数量（在线课固定为 1）、选择支付方式 |
| 充值折扣 | 若用户账户有充值余额，可选择余额支付，享受对应阶梯折扣 |
| 订单生成 | 系统生成唯一订单号，记录课程快照信息（名称、价格、讲师/机构等） |
| 支付时限 | 订单创建后 30 分钟内未支付自动取消 |

#### 2.1.2 线下公开课购买

| 项目 | 说明 |
|------|------|
| 前置条件 | 公开课状态为「确认开课」（`CONFIRMED`）且有剩余名额 |
| 购买人 | 企业用户、个人用户 |
| 下单信息 | 公开课 ID、参课人数、参课人信息（姓名、手机号）、选择支付方式 |
| 团购折扣 | 企业用户报名 ≥2 人享受团购折扣（折扣比例由后台配置） |
| 名额锁定 | 下单时临时锁定名额（30 分钟），超时未支付释放名额 |
| 支付时限 | 订单创建后 30 分钟内未支付自动取消并释放名额 |

#### 2.1.3 版权课购买

| 项目 | 说明 |
|------|------|
| 定价规则 | 由平台统一定价，用户不可议价 |
| 购买流程 | 同在线课购买流程 |

#### 2.1.4 内训课说明

- 内训课**不支持**平台在线下单
- 企业用户通过咨询入口提交需求，由后台客服线下对接、签约、确认费用后录入系统
- 后台客服可在管理端手动创建内训课订单

### 2.2 订单管理

#### 2.2.1 用户端

| 功能 | 说明 |
|------|------|
| 订单列表 | 查看个人历史订单，支持按状态筛选：待支付、待开课、已完成、已取消 |
| 订单详情 | 查看订单号、课程信息、数量、金额、支付状态、支付时间、订单凭证 |
| 数据隔离 | 每个账号只能查看自己的订单，不可跨账号查看 |
| 取消订单 | 待支付状态的订单可手动取消 |
| 申请退款 | 已支付订单可发起退款申请（详见 2.4） |
| 申请发票 | 已完成订单可申请开票（详见 2.5） |
| 下载凭证 | 已支付订单可下载/打印电子订单凭证（PDF） |

#### 2.2.2 后台管理端

| 功能 | 说明 |
|------|------|
| 订单列表 | 全平台订单管理，支持按订单号、用户、课程类型、状态、时间范围筛选 |
| 订单详情 | 查看完整订单信息、支付记录、退款记录、发票记录、操作日志 |
| 手动创建 | 后台客服可为内训课等线下场景手动创建订单 |
| 确认收款 | 公对公转账场景，客服确认收款后手动更新支付状态 |
| 操作日志 | 记录订单所有状态变更与操作人信息 |

### 2.3 支付

#### 2.3.1 支付方式

| 支付方式 | 适用角色 | 优先级 | 说明 |
|----------|---------|--------|------|
| 公对公转账 | 企业用户 | 主要 | 企业用户首选，下单后系统展示平台对公账户信息，用户线下转账后由客服确认到账 |
| 微信企业支付 | 企业用户 | 次要 | 企业微信支付通道 |
| 支付宝企业支付 | 企业用户 | 次要 | 企业支付宝支付通道 |
| 微信支付 | 个人用户 | 主要 | 扫码支付 / H5 支付 |
| 支付宝支付 | 个人用户 | 主要 | 扫码支付 / H5 支付 |
| 余额支付 | 全部 | 可叠加 | 使用充值余额支付，享受阶梯折扣，可与其他方式组合支付 |

#### 2.3.2 支付流程

```
用户下单 → 选择支付方式
  ├── 在线支付（微信/支付宝）
  │     → 调用支付网关 → 等待回调 → 支付成功 → 更新订单状态
  ├── 公对公转账
  │     → 展示对公账户信息 → 用户线下转账 → 客服确认到账 → 更新订单状态
  └── 余额支付
        → 校验余额充足 → 扣减余额 → 计算折扣 → 更新订单状态
```

#### 2.3.3 支付成功后处理

- 更新订单状态为「已支付」
- 生成支付记录（`payments`），记录支付方式、渠道流水号、到账时间
- 生成电子订单凭证（PDF 格式），包含：订单号、课程名称、金额、支付时间、平台盖章
- 在线课：自动开通课程访问权限
- 公开课：确认报名成功，发送会务提醒（短信 + 站内消息）
- 当前阶段暂不处理支付失败异常场景（如超时、网络中断等），后续版本迭代

### 2.4 退款

| 项目 | 说明 |
|------|------|
| 发起角色 | 用户在前台提交退款申请 |
| 处理角色 | 后台客服审核退款申请 |
| 退款条件 | 订单状态为已支付/待开课；在线课未开始学习或学习进度 <10%；公开课开课前 3 天以上 |
| 申请信息 | 退款金额（默认全额，客服可调整）、退款原因（必填） |
| 审核流程 | 客服审核 → 同意退款 → 原路退回 → 标记退款完成；客服审核 → 拒绝退款 → 填写拒绝原因 → 通知用户 |
| 退款到账 | 在线支付原路退回（微信/支付宝）；公对公转账由财务线下退款后标记完成；余额支付退回至用户余额 |
| 退款记录 | 每笔退款生成独立退款记录，包含退款单号、金额、原因、处理状态、处理时间 |

### 2.5 发票申请

| 项目 | 说明 |
|------|------|
| 申请条件 | 订单状态为已完成（已支付 + 课程已交付/已开课） |
| 发票类型 | 增值税普通发票、增值税专用发票 |
| 填写信息 | 发票类型、发票抬头、税号（专票必填）、接收邮箱 |
| 审核流程 | 用户提交 → 平台财务审核 → 审核通过 → 开具电子发票 → 发送至指定邮箱 |
| 驳回处理 | 信息有误时驳回，用户可修改后重新提交 |
| 发票状态 | 待审核、审核通过/已开具、审核驳回 |

### 2.6 提现

| 项目 | 说明 |
|------|------|
| 申请角色 | 机构管理员（`ORGANIZATION`）、讲师（`TRAINER`） |
| 提现账户 | 企业对公账户（银行名称、银行账号、账户名称） |
| 申请信息 | 提现金额、收款银行信息 |
| 审核流程 | 提交申请 → 平台审核 → 审核通过 → 财务打款 → 标记已结算 |
| 提现记录 | 查看历史提现记录，包含申请时间、金额、状态、结算时间 |
| 规则限制 | 提现金额不超过可用余额；单笔提现最低 100 元；每月最多 4 次 |

### 2.7 充值消费折扣

#### 2.7.1 在线课充值折扣

| 项目 | 说明 |
|------|------|
| 适用范围 | 使用充值余额购买在线课时享受折扣 |
| 折扣规则 | 按充值金额阶梯设置折扣比例，充值越多折扣越大（如充 1000 享 95 折、充 5000 享 9 折等） |
| 配置方式 | 后台管理员配置阶梯折扣规则 |
| 折扣计算 | 下单时自动匹配用户当前折扣等级，展示折后价格 |

#### 2.7.2 公开课团购折扣

| 项目 | 说明 |
|------|------|
| 适用范围 | 企业用户报名线下公开课 |
| 触发条件 | 同一企业用户单笔订单报名人数 ≥2 人 |
| 折扣规则 | 由后台管理员按人数阶梯配置（如 2-4 人 95 折、5 人以上 9 折等） |
| 折扣计算 | 下单时自动判断是否满足团购条件，展示折后总价 |

---

## 3. 实体属性（字段设计）

### 3.1 订单主表 `orders`

> 记录每一笔订单的基础信息与状态。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `order_no` | varchar(64) | NO | — | 订单编号，全局唯一，格式：`ORD{yyyyMMddHHmmss}{6位随机数}` |
| `user_id` | int | NO | — | 下单用户 ID，关联 `users.id` |
| `order_type` | varchar(20) | NO | — | 订单类型：`ONLINE_COURSE`（在线课）、`OPEN_COURSE`（线下公开课）、`COPYRIGHT_COURSE`（版权课）、`INTERNAL_TRAINING`（内训课，仅后台创建） |
| `status` | tinyint | NO | 1 | 订单状态：1=待支付，2=已支付/待开课，3=已完成，4=已取消，5=退款中，6=已退款 |
| `total_amount` | decimal(12,2) | NO | 0.00 | 订单原始总金额 |
| `discount_amount` | decimal(12,2) | NO | 0.00 | 折扣减免金额 |
| `actual_amount` | decimal(12,2) | NO | 0.00 | 实际应付金额（= total_amount - discount_amount） |
| `paid_amount` | decimal(12,2) | NO | 0.00 | 实际已付金额 |
| `payment_method` | varchar(20) | YES | NULL | 支付方式：`WECHAT`、`ALIPAY`、`BANK_TRANSFER`、`BALANCE`、`MIXED`（组合支付） |
| `discount_type` | varchar(20) | YES | NULL | 折扣类型：`RECHARGE`（充值折扣）、`GROUP`（团购折扣）、`NONE` |
| `discount_rule_snapshot` | varchar(512) | YES | NULL | 折扣规则快照（JSON 格式，记录下单时适用的折扣规则） |
| `contact_name` | varchar(64) | YES | NULL | 联系人姓名 |
| `contact_phone` | varchar(20) | YES | NULL | 联系人电话 |
| `remark` | varchar(500) | YES | NULL | 订单备注 |
| `voucher_url` | varchar(512) | YES | NULL | 电子订单凭证文件 URL |
| `paid_at` | datetime | YES | NULL | 支付完成时间 |
| `completed_at` | datetime | YES | NULL | 订单完成时间 |
| `cancelled_at` | datetime | YES | NULL | 订单取消时间 |
| `cancel_reason` | varchar(255) | YES | NULL | 取消原因 |
| `expire_at` | datetime | YES | NULL | 支付截止时间（下单后 30 分钟） |
| `created_by` | int | YES | NULL | 创建人 ID（后台手动创建时记录客服 ID） |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | datetime | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引：**
- `UNIQUE idx_order_no (order_no)` — 订单编号唯一
- `idx_user_id (user_id)` — 按用户查询订单
- `idx_status (status)` — 按状态筛选
- `idx_order_type (order_type)` — 按订单类型筛选
- `idx_created_at (created_at)` — 按创建时间排序
- `idx_expire_at (expire_at)` — 定时任务扫描超时未支付订单

---

### 3.2 订单明细表 `order_items`

> 记录订单中每一项课程的详细信息（课程快照），一个订单可包含多条明细。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `order_id` | int | NO | — | 订单 ID，关联 `orders.id` |
| `course_id` | int | NO | — | 课程 ID，关联课程模块 |
| `course_type` | varchar(20) | NO | — | 课程类型：`ONLINE_COURSE`、`OPEN_COURSE`、`COPYRIGHT_COURSE`、`INTERNAL_TRAINING` |
| `title` | varchar(255) | NO | — | 课程名称（下单时快照） |
| `cover_url` | varchar(512) | YES | NULL | 课程封面图 URL（快照） |
| `trainer_id` | int | YES | NULL | 讲师 ID |
| `trainer_name` | varchar(100) | YES | NULL | 讲师姓名（快照） |
| `org_id` | int | YES | NULL | 机构 ID |
| `org_name` | varchar(200) | YES | NULL | 机构名称（快照） |
| `unit_price` | decimal(12,2) | NO | 0.00 | 课程单价 |
| `quantity` | int | NO | 1 | 数量（在线课固定 1，公开课为参课人数） |
| `subtotal` | decimal(12,2) | NO | 0.00 | 小计金额（= unit_price × quantity） |
| `discount_amount` | decimal(12,2) | NO | 0.00 | 该项折扣金额 |
| `actual_amount` | decimal(12,2) | NO | 0.00 | 该项实付金额 |
| `course_start_at` | datetime | YES | NULL | 开课时间（公开课） |
| `course_address` | varchar(255) | YES | NULL | 开课地点（公开课） |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | datetime | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引：**
- `idx_order_id (order_id)` — 按订单查询明细
- `idx_course_id (course_id)` — 按课程查询关联订单
- `idx_trainer_id (trainer_id)` — 按讲师查询关联订单（收益统计用）
- `idx_org_id (org_id)` — 按机构查询关联订单（收益统计用）

---

### 3.3 公开课参课人表 `order_attendees`

> 公开课订单的参课人员信息，一个订单项可对应多名参课人。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `order_id` | int | NO | — | 订单 ID，关联 `orders.id` |
| `order_item_id` | int | NO | — | 订单明细 ID，关联 `order_items.id` |
| `attendee_name` | varchar(64) | NO | — | 参课人姓名 |
| `attendee_phone` | varchar(20) | NO | — | 参课人手机号 |
| `attendee_company` | varchar(128) | YES | NULL | 参课人所在公司 |
| `attendee_position` | varchar(64) | YES | NULL | 参课人职位 |
| `check_in_status` | tinyint | NO | 0 | 签到状态：0=未签到，1=已签到 |
| `check_in_at` | datetime | YES | NULL | 签到时间 |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | datetime | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引：**
- `idx_order_id (order_id)` — 按订单查询参课人
- `idx_order_item_id (order_item_id)` — 按订单明细查询
- `idx_attendee_phone (attendee_phone)` — 按手机号查询参课记录

---

### 3.4 支付记录表 `payments`

> 记录每一笔支付流水，一个订单可能有多条支付记录（组合支付场景）。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `order_id` | int | NO | — | 订单 ID，关联 `orders.id` |
| `payment_no` | varchar(64) | NO | — | 支付流水号，全局唯一 |
| `method` | varchar(20) | NO | — | 支付方式：`WECHAT`、`ALIPAY`、`BANK_TRANSFER`、`BALANCE` |
| `amount` | decimal(12,2) | NO | 0.00 | 支付金额 |
| `status` | tinyint | NO | 0 | 支付状态：0=待支付，1=支付成功，2=支付失败，3=已退款 |
| `channel_trade_no` | varchar(128) | YES | NULL | 第三方支付渠道交易号 |
| `channel_response` | text | YES | NULL | 第三方支付渠道返回原始数据（JSON） |
| `paid_at` | datetime | YES | NULL | 实际到账/确认时间 |
| `confirmed_by` | int | YES | NULL | 确认人 ID（公对公转账由客服手动确认时记录） |
| `remark` | varchar(255) | YES | NULL | 备注 |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | datetime | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引：**
- `UNIQUE idx_payment_no (payment_no)` — 支付流水号唯一
- `idx_order_id (order_id)` — 按订单查询支付记录
- `idx_status (status)` — 按支付状态筛选
- `idx_method (method)` — 按支付方式筛选
- `idx_channel_trade_no (channel_trade_no)` — 按渠道交易号查询（支付回调对账）

---

### 3.5 退款记录表 `refunds`

> 记录每一笔退款申请及处理结果。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `order_id` | int | NO | — | 订单 ID，关联 `orders.id` |
| `refund_no` | varchar(64) | NO | — | 退款单号，全局唯一 |
| `payment_id` | int | YES | NULL | 关联原支付记录 ID |
| `amount` | decimal(12,2) | NO | 0.00 | 退款金额 |
| `reason` | varchar(500) | NO | — | 退款原因 |
| `status` | tinyint | NO | 0 | 退款状态：0=待审核，1=审核通过/退款中，2=退款完成，3=审核驳回 |
| `reject_reason` | varchar(500) | YES | NULL | 驳回原因 |
| `refund_method` | varchar(20) | YES | NULL | 退款方式：`ORIGINAL`（原路退回）、`BALANCE`（退至余额）、`OFFLINE`（线下退款） |
| `channel_refund_no` | varchar(128) | YES | NULL | 第三方退款渠道流水号 |
| `reviewer_id` | int | YES | NULL | 审核人 ID |
| `reviewed_at` | datetime | YES | NULL | 审核时间 |
| `refunded_at` | datetime | YES | NULL | 退款完成时间 |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | datetime | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引：**
- `UNIQUE idx_refund_no (refund_no)` — 退款单号唯一
- `idx_order_id (order_id)` — 按订单查询退款记录
- `idx_status (status)` — 按退款状态筛选
- `idx_reviewer_id (reviewer_id)` — 按审核人查询
- `idx_created_at (created_at)` — 按申请时间排序

---

### 3.6 发票记录表 `invoices`

> 记录用户的发票申请与开票状态。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `order_id` | int | NO | — | 订单 ID，关联 `orders.id` |
| `invoice_no` | varchar(64) | YES | NULL | 发票号码（开具后填入） |
| `type` | varchar(20) | NO | — | 发票类型：`NORMAL`（增值税普通发票）、`SPECIAL`（增值税专用发票） |
| `title` | varchar(200) | NO | — | 发票抬头 |
| `tax_no` | varchar(50) | YES | NULL | 税号（专票必填） |
| `bank_name` | varchar(200) | YES | NULL | 开户银行（专票选填） |
| `bank_account` | varchar(50) | YES | NULL | 银行账号（专票选填） |
| `company_address` | varchar(255) | YES | NULL | 企业地址（专票选填） |
| `company_phone` | varchar(30) | YES | NULL | 企业电话（专票选填） |
| `email` | varchar(128) | NO | — | 接收邮箱 |
| `amount` | decimal(12,2) | NO | 0.00 | 开票金额 |
| `status` | tinyint | NO | 0 | 发票状态：0=待审核，1=已开具，2=审核驳回 |
| `reject_reason` | varchar(500) | YES | NULL | 驳回原因 |
| `invoice_file_url` | varchar(512) | YES | NULL | 电子发票文件 URL |
| `reviewer_id` | int | YES | NULL | 审核人 ID |
| `reviewed_at` | datetime | YES | NULL | 审核时间 |
| `issued_at` | datetime | YES | NULL | 开票时间 |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | datetime | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引：**
- `idx_order_id (order_id)` — 按订单查询发票
- `idx_status (status)` — 按发票状态筛选
- `idx_invoice_no (invoice_no)` — 按发票号码查询
- `idx_created_at (created_at)` — 按申请时间排序

---

### 3.7 提现申请表 `withdrawals`

> 记录机构/讲师的提现申请与结算状态。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `withdrawal_no` | varchar(64) | NO | — | 提现单号，全局唯一 |
| `user_id` | int | NO | — | 申请人用户 ID，关联 `users.id` |
| `user_role` | varchar(32) | NO | — | 申请人角色：`TRAINER`、`ORGANIZATION` |
| `amount` | decimal(12,2) | NO | 0.00 | 提现金额 |
| `bank_name` | varchar(200) | NO | — | 开户银行 |
| `bank_branch` | varchar(200) | YES | NULL | 开户支行 |
| `bank_account` | varchar(50) | NO | — | 银行账号 |
| `account_name` | varchar(100) | NO | — | 账户名称 |
| `status` | tinyint | NO | 0 | 提现状态：0=待审核，1=审核通过，2=已打款/已结算，3=审核驳回 |
| `reject_reason` | varchar(500) | YES | NULL | 驳回原因 |
| `reviewer_id` | int | YES | NULL | 审核人 ID |
| `reviewed_at` | datetime | YES | NULL | 审核时间 |
| `settled_at` | datetime | YES | NULL | 打款/结算完成时间 |
| `remark` | varchar(500) | YES | NULL | 备注 |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | datetime | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引：**
- `UNIQUE idx_withdrawal_no (withdrawal_no)` — 提现单号唯一
- `idx_user_id (user_id)` — 按用户查询提现记录
- `idx_status (status)` — 按状态筛选
- `idx_user_role (user_role)` — 按角色筛选
- `idx_created_at (created_at)` — 按申请时间排序

---

### 3.8 订单操作日志表 `order_operation_logs`

> 记录订单全生命周期的操作轨迹，用于审计与追溯。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `order_id` | int | NO | — | 订单 ID，关联 `orders.id` |
| `operator_id` | int | NO | — | 操作人用户 ID |
| `operator_role` | varchar(32) | YES | NULL | 操作人角色 |
| `action` | varchar(64) | NO | — | 操作类型：`CREATE`（创建订单）、`PAY`（支付）、`CONFIRM_PAY`（确认收款）、`CANCEL`（取消）、`APPLY_REFUND`（申请退款）、`APPROVE_REFUND`（同意退款）、`REJECT_REFUND`（拒绝退款）、`COMPLETE_REFUND`（退款完成）、`APPLY_INVOICE`（申请发票）、`ISSUE_INVOICE`（开具发票）、`COMPLETE`（订单完成） |
| `action_detail` | varchar(512) | YES | NULL | 操作详情 |
| `before_status` | tinyint | YES | NULL | 操作前订单状态 |
| `after_status` | tinyint | YES | NULL | 操作后订单状态 |
| `ip` | varchar(45) | YES | NULL | 操作 IP |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 操作时间 |

**索引：**
- `idx_order_id (order_id)` — 按订单查询操作日志
- `idx_operator_id (operator_id)` — 按操作人查询
- `idx_action (action)` — 按操作类型筛选
- `idx_created_at (created_at)` — 按时间排序

---


### 4.2 关系说明

| 关系 | 类型 | 说明 |
|------|------|------|
| `users` → `orders` | 一对多 | 一个用户可创建多个订单 |
| `orders` → `order_items` | 一对多 | 一个订单包含一条或多条课程明细 |
| `orders` → `order_attendees` | 一对多 | 公开课订单关联多名参课人 |
| `order_items` → `order_attendees` | 一对多 | 一条明细对应该课程的所有参课人 |
| `orders` → `payments` | 一对多 | 一个订单可有多条支付记录（组合支付） |
| `orders` → `refunds` | 一对多 | 一个订单可产生多条退款记录 |
| `orders` → `invoices` | 一对多 | 一个订单可申请多次发票（驳回后重新申请） |
| `orders` → `order_operation_logs` | 一对多 | 一个订单有完整的操作日志链 |
| `users` → `withdrawals` | 一对多 | 一个用户（讲师/机构）可多次提现 |

> **注意：** 数据库层面不建外键，所有关联关系在代码逻辑中维护。

---

## 5. 业务逻辑与规则

### 5.1 订单状态流转

```
┌─────────────────────────────────────────────────────────────────┐
│                        订单状态机                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   创建订单 ──► [待支付 status=1]                                 │
│                  │          │                                    │
│       用户支付   │          │ 超时/用户取消                       │
│                  ▼          ▼                                    │
│         [已支付/待开课      [已取消 status=4]                     │
│          status=2]            (终态)                             │
│            │        │                                            │
│  课程完成  │        │ 用户申请退款                                │
│            ▼        ▼                                            │
│      [已完成       [退款中 status=5]                              │
│       status=3]      │          │                                │
│       (终态)    退款成功│         │ 退款驳回                      │
│                      ▼          ▼                                │
│               [已退款          [已支付/待开课                     │
│                status=6]        status=2]                        │
│                (终态)          (回退)                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**状态流转规则：**

| 当前状态 | 触发事件 | 目标状态 | 说明 |
|---------|---------|---------|------|
| 待支付(1) | 支付成功 | 已支付/待开课(2) | 在线支付回调或客服确认到账 |
| 待支付(1) | 超时未支付 | 已取消(4) | 定时任务扫描 `expire_at < NOW()` |
| 待支付(1) | 用户取消 | 已取消(4) | 用户主动取消 |
| 已支付/待开课(2) | 课程完成 | 已完成(3) | 在线课完成学习 / 公开课结课 |
| 已支付/待开课(2) | 申请退款 | 退款中(5) | 用户提交退款申请 |
| 退款中(5) | 退款成功 | 已退款(6) | 客服审核通过且退款到账 |
| 退款中(5) | 退款驳回 | 已支付/待开课(2) | 客服审核驳回，回退原状态 |

### 5.2 支付流程

#### 5.2.1 在线支付流程（微信/支付宝）

```
用户选择支付方式
  → 创建 payments 记录（status=0 待支付）
  → 调用第三方支付 SDK 生成预支付参数
  → 前端拉起支付组件
  → 用户完成支付
  → 接收第三方回调通知
  → 校验签名与金额
  → 更新 payments.status=1, 记录 channel_trade_no
  → 更新 orders.status=2, paid_at, paid_amount
  → 生成订单凭证
  → 触发后续业务（开通课程/确认报名）
```

#### 5.2.2 公对公转账流程

```
用户选择公对公转账
  → 创建 payments 记录（status=0 待支付）
  → 前端展示平台对公账户信息（银行、账号、户名）
  → 用户线下完成银行转账
  → 后台客服在管理端查看待确认收款订单
  → 客服确认到账
  → 更新 payments.status=1, confirmed_by=客服ID
  → 更新 orders.status=2, paid_at, paid_amount
  → 生成订单凭证
```

#### 5.2.3 余额支付流程

```
用户选择余额支付
  → 检查用户充值余额 ≥ 实付金额
  → 查询用户当前折扣等级，计算折后金额
  → 创建 payments 记录（method=BALANCE）
  → 调用账户模块扣减余额
  → 更新 payments.status=1
  → 更新 orders.status=2, paid_at, paid_amount, discount_type=RECHARGE
  → 生成订单凭证
```

#### 5.2.4 组合支付

- 余额不足以覆盖全部金额时，可选择余额 + 在线支付组合
- 余额部分享受充值折扣，在线支付部分按原价
- 生成两条 `payments` 记录，分别对应余额和在线支付
- 所有支付均完成后，订单才更新为「已支付」

### 5.3 退款流程

```
用户申请退款
  → 校验退款条件（订单状态、学习进度、开课时间等）
  → 创建 refunds 记录（status=0 待审核）
  → 更新 orders.status=5 退款中
  → 后台客服审核
      ├── 同意退款
      │     → 更新 refunds.status=1
      │     → 根据支付方式执行退款
      │         ├── 在线支付 → 调用第三方退款 API → 原路退回
      │         ├── 公对公转账 → 财务线下退款 → 手动标记完成
      │         └── 余额支付 → 退回用户余额
      │     → 更新 refunds.status=2, refunded_at
      │     → 更新 orders.status=6
      │     → 通知用户退款成功
      └── 拒绝退款
            → 更新 refunds.status=3, reject_reason
            → 更新 orders.status=2（回退）
            → 通知用户退款被驳回及原因
```

### 5.4 发票流程

```
用户提交发票申请
  → 校验订单状态为已完成(3)
  → 创建 invoices 记录（status=0 待审核）
  → 平台财务审核
      ├── 审核通过
      │     → 开具电子发票
      │     → 上传发票文件，记录 invoice_file_url
      │     → 发送电子发票至指定邮箱
      │     → 更新 invoices.status=1, issued_at
      │     → 通知用户发票已开具
      └── 审核驳回
            → 更新 invoices.status=2, reject_reason
            → 通知用户，可修改信息后重新提交
```

### 5.5 提现流程

```
讲师/机构申请提现
  → 校验可用余额 ≥ 提现金额
  → 校验提现规则（最低 100 元，每月 ≤ 4 次）
  → 创建 withdrawals 记录（status=0 待审核）
  → 平台审核
      ├── 审核通过
      │     → 更新 status=1
      │     → 财务打款至指定银行账户
      │     → 更新 status=2, settled_at
      │     → 通知用户提现到账
      └── 审核驳回
            → 更新 status=3, reject_reason
            → 解冻提现金额回到可用余额
            → 通知用户
```

### 5.6 超时自动取消规则

| 规则 | 说明 |
|------|------|
| 超时时限 | 订单创建后 30 分钟（`expire_at = created_at + 30min`） |
| 扫描频率 | 定时任务每分钟扫描 `status=1 AND expire_at < NOW()` 的订单 |
| 取消处理 | 更新 `status=4`，记录 `cancelled_at`，`cancel_reason='超时未支付自动取消'` |
| 名额释放 | 公开课订单取消时释放锁定的名额 |
| 余额解冻 | 若下单时预冻结了余额，取消时解冻 |

### 5.7 折扣规则

#### 充值折扣

- 折扣等级与用户的充值累计金额挂钩，由后台管理员在运营模块配置
- 下单时根据用户当前折扣等级计算折后价格
- 折扣仅适用于余额支付部分
- 折扣规则快照记录在 `orders.discount_rule_snapshot`，已生成订单不受后续规则变更影响

#### 团购折扣

- 仅适用于企业用户购买线下公开课
- 同一订单报名人数 ≥2 人时触发
- 折扣按人数阶梯计算，由后台管理员配置
- 与充值折扣不可叠加，取较优折扣

### 5.8 数据安全与隔离

| 规则 | 说明 |
|------|------|
| 用户数据隔离 | 前台接口查询订单强制绑定当前登录用户 `user_id`，不可跨用户查看 |
| 金额校验 | 下单时后端二次计算价格，不信任前端传入的金额 |
| 幂等处理 | 支付回调接口做幂等处理，同一 `channel_trade_no` 不重复更新 |
| 订单快照 | 课程信息（名称、价格、讲师等）在下单时快照到 `order_items`，后续课程修改不影响已有订单 |
| 支付凭证安全 | 支付渠道返回的原始数据存储在 `payments.channel_response`，脱敏后展示 |

---

## 6. 与其他模块的依赖关系

| 依赖模块 | 依赖方向 | 说明 |
|----------|---------|------|
| **用户模块 (users)** | 订单模块 → 用户模块 | `orders.user_id → users.id`，下单时校验用户状态（冻结账号不允许下单） |
| **课程模块 (courses)** | 订单模块 → 课程模块 | `order_items.course_id` 关联课程表，下单时获取课程信息快照；支付成功后开通课程权限 |
| **讲师模块 (trainers)** | 订单模块 → 讲师模块 | `order_items.trainer_id` 关联讲师表，用于收益归属统计 |
| **机构模块 (organizations)** | 订单模块 → 机构模块 | `order_items.org_id` 关联机构表，用于收益归属统计；机构发布的公开课的订单关联 |
| **账户财务模块 (accounts)** | 订单模块 ↔ 账户模块 | 余额支付时调用账户模块扣减余额；退款退至余额时调用账户模块增加余额；提现时查询可用余额 |
| **消息通知模块 (notifications)** | 订单模块 → 消息模块 | 支付成功、退款结果、发票开具、提现到账等事件触发消息通知（短信 + 站内消息） |
| **后台运营模块 (admin)** | 订单模块 ← 运营模块 | 充值折扣规则、团购折扣规则由后台运营模块配置，订单模块读取并应用 |
| **评价模块 (reviews)** | 订单模块 → 评价模块 | 订单完成后用户可发起评价，评价模块通过 `order_id` 关联 |
| **公开课模块 (open_courses)** | 订单模块 → 公开课模块 | 下单时校验公开课状态与名额；支付成功后更新报名人数 |

---

