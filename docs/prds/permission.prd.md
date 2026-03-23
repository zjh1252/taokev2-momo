# 权限管理与系统设置模块 需求文档

> 模块编码：`permission`  
> 版本：v1.0  
> 最后更新：2026-03-23

---

## 1. 模块概述

**权限管理与系统设置模块**是淘课网平台的基础设施层，承担角色权限控制（RBAC）、系统参数配置、第三方接口管理、操作审计、系统备份与恢复等职责。所有后台业务模块的访问控制与运行参数均依赖本模块，是整个系统的"地基"。

### 1.1 核心职责

| 职责 | 说明 |
|------|------|
| RBAC 权限体系 | 基于"角色-权限"模型，按"功能模块 + 操作类型"进行细粒度授权，支持前台客服/后台客服差异化配置 |
| 系统配置管理 | 平台基础参数（提现规则、审核时效、短信提醒、草稿保留等）的集中化维护 |
| 第三方接口配置 | 统一管理支付、短信、视频存储、外部业务系统同步等第三方服务接入与健康监控 |
| 系统操作审计 | 记录后台所有管理操作，关键操作要求二次确认，完整审计链 |
| 系统备份与恢复 | 全量/增量备份策略、备份至安全服务器、一键恢复能力 |
| 自动清理规则 | 过期数据定义、清理周期、备份策略的统一配置 |
| 后台用户管理 | 管理员查看/冻结/导出用户、批量标签编辑、标签关联折扣与版权课权限 |
| 业务模块专项配置 | 版权课审核定价规则、增值工具计费标准、热搜词管理等可扩展业务配置 |

### 1.2 模块边界

- **本模块包含**：角色定义与管理、权限节点定义与分配、系统全局配置、第三方接口配置、系统操作日志、系统备份/恢复、自动清理规则配置、后台用户综合管理、用户标签管理、热搜词配置、版权课配置、增值工具配置
- **本模块不包含**：用户注册/登录/认证（→ 用户模块）、讲师/机构/经纪人详情管理（→ 各自模块）、订单/支付业务（→ 订单模块）、课程内容管理（→ 课程模块）、消息发送执行（→ 消息模块）

---

## 2. 功能描述

### 2.1 RBAC 权限管理

#### 2.1.1 角色管理

| 项目 | 说明 |
|------|------|
| 角色定义 | 每个角色对应一组权限集合，角色编码唯一 |
| 系统角色 | `SUPER_ADMIN`（超级管理员）、`BACKEND_CS`（后台客服）、`FRONTEND_CS`（前台客服）为系统内置角色，不可删除 |
| 自定义角色 | 超级管理员可创建自定义角色（如"审核专员""运营主管"），灵活应对业务扩展 |
| 角色启用/停用 | 支持暂停角色生效，停用后该角色下所有用户对应权限即时失效 |
| 删除限制 | 系统角色不可删除；自定义角色在有关联用户时不可删除，需先解除所有用户分配 |

#### 2.1.2 权限节点管理

| 项目 | 说明 |
|------|------|
| 权限粒度 | 按"功能模块 + 操作类型"组合定义，形成权限树 |
| 操作类型枚举 | `VIEW`（查看）、`CREATE`（创建）、`EDIT`（编辑）、`DELETE`（删除）、`REVIEW`（审核）、`EXPORT`（导出）、`IMPORT`（导入） |
| 权限树结构 | 支持多级层次（模块 → 子模块 → 操作），通过 `parent_id` 构建树形关系 |
| 新增权限节点 | 版权课管理、增值工具管理、热搜词管理作为新增权限节点纳入权限树 |
| 权限分配 | 超级管理员可将权限节点逐一或按模块批量分配给角色 |
| 无权限处理 | 用户无权限的功能模块在导航菜单中隐藏，直接访问 API 返回 403 |

**预置权限节点示例：**

