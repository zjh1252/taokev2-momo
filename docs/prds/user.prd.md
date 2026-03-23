# 用户与账号管理 需求文档

> 模块编码：`user`  
> 版本：v1.0  
> 最后更新：2026-03-23

---

## 1. 模块概述

**用户与账号管理**是淘课网平台的基础核心模块，承担所有角色的注册、登录、认证、个人信息管理、安全控制等职责。

### 1.1 核心职责

| 职责 | 说明 |
|------|------|
| 统一身份管理 | 所有角色共用一张基础用户表 `users`，通过角色字段区分用户类型 |
| 多方式注册/登录 | 手机号+短信验证码、企业邮箱、微信/支付宝第三方登录 |
| 角色体系 | 支持 B 端企业甲方、C 端个人甲方、讲师、讲师经纪人、机构、前台客服、后台客服、超级管理员 八种角色 |
| 企业信息管理 | 企业用户独立维护企业信息、培训需求标签 |
| 账号安全 | 登录设备管理、异地登录提醒、操作日志、单设备登录限制、账号冻结/解冻 |
| 用户标签 | 用户可自选标签（如"企业采购""个人采购"），标签关联折扣与版权课访问权限 |
| 草稿暂存 | 未完成的表单/注册流程自动保存，48 小时后自动清除 |

### 1.2 模块边界

- **本模块包含**：用户基础信息、角色管理、企业信息、第三方登录绑定、登录会话/设备管理、操作日志、用户标签、草稿暂存
- **本模块不包含**：讲师档案详情（→ 讲师模块）、经纪人详情（→ 经纪人模块）、机构详情（→ 机构模块）、权限细粒度配置（→ 权限模块）、钱包/充值/余额（→ 账户财务模块）

---

## 2. 功能描述

### 2.1 注册

#### 2.1.1 B 端企业甲方注册

| 项目 | 说明 |
|------|------|
| 入口 | 官网注册页，选择"企业用户"标签 |
| 注册方式 | ① 手机号 + 短信验证码 ② 企业邮箱 + 邮箱验证码 |
| 必填字段 | 手机号/邮箱、短信/邮件验证码、登录密码 |
| 选填字段 | 企业名称、行业、企业规模、联系人姓名、联系电话 |
| 规则 | 手机号/邮箱已注册时提示"该账号已注册，请直接登录"并跳转登录页；同一企业可多人注册独立账号，不设子账号体系 |
| 表单暂存 | 注册流程中离开页面，已填信息自动保存至草稿，48 小时内返回可恢复 |
| 注册后默认角色 | `ENTERPRISE_BUYER` |

#### 2.1.2 C 端个人甲方注册

| 项目 | 说明 |
|------|------|
| 入口 | 官网注册页，选择"个人用户"标签；或通过微信/支付宝授权一键注册 |
| 注册方式 | ① 手机号 + 短信验证码 ② 微信第三方快捷登录 ③ 支付宝第三方快捷登录 |
| 必填字段 | 手机号 + 短信验证码（第三方登录时由系统自动获取或引导绑定手机号） |
| 选填字段 | 职业、学习标签（如"AI 办公""销售技能"） |
| 规则 | 同 B 端；第三方登录首次使用时自动创建账号，若手机号已注册则引导绑定已有账号 |
| 注册后默认角色 | `INDIVIDUAL_BUYER` |

#### 2.1.3 讲师 / 经纪人 / 机构注册（入驻申请）

| 项目 | 说明 |
|------|------|
| 流程 | 先完成普通用户注册（手机号+验证码）→ 进入入驻申请流程 → 提交资质材料 → 后台客服审核 → 审核通过后激活角色 |
| 草稿保留 | 入驻申请表单未提交的草稿保留 48 小时，超时自动删除 |
| 审核通知 | 审核结果通过短信 + 站内消息通知用户 |
| 说明 | 讲师/经纪人/机构的入驻申请表单字段、审核流程在各自模块 PRD 中定义，本模块仅负责基础用户创建与角色变更 |

#### 2.1.4 客服 / 管理员账号

| 项目 | 说明 |
|------|------|
| 创建方式 | 由超级管理员在后台创建，不开放自助注册 |
| 角色 | `FRONTEND_CS`（前台客服）、`BACKEND_CS`（后台客服）、`SUPER_ADMIN`（超级管理员） |
| 权限 | 后台客服支持细粒度权限分配（仅审核入驻/仅审核课程/仅处理评价等），无权限模块不可见 |

### 2.2 登录

| 登录方式 | 适用角色 | 说明 |
|----------|---------|------|
| 手机号 + 短信验证码 | 全部 | 通用登录方式 |
| 手机号/邮箱 + 密码 | 全部 | 设置密码后可用 |
| 企业邮箱 + 密码 | B 端企业甲方 | 企业用户专属 |
| 微信授权登录 | C 端个人甲方 | 扫码或 H5 授权 |
| 支付宝授权登录 | C 端个人甲方 | H5 授权 |
| 后台专属登录入口 | 客服、管理员 | 独立登录页面，仅限内部角色 |

**登录安全规则：**
- 连续 5 次密码错误，锁定 15 分钟
- 异地登录（IP 所属城市变更）触发安全提醒（短信/站内通知）
- C 端个人用户观看付费在线课程时，同一账号同一时间仅允许一台设备播放，多设备登录触发冲突提示并踢出先前设备的播放会话

### 2.3 密码找回

| 方式 | 说明 |
|------|------|
| 手机号找回 | 输入注册手机号 → 发送短信验证码 → 验证通过 → 设置新密码 |
| 邮箱找回 | 输入注册邮箱 → 发送邮件验证码/重置链接 → 验证通过 → 设置新密码 |

### 2.4 个人信息管理

#### 2.4.1 通用个人信息（全角色）

- 头像、昵称、性别
- 手机号变更（需短信验证旧手机 + 新手机）
- 邮箱绑定/变更（需邮件验证）
- 密码修改（需验证旧密码或短信验证码）

#### 2.4.2 企业信息管理（B 端企业甲方）

- 企业名称、行业、企业规模、联系人姓名、联系电话
- 培训需求标签（如"销售培训""生产管理""AI 赋能"），从平台标签库选择或自定义新增，支持多标签
- 省份/城市

#### 2.4.3 个人用户信息（C 端个人甲方）

- 真实姓名、职业
- 学习标签（如"AI 办公""销售技能"），从平台标签库选择或自定义新增，支持多标签

### 2.5 用户标签体系

| 项目 | 说明 |
|------|------|
| 标签分类 | 用户类型标签（"企业采购"/"个人采购"）、培训需求标签、学习兴趣标签 |
| 标签来源 | ① 注册时系统根据角色自动打标 ② 用户自选/自定义 ③ 管理员批量编辑 |
| 用户可修改 | 用户可自行修改自己的标签 |
| 管理员操作 | 管理员可批量编辑用户标签 |
| 标签用途 | ① 关联折扣规则（不同标签享受不同充值折扣）② 影响版权课访问权限 ③ 首页智能推荐依据 |

### 2.6 账号安全与设备管理

| 功能 | 说明 |
|------|------|
| 登录设备列表 | 用户可查看当前登录的设备列表（设备名称、登录时间、登录 IP/城市） |
| 远程下线 | 用户可踢出其他设备的登录会话 |
| 异地登录提醒 | 检测到登录 IP 所属城市变更时，向用户发送短信/站内通知 |
| 单设备播放限制 | C 端个人用户观看付费在线课时，同一时间仅一台设备可播放，新设备登录播放时踢出旧设备播放会话（不影响普通登录） |
| 操作日志 | 用户可查看自己账号的关键操作日志（登录、密码修改、信息变更等） |

### 2.7 账号冻结与解冻

| 项目 | 说明 |
|------|------|
| 冻结权限 | 仅后台客服（含超级管理员）可操作 |
| 冻结效果 | 账号无法登录，已登录的会话全部强制下线；冻结原因记录到操作日志 |
| 解冻 | 后台客服手动解冻，解冻后用户可正常登录 |
| 用户通知 | 冻结/解冻时通过短信 + 站内消息通知用户 |

### 2.8 草稿暂存