| 模块 | 权限编码 | 权限名称 | 操作类型 |
|------|---------|---------|---------|
| 用户管理 | `user:view` | 查看用户列表 | VIEW |
| 用户管理 | `user:freeze` | 冻结/解冻用户 | EDIT |
| 用户管理 | `user:export` | 导出用户数据 | EXPORT |
| 用户管理 | `user:import` | 批量导入用户 | IMPORT |
| 用户管理 | `user:tag:edit` | 编辑用户标签 | EDIT |
| 课程管理 | `course:view` | 查看课程列表 | VIEW |
| 课程管理 | `course:review` | 审核课程 | REVIEW |
| 课程管理 | `course:edit` | 编辑课程 | EDIT |
| 讲师管理 | `trainer:view` | 查看讲师列表 | VIEW |
| 讲师管理 | `trainer:review` | 审核讲师入驻 | REVIEW |
| 机构管理 | `organization:view` | 查看机构列表 | VIEW |
| 机构管理 | `organization:review` | 审核机构入驻 | REVIEW |
| 经纪人管理 | `agent:view` | 查看经纪人列表 | VIEW |
| 经纪人管理 | `agent:review` | 审核经纪人入驻 | REVIEW |
| 订单管理 | `order:view` | 查看订单列表 | VIEW |
| 订单管理 | `order:refund` | 处理退款 | EDIT |
| 评价管理 | `review:view` | 查看评价列表 | VIEW |
| 评价管理 | `review:review` | 审核评价 | REVIEW |
| 需求管理 | `demand:view` | 查看需求列表 | VIEW |
| 需求管理 | `demand:edit` | 编辑需求 | EDIT |
| 内容管理 | `cms:view` | 查看内容列表 | VIEW |
| 内容管理 | `cms:edit` | 编辑内容 | EDIT |
| 版权课管理 | `copyright_course:view` | 查看版权课列表 | VIEW |
| 版权课管理 | `copyright_course:review` | 审核版权课 | REVIEW |
| 版权课管理 | `copyright_course:edit` | 编辑版权课配置 | EDIT |
| 增值工具管理 | `value_added_tool:view` | 查看增值工具列表 | VIEW |
| 增值工具管理 | `value_added_tool:edit` | 编辑增值工具配置 | EDIT |
| 热搜词管理 | `hot_search:view` | 查看热搜词列表 | VIEW |
| 热搜词管理 | `hot_search:edit` | 编辑热搜词 | EDIT |
| 热搜词管理 | `hot_search:delete` | 删除热搜词 | DELETE |
| 系统设置 | `system:config` | 系统配置管理 | EDIT |
| 系统设置 | `system:backup` | 系统备份管理 | EDIT |
| 系统设置 | `system:log:view` | 查看系统日志 | VIEW |
| 权限管理 | `permission:role:manage` | 角色管理 | EDIT |
| 权限管理 | `permission:assign` | 权限分配 | EDIT |
| 消息管理 | `message:view` | 查看消息列表 | VIEW |
| 消息管理 | `message:send` | 发送消息 | CREATE |

#### 2.1.3 用户-角色分配

| 项目 | 说明 |
|------|------|
| 分配权限 | 仅超级管理员可为用户分配后台角色 |
| 多角色支持 | 一个后台用户可拥有多个角色，权限取并集 |
| 即时生效 | 角色变更后，用户下次请求即刻校验新权限 |
| 分配记录 | 记录分配人与分配时间，支持审计追溯 |

#### 2.1.4 后台客服账号管理

| 项目 | 说明 |
|------|------|
| 创建账号 | 超级管理员可创建前台客服/后台客服账号，设置初始密码 |
| 删除账号 | 超级管理员可删除客服账号（软删除，保留操作日志） |
| 修改权限 | 超级管理员可随时修改客服账号的角色/权限配置 |
| 前台客服权限 | 面向用户的咨询接待、工单处理等一线操作权限 |
| 后台客服权限 | 面向运营的审核、数据管理、系统配置等后台操作权限 |

#### 2.1.5 关键操作二次确认

| 项目 | 说明 |
|------|------|
| 适用范围 | 后台客服执行的关键操作（删除数据、冻结账号、退款审批、修改系统配置等） |
| 确认方式 | 弹出二次确认弹窗，展示操作内容预览（操作对象、操作类型、影响范围） |
| 确认记录 | 确认动作记录到系统操作日志的 `confirmed_at` 字段 |
| 超级管理员可配置 | 哪些操作需要二次确认，可在系统配置中灵活指定 |

---

### 2.2 系统配置管理

#### 2.2.1 平台基础参数