| 项目 | 说明 |
|------|------|
| 适用场景 | 注册表单、入驻申请表单、多步骤操作的中间态 |
| 存储方式 | 未登录用户存储于前端 LocalStorage + 后端草稿表（登录后关联用户）；已登录用户直接存储于后端草稿表 |
| 保留时长 | 48 小时，超时由定时任务自动清除 |
| 恢复机制 | 用户返回同一表单时自动加载草稿，提示"已恢复上次未完成的内容" |

### 2.9 后台用户管理

| 功能 | 说明 |
|------|------|
| 用户列表查询 | 支持按角色、注册时间、状态、标签、关键词筛选 |
| 用户详情查看 | 查看用户基础信息、企业信息（如有）、角色、标签、登录记录、操作日志 |
| 角色变更 | 管理员可为用户新增/移除角色（如审核通过讲师入驻后新增 `TRAINER` 角色） |
| 批量打标签 | 管理员可批量选择用户，统一设置/修改标签 |
| 冻结/解冻 | 见 2.7 |
| 创建内部账号 | 超级管理员可创建客服/管理员账号 |

---

## 3. 实体属性（字段设计）

### 3.1 用户基础表 `users`

> 全角色通用的用户身份表，一个用户在此表中有且仅有一行记录。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `phone` | varchar(20) | YES | NULL | 手机号，唯一（可为空仅当后台创建账号未绑定手机时） |
| `email` | varchar(128) | YES | NULL | 邮箱，唯一 |
| `password_hash` | varchar(255) | YES | NULL | BCrypt 加密后的密码；第三方登录用户可能无密码 |
| `nickname` | varchar(64) | YES | NULL | 昵称 |
| `real_name` | varchar(64) | YES | NULL | 真实姓名 |
| `avatar_url` | varchar(512) | YES | NULL | 头像 URL |
| `gender` | tinyint | NO | 0 | 性别：0=未知，1=男，2=女 |
| post_code | int(10) | 否 | 0 | 邮编 |
| province_id | int(10) | 否 | 0 | 省份 |
| city_id | int(10) | 否 | 0 | 城市 |
| district_id | int(10) | 否 | 0 | 区县 |
| town_id | int(10) | 否 | 0 | 乡镇 |
| address | varchar(200) | 否 | "" | 详细地址 |
| `status` | tinyint | NO | 1 | 账号状态：1=正常，2=冻结，3=注销 |
| `freeze_reason` | varchar(255) | YES | NULL | 冻结原因 |
| `last_login_at` | datetime | YES | NULL | 最近登录时间 |
| `last_login_ip` | varchar(45) | YES | NULL | 最近登录 IP |
| `reg_origin` | tinyint | NO | 1 | 注册来源：1=PC 官网，2=H5，3=微信小程序，4=后台创建 |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | datetime | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引：**
- `UNIQUE idx_phone (phone)` — 手机号唯一
- `UNIQUE idx_email (email)` — 邮箱唯一
- `idx_status (status)` — 按状态查询
- `idx_created_at (created_at)` — 按注册时间排序

---

### 3.2 用户角色表 `user_roles`

> 一个用户可拥有多个角色（如某人既是 C 端买家也可以作为B端客户），故使用独立关联表。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `user_id` | int | NO | — | 用户 ID，关联 `users.id` |
| `role` | varchar(32) | NO | — | 角色编码，枚举值见下方 |
| `status` | tinyint | NO | 1 | 角色状态：1=生效，2=待审核，3=审核驳回，4=已禁用 |
| `approved_at` | datetime | YES | NULL | 审核通过时间 |
| `approved_by` | int | YES | NULL | 审核人用户 ID |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | datetime | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**角色编码枚举值：**

| 编码 | 中文名 | 说明 |
|------|--------|------|
| `ENTERPRISE_BUYER` | B 端企业甲方 | 企业培训采购方 |
| `INDIVIDUAL_BUYER` | C 端个人甲方 | 个人学习用户 |
| `TRAINER` | 讲师 | 培训讲师，需审核 |
| `AGENT` | 讲师经纪人 | 讲师资源经纪人，需审核 |
| `ORGANIZATION` | 机构 | 培训机构，需审核 |
| `FRONTEND_CS` | 前台客服 | 一线客服人员 |
| `BACKEND_CS` | 后台客服 | 后台运营客服 |
| `SUPER_ADMIN` | 超级管理员 | 系统最高权限管理员 |

**索引：**
- `UNIQUE idx_user_role (user_id, role)` — 同一用户同一角色不重复
- `idx_role (role)` — 按角色类型查询
- `idx_status (status)` — 按状态查询

---

### 3.3 企业信息表 `enterprises`

> 存储 B 端企业甲方的企业相关信息，与 `users` 【一对一关联OR一对多关联？】。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明                                   |
|--------|------|-----------|--------|--------------------------------------|
| `id` | int | NO | AUTO_INCREMENT | 主键                                   |
| `user_id` | int | NO | — | 用户 ID，关联 `users.id`，唯一               |
| `company_name` | varchar(128) | YES | NULL | 企业名称                                 |
| `industry` | varchar(64) | YES | NULL | 所属行业                                 |
| `company_size` | varchar(32) | YES | NULL | 企业规模（如"50-200 人""500 人以上"）           |
| `contact_name` | varchar(64) | YES | NULL | 联系人姓名                                |
| `contact_phone` | varchar(20) | YES | NULL | 联系电话                                 |
| post_code | int(10) | 否 | 0 | 企业所在邮编                               |
| province_id | int(10) | 否 | 0 | 企业所在省份                               |
| city_id | int(10) | 否 | 0 | 企业所在城市                               |
| district_id | int(10) | 否 | 0 | 企业所在区县                               |
| town_id | int(10) | 否 | 0 | 企业所在乡镇                               |
| address | varchar(200) | 否 | "" | 企业详细地址                               |
| `training_tags` | varchar(512) | YES | NULL | 培训需求标签，JSON 数组格式，如 `["销售培训","AI赋能"]` |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 创建时间                                 |
| `updated_at` | datetime | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间                                 |

**索引：**
- `UNIQUE idx_user_id (user_id)` — 一个用户只有一条企业信息【一个企业可以有多个用户信息】
- `idx_company_name (company_name)` — 按企业名称检索
- `idx_industry (industry)` — 按行业筛选

---

### 3.4 个人买家扩展信息表 `individual_buyer_profiles`

> 存储 C 端个人甲方的扩展信息，与 `users` 一对一关联。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `user_id` | int | NO | — | 用户 ID，关联 `users.id`，唯一 |
| `occupation` | varchar(64) | YES | NULL | 职业 |
| `learning_tags` | varchar(512) | YES | NULL | 学习兴趣标签，JSON 数组格式，如 `["AI办公","销售技能"]` |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | datetime | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引：**
- `UNIQUE idx_user_id (user_id)` — 一个用户只有一条个人档案

---

### 3.5 第三方登录绑定表 `user_oauth_bindings`

> 存储用户的微信、支付宝等第三方登录绑定关系。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `user_id` | int | NO | — | 用户 ID，关联 `users.id` |
| `provider` | varchar(20) | NO | — | 第三方平台：`WECHAT`、`ALIPAY` |
| `open_id` | varchar(128) | NO | — | 第三方平台的 OpenID |
| `union_id` | varchar(128) | YES | NULL | 第三方平台的 UnionID（微信体系） |
| `oauth_nickname` | varchar(64) | YES | NULL | 第三方平台昵称 |
| `oauth_avatar_url` | varchar(512) | YES | NULL | 第三方平台头像 |
| `bound_at` | datetime | NO | CURRENT_TIMESTAMP | 绑定时间 |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | datetime | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引：**
- `UNIQUE idx_provider_openid (provider, open_id)` — 同一平台同一 OpenID 唯一
- `UNIQUE idx_user_provider (user_id, provider)` — 一个用户在同一平台只绑定一个账号
- `idx_union_id (union_id)` — 按 UnionID 查询

---

### 3.6 用户登录会话表 `user_sessions`