| 配置组 | 配置项 | 说明 |
|--------|--------|------|
| 提现规则 | `withdrawal.min_amount` | 最低提现金额 |
| 提现规则 | `withdrawal.fee_rate` | 提现手续费比例 |
| 提现规则 | `withdrawal.review_required` | 提现是否需审核 |
| 提现规则 | `withdrawal.cycle_days` | 提现结算周期（天） |
| 审核时效 | `review.trainer_max_hours` | 讲师入驻审核时效（小时） |
| 审核时效 | `review.course_max_hours` | 课程审核时效（小时） |
| 审核时效 | `review.organization_max_hours` | 机构入驻审核时效（小时） |
| 短信提醒 | `sms.reminder_enabled` | 是否启用短信提醒 |
| 短信提醒 | `sms.daily_limit_per_user` | 每用户每日短信上限 |
| 短信提醒 | `sms.template_config` | 各场景短信模板配置（JSON） |
| 草稿保留 | `draft.retention_hours` | 草稿保留时长（小时），默认 48 |
| 订单规则 | `order.payment_timeout_minutes` | 订单支付超时时间（分钟） |
| 订单规则 | `order.auto_cancel_enabled` | 超时自动取消开关 |

#### 2.2.2 自动清理规则

| 项目 | 说明 |
|------|------|
| 过期数据定义 | 可配置各类型数据的过期阈值（如：草稿 48 小时、验证码 5 分钟、过期会话 7/30 天、操作日志 365 天） |
| 清理周期 | 可配置定时任务执行间隔（如每小时/每天/每周） |
| 备份规则 | 清理前可配置是否先备份到归档表或文件 |
| 执行日志 | 每次清理任务执行结果记录到系统操作日志 |
| 与后台客服清理功能一致 | 后台客服手动触发的清理使用相同的配置规则 |

#### 2.2.3 在线课视频上传规则

| 项目 | 说明 |
|------|------|
| 文件大小限制 | 可配置单个视频最大上传体积（如 2GB） |
| 超限提示 | 超过限制时前端提示"文件过大，请压缩后再上传"，并给出推荐压缩工具链接 |
| 格式限制 | 可配置允许的视频格式（如 mp4、avi、mov） |
| 分辨率建议 | 可配置推荐分辨率与码率参数供上传者参考 |

---

### 2.3 第三方接口配置

| 服务类型 | 说明 |
|---------|------|
| `PAYMENT` | 支付接口（微信支付、支付宝、公对公银行转账），存储商户号、密钥等配置 |
| `SMS` | 短信接口（阿里云短信、腾讯云短信等），存储 AccessKey、模板 ID 等配置 |
| `VIDEO_STORAGE` | 视频存储接口（阿里云 VOD、腾讯云点播等），存储 Bucket、域名等配置 |
| `EXTERNAL_SYNC` | 外部业务系统同步接口（培训需求同步等），存储 API 地址、认证信息 |

**通用功能：**

| 功能 | 说明 |
|------|------|
| 加密存储 | 配置数据 (`config_data`) 使用 AES 加密存储，解密仅在运行时 |
| 启用/停用 | 每个第三方配置支持独立启用/停用切换 |
| 健康检查 | 定时探测接口可用性，记录健康状态与最后检查时间 |
| 异常自动重试 | 培训需求同步至外部系统时，接口异常自动重试（可配置重试次数与间隔） |
| 配置变更审计 | 修改第三方配置需超级管理员权限，变更记录到系统操作日志 |

---

### 2.4 系统操作日志

| 项目 | 说明 |
|------|------|
| 记录范围 | 后台所有管理操作（用户管理、课程审核、订单处理、配置变更、权限分配等） |
| 记录内容 | 操作人、操作模块、操作类型、操作对象（类型+ID）、操作详情、IP 地址、二次确认时间 |
| 查询功能 | 支持按操作人、模块、操作类型、时间范围、关键词组合筛选 |
| 不可篡改 | 操作日志仅追加写入，不提供修改/删除接口 |
| 保留策略 | 可配置保留周期（默认 1 年），过期日志归档后清理 |

---

### 2.5 系统备份与恢复

| 项目 | 说明 |
|------|------|
| 备份类型 | 全量备份（`FULL`）和增量备份（`INCREMENTAL`） |
| 备份策略 | 全量备份每周一次，增量备份每日一次，可在系统配置中调整 |
| 备份存储 | 备份文件传输至安全服务器（独立于业务服务器），路径与目标在第三方配置中维护 |
| 备份状态 | 记录备份任务状态（运行中/成功/失败）、文件大小、耗时 |
| 手动触发 | 超级管理员可手动触发一次全量/增量备份 |
| 一键恢复 | 超级管理员可从备份记录选择恢复点，执行数据恢复（需二次确认） |
| 备份清理 | 可配置备份文件保留份数/天数，超出后自动清理最旧的备份 |