> 记录用户当前活跃的登录会话，用于设备管理与单设备限制。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `user_id` | int | NO | — | 用户 ID，关联 `users.id` |
| `session_token` | varchar(128) | NO | — | 会话令牌（JWT jti 或 session ID） |
| `device_name` | varchar(128) | YES | NULL | 设备名称（如"Chrome / Windows 10"） |
| `device_type` | varchar(20) | YES | NULL | 设备类型：`PC`、`MOBILE`、`TABLET` |
| `login_ip` | varchar(45) | NO | — | 登录 IP |
| `login_city` | varchar(64) | YES | NULL | 登录 IP 所属城市 |
| `is_active` | tinyint | NO | 1 | 是否活跃：1=活跃，0=已下线 |
| `login_at` | datetime | NO | CURRENT_TIMESTAMP | 登录时间 |
| `logout_at` | datetime | YES | NULL | 下线时间 |
| `expires_at` | datetime | NO | — | 会话过期时间 |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | datetime | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引：**
- `UNIQUE idx_session_token (session_token)` — 令牌唯一
- `idx_user_active (user_id, is_active)` — 查询用户活跃会话
- `idx_expires_at (expires_at)` — 定时清理过期会话

---

### 3.7 用户操作日志表 `user_operation_logs`

> 记录用户账号的关键操作，用于安全审计与用户自查。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `user_id` | int | NO | — | 操作对象用户 ID |
| `operator_id` | int | YES | NULL | 操作人用户 ID（管理员操作时有值，用户自操作时与 user_id 相同） |
| `action` | varchar(64) | NO | — | 操作类型，如 `LOGIN`、`LOGOUT`、`CHANGE_PASSWORD`、`CHANGE_PHONE`、`CHANGE_EMAIL`、`FREEZE`、`UNFREEZE`、`ROLE_CHANGE`、`UPDATE_PROFILE` |
| `action_detail` | varchar(512) | YES | NULL | 操作详情描述 |
| `ip` | varchar(45) | YES | NULL | 操作时 IP |
| `user_agent` | varchar(512) | YES | NULL | 浏览器 User-Agent |
| `result` | tinyint | NO | 1 | 操作结果：1=成功，0=失败 |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 操作时间 |

**索引：**
- `idx_user_id (user_id)` — 按用户查询操作日志
- `idx_operator_id (operator_id)` — 按操作人查询
- `idx_action (action)` — 按操作类型筛选
- `idx_created_at (created_at)` — 按时间排序

**日志保留策略：** 操作日志存储周期为 1 年，过期日志由定时任务归档或清理。管理员操作日志不可删除。

---

### 3.8 用户标签表 `user_tags`

> 用户身上的标签，支持多标签。标签用于智能推荐、折扣关联、版权课访问权限。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `user_id` | int | NO | — | 用户 ID，关联 `users.id` |
| `tag_key` | varchar(32) | NO | — | 标签分类：`USER_TYPE`（用户类型标签）、`TRAINING_NEED`（培训需求）、`LEARNING_INTEREST`（学习兴趣）、`CUSTOM`（自定义） |
| `tag_value` | varchar(64) | NO | — | 标签值，如"企业采购""AI 赋能""销售技能" |
| `source` | tinyint | NO | 1 | 标签来源：1=系统自动，2=用户自选，3=管理员设置 |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | datetime | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引：**
- `UNIQUE idx_user_tag (user_id, tag_key, tag_value)` — 同一用户同一分类下的同一标签不重复
- `idx_tag_key_value (tag_key, tag_value)` — 按标签类型和值查询用户群

---

### 3.9 草稿暂存表 `user_drafts`

> 用于保存未完成的注册表单、入驻申请、多步骤操作中的临时数据。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `user_id` | int | YES | NULL | 用户 ID（未登录时为 NULL，登录后可关联） |
| `draft_key` | varchar(64) | NO | — | 草稿业务标识，如 `REGISTER_ENTERPRISE`、`REGISTER_INDIVIDUAL`、`APPLY_TRAINER`、`APPLY_AGENT`、`APPLY_ORGANIZATION` |
| `draft_data` | json | NO | — | 草稿内容，JSON 格式存储表单数据 |
| `client_fingerprint` | varchar(128) | YES | NULL | 客户端指纹（未登录时用于匹配草稿） |
| `expires_at` | datetime | NO | — | 过期时间（创建时间 + 48 小时） |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | datetime | NO | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引：**
- `idx_user_draft (user_id, draft_key)` — 按用户和业务标识查询草稿
- `idx_fingerprint (client_fingerprint, draft_key)` — 未登录时按指纹查询
- `idx_expires_at (expires_at)` — 定时清理过期草稿