---

### 2.6 后台用户管理

#### 2.6.1 用户列表与查询

| 项目 | 说明 |
|------|------|
| 查看范围 | 所有注册用户的基础信息、账号状态、操作记录 |
| 筛选条件 | 用户类型（角色）、注册时间范围、账号状态、用户标签、关键词（手机号/昵称/企业名） |
| 排序 | 默认按注册时间倒序，支持按最后登录时间排序 |
| 分页 | 遵循三段式分页查询规范（分页查 ID → 回表主表 → 批量查集合并组装） |

#### 2.6.2 账号冻结/解冻

| 项目 | 说明 |
|------|------|
| 冻结 | 填写冻结原因 → 二次确认弹窗 → 账号状态变更为冻结，所有活跃会话强制下线 |
| 解冻 | 超级管理员/后台客服手动解冻 → 账号恢复正常 |
| 通知 | 冻结/解冻均通过短信 + 站内消息通知用户 |

#### 2.6.3 批量导出用户

| 项目 | 说明 |
|------|------|
| 导出格式 | CSV / Excel |
| 字段选择 | 管理员可勾选需要导出的核心字段（手机号、昵称、角色、企业名、注册时间、状态、标签等） |
| 数据量限制 | 单次导出上限 5 万条，超出提示分批导出 |
| 异步导出 | 大数据量导出时异步生成文件，完成后站内通知管理员下载 |

#### 2.6.4 批量导入用户

| 项目 | 说明 |
|------|------|
| 导入格式 | CSV / Excel 模板 |
| 字段映射 | 同步自定义核心字段，管理员可下载标准模板 |
| 错误处理 | 遇到格式错误/重复数据跳过该行继续导入，全部完成后生成 CSV 错误报告（含行号与错误原因） |
| 导入确认 | 导入前预览数据摘要（总行数、预计成功/跳过行数），确认后执行 |

#### 2.6.5 同一企业多账号

| 项目 | 说明 |
|------|------|
| 规则 | 同一企业可注册多个独立账号，各账号数据独立，不设子账号/主从关系 |
| 管理方式 | 通过企业名称字段关联查看同一企业下的所有账号 |

---

### 2.7 用户标签管理

| 项目 | 说明 |
|------|------|
| 标签类型 | `企业采购`、`个人采购` 等用户类型标签 |
| 标签来源 | 注册时系统自动打标、用户自行修改、管理员批量编辑 |
| 用户自修改 | 用户可在个人设置中自行修改自身标签 |
| 管理员批量编辑 | 管理员可选中多个用户统一设置/替换标签 |
| 标签关联折扣 | 不同标签对应不同充值折扣等级，折扣比例在系统配置中维护 |
| 标签关联版权课 | 部分版权课仅对特定标签用户开放访问/购买权限 |
| 标签变更影响 | 标签变更后折扣与权限实时生效，已生成的订单不受影响 |

---

### 2.8 业务模块专项配置

#### 2.8.1 版权课配置

| 配置项 | 说明 |
|--------|------|
| 审核标准 | 版权课提交后的审核检查项与评判标准 |
| 统一定价规则 | 平台对版权课的定价规则（固定价/阶梯价/按时长计价等） |
| 企业折扣规则 | 企业用户购买版权课的折扣规则（按标签/采购量/合作等级区分） |
| 访问权限控制 | 哪些用户标签可访问/购买特定版权课 |

#### 2.8.2 增值工具配置

| 配置项 | 说明 |
|--------|------|
| 免费/付费边界 | 各增值工具的免费使用额度与付费起点 |
| 定价标准 | 付费增值工具的价格/套餐设置 |
| 讲师合作等级 | 讲师合作等级与增值工具使用权限的映射关系 |
| 工具启用/停用 | 各增值工具独立开关控制 |

#### 2.8.3 热搜词配置

| 配置项 | 说明 |
|--------|------|
| 自动抓取周期 | 系统自动从搜索日志中提取热门关键词的采集周期（如每日/每周） |
| 手动管理权限 | 拥有 `hot_search:edit` 权限的管理员可手动添加/删除热搜词 |
| 热词置顶规则 | 支持将指定关键词固定在热搜列表顶部，设置置顶排序权重 |
| 屏蔽词管理 | 可配置屏蔽词列表，自动过滤不适合展示的热搜词 |