---

### 3.10 短信/邮件验证码表 `verification_codes`

> 存储手机短信验证码和邮件验证码，用于注册、登录、密码找回等场景。

| 字段名 | 类型 | 允许 NULL | 默认值 | 说明 |
|--------|------|-----------|--------|------|
| `id` | int | NO | AUTO_INCREMENT | 主键 |
| `target` | varchar(128) | NO | — | 发送目标（手机号或邮箱） |
| `code` | varchar(10) | NO | — | 验证码 |
| `type` | varchar(32) | NO | — | 用途：`REGISTER`、`LOGIN`、`RESET_PASSWORD`、`CHANGE_PHONE`、`CHANGE_EMAIL` |
| `is_used` | tinyint | NO | 0 | 是否已使用：0=未使用，1=已使用 |
| `expires_at` | datetime | NO | — | 过期时间（通常 5 分钟） |
| `ip` | varchar(45) | YES | NULL | 请求 IP，用于频率限制 |
| `created_at` | datetime | NO | CURRENT_TIMESTAMP | 创建时间 |

**索引：**
- `idx_target_type (target, type)` — 按目标和类型查询最新验证码
- `idx_expires_at (expires_at)` — 定时清理过期记录

**频率限制规则：**
- 同一手机号/邮箱 60 秒内仅可发送 1 次
- 同一手机号/邮箱 1 小时内最多 10 次
- 同一 IP 1 小时内最多 20 次

---



### 4.2 关系说明

| 关系 | 类型 | 说明                        |
|------|------|---------------------------|
| `users` → `user_roles` | 一对多 | 一个用户可拥有多个角色（如既是企业甲方又是C端用） |
| `users` → `enterprises` | 一对零或一 | 仅企业甲方角色的用户有企业信息           |
| `users` → `individual_buyer_profiles` | 一对零或一 | 仅个人甲方角色的用户有个人档案           |
| `users` → `user_oauth_bindings` | 一对多 | 一个用户可绑定多个第三方平台（微信+支付宝）    |
| `users` → `user_sessions` | 一对多 | 一个用户可有多个活跃会话（多设备登录）       |
| `users` → `user_operation_logs` | 一对多 | 一个用户有多条操作日志               |
| `users` → `user_tags` | 一对多 | 一个用户可有多个标签                |
| `users` → `user_drafts` | 一对多 | 一个用户可有多份草稿                |

> **注意：** 数据库层面不建外键，所有关联关系在代码逻辑中维护。

---

## 5. 业务逻辑与规则

### 5.1 用户状态流转

```
┌────────────────────────────────────────────────────┐
│                    用户状态机                        │
├────────────────────────────────────────────────────┤
│                                                    │
│   注册成功 ──► [正常 status=1]                      │
│                  │          ▲                       │
│        管理员冻结│          │管理员解冻              │
│                  ▼          │                       │
│              [冻结 status=2]                        │
│                                                    │
│   [正常] ──► 用户主动注销 ──► [注销 status=3]       │
│                                (不可逆)             │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 5.2 角色状态流转

```
提交入驻申请 ──► [待审核 status=2]
                    │            │
          审核通过  │            │ 审核驳回
                    ▼            ▼
              [生效 status=1]  [驳回 status=3]
                    │            │
                    │            │ 重新提交
                    │            ▼
                    │        [待审核 status=2]
          管理员禁用│
                    ▼
              [已禁用 status=4]
```

**说明：**
- 企业甲方 (`ENTERPRISE_BUYER`) 和个人甲方 (`INDIVIDUAL_BUYER`) 注册即生效，无需审核
- 讲师、经纪人、机构角色需审核后生效
- 客服和管理员由超级管理员创建即生效

### 5.3 登录安全规则

| 规则 | 参数 | 处理 |
|------|------|------|
| 密码错误锁定 | 连续 5 次错误 | 锁定 15 分钟，期间拒绝密码登录（验证码登录不受限） |
| 异地登录检测 | 登录 IP 所属城市与上次不同 | 发送短信/站内通知提醒用户 |
| 单设备播放限制 | C 端个人用户观看付费课程 | 新设备开始播放时，旧设备播放会话被踢出，展示"您的账号已在其他设备上播放" |
| 会话有效期 | PC 端 7 天，移动端 30 天 | 过期自动下线，需重新登录 |
| 冻结账号登录 | 冻结状态 | 拒绝一切登录请求，返回冻结原因 |

### 5.4 验证码规则

| 规则 | 说明 |
|------|------|
| 验证码长度 | 6 位数字 |
| 有效期 | 5 分钟 |
| 使用次数 | 一次有效，验证成功后立即标记已使用 |
| 发送频率 | 同一号码/邮箱 60 秒间隔，1 小时上限 10 次 |
| IP 频率 | 同一 IP 1 小时上限 20 次 |

### 5.5 草稿规则

| 规则 | 说明 |
|------|------|
| 保留时长 | 48 小时 |
| 清理机制 | 每小时执行一次定时任务，清理 `expires_at < NOW()` 的记录 |
| 恢复提示 | 用户回到表单页时自动加载草稿，页面顶部提示"已恢复上次未完成的内容" |
| 登录关联 | 未登录时通过 `client_fingerprint` 匹配草稿，登录后将匹配到的草稿关联 `user_id` |

### 5.6 第三方登录绑定规则

| 场景 | 处理 |
|------|------|
| 首次微信/支付宝登录，手机号未注册 | 创建新用户 → 绑定第三方 → 引导绑定手机号 |
| 首次微信/支付宝登录，手机号已注册 | 引导用户验证手机号 → 验证通过后绑定至已有账号 |
| 已绑定用户登录 | 直接通过 OpenID 匹配用户，完成登录 |
| 解除绑定 | 用户在安全设置中可解绑第三方账号（需确保至少保留一种登录方式） |

### 5.7 标签折扣规则

| 规则 | 说明 |
|------|------|
| 标签关联折扣 | 不同用户类型标签对应不同的充值折扣等级，具体折扣比例由后台管理员配置 |
| 版权课访问 | 部分版权课仅对特定标签的用户开放访问/购买权限 |
| 标签变更影响 | 标签变更后，折扣和权限实时生效；已生成的订单不受影响 |

---

## 6. 与其他模块的依赖关系

| 依赖模块 | 依赖方向 | 说明 |
|----------|---------|------|
| **讲师模块** | 用户模块 → 讲师模块 | 讲师入驻审核通过后，在 `user_roles` 新增 `TRAINER` 角色；讲师详情存储在讲师模块自己的表中 |
| **经纪人模块** | 用户模块 → 经纪人模块 | 同上，角色为 `AGENT` |
| **机构模块** | 用户模块 → 机构模块 | 同上，角色为 `ORGANIZATION` |
| **权限模块** | 用户模块 ← 权限模块 | 后台客服的细粒度权限由权限模块管理，通过 `user_id` + `role` 关联 |
| **消息/通知模块** | 用户模块 → 消息模块 | 账号冻结/解冻、审核结果、异地登录提醒等事件触发消息通知 |
| **账户财务模块** | 用户模块 ← 账户模块 | 用户充值、余额、钱包等由财务模块管理，通过 `user_id` 关联 |
| **课程模块** | 用户模块 ← 课程模块 | 课程购买/观看时校验用户角色、标签权限、单设备播放限制 |
| **订单模块** | 用户模块 ← 订单模块 | 订单创建时关联 `user_id`，校验用户状态 |
| **评价模块** | 用户模块 ← 评价模块 | 评价发布时关联 `user_id`，展示用户信息 |
| **收藏模块** | 用户模块 ← 收藏模块 | 用户收藏资源时关联 `user_id` |
| **AI 智能匹配** | 用户模块 → AI 模块 | 企业信息、标签数据作为 AI 匹配的输入 |

---