---

## 3. 实体属性（字段设计）

### 3.1 角色表 `roles`

> 定义系统中的所有角色，包括系统内置角色和管理员自定义角色。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `role_code` | varchar(64) | NO | — | 角色编码，唯一，如 `SUPER_ADMIN`、`BACKEND_CS` |
| `role_name` | varchar(64) | NO | — | 角色名称，如"超级管理员""后台客服" |
| `description` | varchar(255) | YES | NULL | 角色描述 |
| `is_system` | tinyint | NO | 0 | 是否系统内置角色：1=是（不可删除），0=否 |
| `is_active` | tinyint | NO | 1 | 是否启用：1=启用，0=停用 |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | datetime | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引：**
- `UNIQUE idx_role_code (role_code)` — 角色编码唯一
- `idx_is_active (is_active)` — 按启用状态查询

**预置数据：**

| role_code | role_name | is_system |
|-----------|-----------|-----------|
| `SUPER_ADMIN` | 超级管理员 | 1 |
| `BACKEND_CS` | 后台客服 | 1 |
| `FRONTEND_CS` | 前台客服 | 1 |

---

### 3.2 权限表 `permissions`

> 定义系统中所有的权限节点，按"功能模块 + 操作类型"细粒度划分，支持树形层级。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `permission_code` | varchar(128) | NO | — | 权限编码，唯一，如 `course:review` |
| `permission_name` | varchar(64) | NO | — | 权限名称，如"审核课程" |
| `module` | varchar(64) | NO | — | 所属功能模块，如 `user`、`course`、`trainer` |
| `action_type` | varchar(20) | NO | — | 操作类型：`VIEW`/`CREATE`/`EDIT`/`DELETE`/`REVIEW`/`EXPORT`/`IMPORT` |
| `parent_id` | int | YES | NULL | 父权限 ID，用于构建权限树，顶级节点为 NULL |
| `sort_order` | int | NO | 0 | 排序权重，同级中越小越靠前 |
| `description` | varchar(255) | YES | NULL | 权限描述 |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | datetime | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引：**
- `UNIQUE idx_permission_code (permission_code)` — 权限编码唯一
- `idx_module (module)` — 按模块查询权限列表
- `idx_parent_id (parent_id)` — 构建权限树子节点查询
- `idx_action_type (action_type)` — 按操作类型筛选

---

### 3.3 角色-权限关联表 `role_permissions`

> 角色与权限的多对多关联表。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `role_id` | int | NO | — | 角色 ID，关联 `roles.id` |
| `permission_id` | int | NO | — | 权限 ID，关联 `permissions.id` |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 创建时间 |

**索引：**
- `UNIQUE idx_role_permission (role_id, permission_id)` — 同一角色同一权限不重复
- `idx_permission_id (permission_id)` — 反查某权限被哪些角色持有

---

### 3.4 用户-角色分配表 `user_role_assignments`

> 记录后台管理用户与角色的分配关系，一个用户可分配多个角色。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `user_id` | int | NO | — | 用户 ID，关联 `users.id` |
| `role_id` | int | NO | — | 角色 ID，关联 `roles.id` |
| `assigned_by` | int | NO | — | 分配人用户 ID，关联 `users.id` |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 分配时间 |
| `updated_at` | datetime | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引：**
- `UNIQUE idx_user_role (user_id, role_id)` — 同一用户同一角色不重复分配
- `idx_role_id (role_id)` — 按角色查询所有分配用户
- `idx_assigned_by (assigned_by)` — 按分配人查询

---

### 3.5 系统配置表 `system_configs`

> 平台全局配置项的集中存储，以分组 + 键值对形式管理。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `config_group` | varchar(64) | NO | — | 配置分组，如 `withdrawal`、`review`、`sms`、`draft`、`cleanup` |
| `config_key` | varchar(128) | NO | — | 配置键，如 `min_amount`、`fee_rate` |
| `config_value` | text | NO | — | 配置值 |
| `value_type` | varchar(20) | NO | 'STRING' | 值类型：`STRING`/`NUMBER`/`BOOLEAN`/`JSON` |
| `description` | varchar(255) | YES | NULL | 配置项说明 |
| `is_editable` | tinyint | NO | 1 | 是否允许后台编辑：1=可编辑，0=仅代码层可修改 |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | datetime | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引：**
- `UNIQUE idx_group_key (config_group, config_key)` — 分组内键唯一
- `idx_config_group (config_group)` — 按分组查询配置项

---

### 3.6 系统操作日志表 `system_operation_logs`

> 记录后台所有管理操作，提供完整审计链。仅追加写入，不可修改/删除。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `operator_id` | int | NO | — | 操作人用户 ID，关联 `users.id` |
| `operator_name` | varchar(64) | NO | — | 操作人名称（冗余，避免关联查询） |
| `module` | varchar(64) | NO | — | 操作所属模块，如 `user`、`course`、`permission`、`system` |
| `action` | varchar(64) | NO | — | 操作类型，如 `CREATE`、`EDIT`、`DELETE`、`FREEZE`、`REVIEW`、`CONFIG_CHANGE` |
| `target_type` | varchar(64) | YES | NULL | 操作对象类型，如 `USER`、`COURSE`、`ROLE`、`CONFIG` |
| `target_id` | int | YES | NULL | 操作对象 ID |
| `content` | text | YES | NULL | 操作详情描述（JSON 格式，记录变更前后的关键字段值） |
| `ip_address` | varchar(45) | YES | NULL | 操作时 IP 地址 |
| `requires_confirmation` | tinyint | NO | 0 | 是否为需二次确认的关键操作：1=是，0=否 |
| `confirmed_at` | datetime | YES | NULL | 二次确认时间（仅关键操作有值） |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 操作时间 |

**索引：**
- `idx_operator_id (operator_id)` — 按操作人查询
- `idx_module (module)` — 按模块筛选
- `idx_action (action)` — 按操作类型筛选
- `idx_target (target_type, target_id)` — 按操作对象查询
- `idx_created_at (created_at)` — 按时间范围查询

**日志保留策略：** 操作日志默认保留 1 年，过期数据由自动清理任务归档后删除。超级管理员操作日志永不清理。

---

### 3.7 系统备份记录表 `system_backups`

> 记录系统备份任务的执行状态与结果。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `backup_type` | varchar(20) | NO | — | 备份类型：`FULL`（全量）、`INCREMENTAL`（增量） |
| `backup_path` | varchar(512) | YES | NULL | 备份文件路径（安全服务器上的存储位置） |
| `file_size` | bigint | YES | NULL | 备份文件大小（字节） |
| `status` | varchar(20) | NO | 'RUNNING' | 备份状态：`RUNNING`（进行中）、`SUCCESS`（成功）、`FAILED`（失败） |
| `error_message` | varchar(512) | YES | NULL | 失败时的错误信息 |
| `triggered_by` | int | YES | NULL | 触发人用户 ID（定时任务触发时为 NULL） |
| `started_at` | datetime | NO | — | 备份开始时间 |
| `completed_at` | datetime | YES | NULL | 备份完成时间 |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 记录创建时间 |

**索引：**
- `idx_backup_type (backup_type)` — 按备份类型查询
- `idx_status (status)` — 按状态查询
- `idx_started_at (started_at)` — 按时间排序

---

### 3.8 第三方接口配置表 `third_party_configs`

> 统一管理支付、短信、视频存储、外部同步等第三方服务的接入配置。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `service_type` | varchar(32) | NO | — | 服务类型：`PAYMENT`/`SMS`/`VIDEO_STORAGE`/`EXTERNAL_SYNC` |
| `service_name` | varchar(64) | NO | — | 服务名称，如"微信支付""阿里云短信""阿里云 VOD" |
| `config_data` | text | NO | — | AES 加密后的配置 JSON（含商户号、密钥、API 地址等） |
| `is_active` | tinyint | NO | 1 | 是否启用：1=启用，0=停用 |
| `retry_count` | int | NO | 3 | 接口异常时自动重试次数 |
| `retry_interval_seconds` | int | NO | 30 | 重试间隔（秒） |
| `last_health_check` | datetime | YES | NULL | 最后一次健康检查时间 |
| `health_status` | varchar(20) | YES | NULL | 健康状态：`HEALTHY`/`UNHEALTHY`/`UNKNOWN` |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | datetime | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引：**
- `idx_service_type (service_type)` — 按服务类型查询
- `idx_is_active (is_active)` — 按启用状态查询
- `UNIQUE idx_service_type_name (service_type, service_name)` — 同类型下服务名唯一

---

### 3.9 二次确认操作配置表 `confirmation_action_configs`

> 定义哪些操作需要后台客服执行时进行二次确认，可灵活配置。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `action_code` | varchar(128) | NO | — | 操作编码，如 `user:freeze`、`order:refund`、`system:config` |
| `action_name` | varchar(64) | NO | — | 操作名称，如"冻结用户""退款审批""修改系统配置" |
| `module` | varchar(64) | NO | — | 所属模块 |
| `requires_confirmation` | tinyint | NO | 1 | 是否需要二次确认：1=需要，0=不需要 |
| `confirmation_message_template` | varchar(512) | YES | NULL | 确认弹窗提示文案模板，支持占位符 |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | datetime | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引：**
- `UNIQUE idx_action_code (action_code)` — 操作编码唯一
- `idx_module (module)` — 按模块查询

---



### 4.2 关系说明

| 关系 | 类型 | 说明 |
|------|------|------|
| `roles` → `role_permissions` | 一对多 | 一个角色拥有多条权限分配记录 |
| `permissions` → `role_permissions` | 一对多 | 一个权限节点可被分配给多个角色 |
| `roles` → `user_role_assignments` | 一对多 | 一个角色可分配给多个用户 |
| `users` → `user_role_assignments` | 一对多 | 一个用户可拥有多个角色（权限取并集） |
| `users` → `system_operation_logs` | 一对多 | 一个操作人可产生多条操作日志 |
| `system_configs` | 独立 | 全局键值对配置，不与其他表关联 |
| `system_backups` | 独立 | 备份记录表，`triggered_by` 关联 `users.id`（可为空表示定时任务触发） |
| `third_party_configs` | 独立 | 第三方接口配置，独立管理 |
| `confirmation_action_configs` | 独立 | 二次确认操作配置，与权限节点通过 `action_code` 语义关联 |

> **注意：** 数据库层面不建外键，所有关联关系在代码逻辑中维护。

---

## 5. 业务逻辑与规则

### 5.1 权限校验流程

```
用户发起后台请求
    │
    ▼
从 JWT Token 解析 user_id
    │
    ▼
查询 user_role_assignments 获取用户所有角色
    │
    ▼
查询 role_permissions + permissions 获取所有权限编码（取并集）
    │
    ▼
校验请求所需的 permission_code 是否在权限集合中
    │
    ├── 命中 → 放行请求
    │
    └── 未命中 → 返回 403 Forbidden
```

**缓存策略：** 用户权限集合缓存于 Redis（key: `user:permissions:{userId}`，TTL: 10 分钟）。角色或权限变更时主动清除相关用户的缓存。

### 5.2 超级管理员特殊规则

| 规则 | 说明 |
|------|------|
| 全权限 | 超级管理员绕过权限校验，拥有系统所有功能的访问权 |
| 不可删除 | `SUPER_ADMIN` 角色为系统角色，不可删除/停用 |
| 至少保留一个 | 系统必须至少存在一个超级管理员账号，删除最后一个时拒绝操作 |
| 分配新模块权限 | 新业务模块上线时，超级管理员可直接为后台客服分配对应的新权限节点 |

### 5.3 关键操作二次确认流程

```
后台客服点击关键操作按钮
    │
    ▼
前端查询 confirmation_action_configs 判断是否需要确认
    │
    ├── 不需要 → 直接执行
    │
    └── 需要 → 弹出确认弹窗
                  │
                  ▼
              展示操作内容预览（操作对象、类型、影响范围）
                  │
                  ▼
              客服确认 → 后端执行操作
                  │
                  ▼
              记录 system_operation_logs（含 confirmed_at）
```

### 5.4 系统配置变更规则

| 规则 | 说明 |
|------|------|
| 权限要求 | 修改系统配置需 `system:config` 权限 |
| 变更记录 | 每次配置变更记录到 `system_operation_logs`，`content` 字段包含变更前后的值 |
| 值类型校验 | 写入时根据 `value_type` 校验格式（如 `NUMBER` 类型必须为合法数字、`BOOLEAN` 类型只接受 `true`/`false`、`JSON` 类型必须为合法 JSON） |
| 只读配置 | `is_editable = 0` 的配置项不允许通过后台界面修改 |
| 生效方式 | 配置变更后立即写入 Redis 缓存，各服务从缓存读取最新值 |

### 5.5 第三方接口健康检查规则

| 规则 | 说明 |
|------|------|
| 检查周期 | 每 5 分钟探测一次所有启用状态的第三方接口 |
| 检查方式 | 对接口的 health/ping 端点发起 HTTP 请求，超时 10 秒视为不健康 |
| 状态变更 | 连续 3 次不健康标记为 `UNHEALTHY`，恢复后标记为 `HEALTHY` |
| 告警通知 | 接口变为 `UNHEALTHY` 时，向超级管理员发送站内消息告警 |
| 自动重试 | 培训需求同步至外部系统时，接口异常按配置的 `retry_count` 和 `retry_interval_seconds` 自动重试 |

### 5.6 系统备份规则

| 规则 | 说明 |
|------|------|
| 全量备份 | 默认每周日凌晨 2:00 执行，可在系统配置中调整 |
| 增量备份 | 默认每日凌晨 3:00 执行，可在系统配置中调整 |
| 备份存储 | 备份文件压缩后传输至安全服务器，传输使用 SFTP/SCP 加密通道 |
| 保留策略 | 全量备份保留最近 4 份，增量备份保留最近 30 份，超出自动清理 |
| 并发控制 | 同一时间仅允许一个备份任务运行，新触发时若有正在运行的备份则排队等待 |
| 恢复流程 | 恢复操作需超级管理员权限 + 二次确认，恢复前自动执行一次当前状态的全量备份 |

### 5.7 自动清理规则

| 数据类型 | 过期定义 | 默认清理周期 | 清理前备份 |
|---------|---------|------------|-----------|
| 草稿数据 | 超过 48 小时 | 每小时 | 否 |
| 验证码 | 超过 5 分钟 | 每小时 | 否 |
| 过期登录会话 | PC 端 7 天 / 移动端 30 天 | 每日 | 否 |
| 操作日志 | 超过 365 天 | 每周 | 是（归档到备份表） |
| 系统备份文件 | 超过保留份数 | 每周 | 否（备份自身不备份） |

### 5.8 批量导出/导入规则

| 规则 | 说明 |
|------|------|
| 导出权限 | 需 `user:export` 权限 |
| 导入权限 | 需 `user:import` 权限 |
| 导出限制 | 单次上限 5 万条，超出提示分批操作 |
| 异步导出 | 超过 1000 条时自动切换为异步导出，完成后站内消息通知下载链接 |
| 导入错误处理 | 跳过错误行继续处理，最终输出 CSV 错误报告，含行号、字段名、错误原因 |
| 导入去重 | 手机号/邮箱重复的行视为错误跳过 |
| 敏感字段脱敏 | 导出时手机号/邮箱中间段脱敏（如 138****1234），超级管理员可导出完整数据 |

---

## 6. 与其他模块的依赖关系

| 依赖模块 | 依赖方向 | 说明 |
|----------|---------|------|
| **用户模块** | 权限模块 → 用户模块 | `user_role_assignments.user_id` 关联 `users.id`；后台用户管理功能依赖用户模块的基础数据 |
| **课程模块** | 权限模块 → 课程模块 | 课程审核、课程编辑等权限节点控制后台客服对课程的操作范围；版权课配置影响课程定价与访问权限 |
| **讲师模块** | 权限模块 → 讲师模块 | 讲师入驻审核、讲师信息管理等权限节点控制后台客服操作 |
| **机构模块** | 权限模块 → 机构模块 | 机构入驻审核、机构信息管理等权限节点控制后台客服操作 |
| **经纪人模块** | 权限模块 → 经纪人模块 | 经纪人入驻审核等权限节点控制后台客服操作 |
| **订单模块** | 权限模块 → 订单模块 | 退款审批、订单管理等权限节点控制后台客服操作 |
| **评价模块** | 权限模块 → 评价模块 | 评价审核权限节点控制后台客服操作 |
| **需求模块** | 权限模块 → 需求模块 | 需求管理权限节点控制后台客服操作；培训需求同步外部系统由本模块的第三方配置驱动 |
| **内容管理模块** | 权限模块 → 内容管理模块 | CMS 内容编辑权限节点控制后台客服操作；热搜词配置影响搜索展示 |
| **消息模块** | 权限模块 ← 消息模块 | 第三方接口不健康、备份失败等事件通过消息模块发送告警通知 |
| **账户财务模块** | 权限模块 → 账户模块 | 提现规则、审核规则等系统配置影响财务模块的业务逻辑 |

---
