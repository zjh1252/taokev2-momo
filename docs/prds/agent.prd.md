# 讲师经纪人模块 需求文档

## 1. 模块概述

### 1.1 核心定位

讲师经纪人（Agent）是平台的**培训资源中介与讲师运营者**角色。核心职责是维护多个讲师资源、对接培训需求、为乙方推荐匹配讲师，是连接乙方与讲师的桥梁，注重供需匹配效率与成单率。

### 1.2 平台核心价值

1. 提供专属讲师资源库管理工具，高效维护多个讲师的信息、课程；
2. 平台曝光加持，提升经纪人在培训行业的知名度与可信度；
3. 支持多格式文件上传与自定义核心字段管理，提升讲师资料维护便利性。

### 1.3 典型用户行为路径

经纪人入驻申请 → 资质认证 → 建立讲师资源库（添加/维护讲师，多格式上传资料，同步自定义字段）→ 查看（客服中转）推送的培训需求 → 筛选匹配旗下讲师 → 向平台推荐讲师 → 对接平台与讲师 → 跟进合作进度 → 完成成单

---

## 2. 功能描述

### 2.1 经纪人入驻认证

| 功能点 | 说明 |
|--------|------|
| 入驻申请 | 经纪人自主提交入驻申请，填写个人/公司名称（必填）、联系信息（手机号、邮箱）、从业经历、核心运营领域，上传资质证明（行业认证、合作讲师证明等） |
| 后台审核 | 由后台客服审核申请材料的资质真实性与信息完整性，支持「通过 / 驳回」操作，驳回需填写具体原因 |
| 审核通知 | 审核结果通过短信 + 平台站内消息通知经纪人 |
| 草稿保留 | 未完成的入驻申请草稿保留 **30 天**，超时后自动**物理删除** |
<!-- | 经纪人类型 | 区分个人经纪人与公司经纪人（type 字段），二者入驻流程一致。<br>**【一期限制说明】：当前仅支持单账号管理，暂不支持公司子员工账号体系（RBAC），公司多业务员需共用该主账号。** | -->

### 2.2 讲师资源库管理

#### 2.2.1 讲师添加/绑定

| 功能点 | 说明 |
|--------|------|
| 添加讲师 | 经纪人添加旗下合作讲师，填写讲师基本信息（姓名、擅长领域等），邀请讲师认证 |
| 标签管理 | 允许经纪人为旗下合作讲师打标签，便于分类检索 |
| 合作证明 | 上传合作证明文件（如签约合同），支持多格式 |
| 讲师确认绑定 | 讲师需确认绑定关系后，绑定才正式生效 |
| 信息查看 | 绑定后经纪人可查看讲师的课程、资质信息 |
| 授权编辑 | 仅在讲师授权下可编辑讲师部分信息（如课程报价） |

#### 2.2.2 多格式文件上传

| 功能点 | 说明 |
|--------|------|
| 支持格式 | DOCX、PDF、PPT、JPG、PNG（打破旧系统仅支持 DOCX 的限制） |
| 文件预览 | 上传后支持在线预览，确保内容准确 |
| 自定义字段同步 | 支持客服自定义核心字段的文件同步上传 |

#### 2.2.3 讲师信息维护

| 功能点 | 说明 |
|--------|------|
| 信息更新 | 在讲师授权下，更新讲师的授课案例、课程信息，上传最新资质 |
| 分类管理 | 按培训领域、讲师等级对旗下讲师做分类管理，方便快速匹配需求 |
| 排序管理 | 经纪人可自定义旗下讲师的展示排序 |
| 自定义字段 | 自定义核心字段长度不超过 **8 个字** |

#### 2.2.4 讲师数据查看

| 功能点 | 说明 |
|--------|------|
| 数据指标 | 查看旗下每个讲师的曝光量、点赞量、评价详情 |
<!-- | 时间维度 | 按时间维度（周/月/年）查看数据趋势，辅助优化运营策略 | -->

<!-- ### 2.3 运营数据统计

| 功能点 | 说明 |
|--------|------|
| 统计指标 | 查看讲师推荐量、收藏量、评价量等核心数据 |
| 分析维度 | 按时间维度、培训领域维度分析数据 | -->

---

## 3. 实体属性（字段设计）

### 3.1 agents — 经纪人主表

经纪人的核心信息表，一个经纪人对应一个 users 表用户。

| 字段名 | 类型 | 是否必填 | 默认值 | 说明 |
|--------|------|----------|--------|------|
| id | int | 是 | 自增主键 | 主键 |
| user_id | int | 是 | — | 关联 users 表用户 ID |
| company_name | varchar(255) | 是 | — | 公司名称/个人名称 |
<!-- | type | tinyint | 是 | 1 | 经纪人类型：1=个人, 2=公司 | -->
| contact_name | varchar(100) | 否 | '' | 联系人姓名 |
| mobile | varchar(20) | 是 | — | 联系手机号 |
| email | varchar(255) | 否 | '' | 联系邮箱 |
| province_code | varchar(10) | 否 | '' | 省份编码 |
| city_code | varchar(10) | 否 | '' | 城市编码 |
| address | varchar(500) | 否 | '' | 详细地址 |
| industry | varchar(100) | 否 | '' | 所属行业 |
| core_field | varchar(255) | 否 | '' | 核心运营领域，多值逗号分隔 |
| experience | text | 否 | NULL | 从业经历描述 |
| intro | text | 否 | NULL | 经纪人简介 |
| qualification_files | json | 否 | NULL | 资质证明文件列表（JSON 数组，每项含 file_name, file_url, file_type） |
| status | tinyint | 是 | 0 | 状态：0=草稿, 1=待审核, 2=审核通过, 3=审核驳回, 4=已禁用 |
| reject_reason | varchar(500) | 否 | '' | 审核驳回原因 |
| reviewed_at | datetime | 否 | NULL | 审核时间 |
| reviewed_by | int | 否 | NULL | 审核人（后台客服 user_id） |
| draft_expired_at | datetime | 否 | NULL | 草稿过期时间（创建后 30 天） |
| created_at | datetime | 是 | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | 是 | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引设计：**
- `idx_agents_user_id` — user_id 唯一索引
- `idx_agents_status` — status 普通索引
- `idx_agents_mobile` — mobile 普通索引

---

### 3.2 agent_trainers — 经纪人-讲师绑定关系表

记录经纪人与旗下讲师的绑定关系，需讲师确认方生效。

| 字段名 | 类型 | 是否必填 | 默认值 | 说明 |
|--------|------|----------|--------|------|
| id | int | 是 | 自增主键 | 主键 |
| agent_id | int | 是 | — | 经纪人 ID（关联 agents.id） |
| trainer_id | int | 是 | — | 讲师用户 ID（关联 users.id，支持影子账号 ID） |
| status | tinyint | 是 | 0 | 绑定状态：0=待讲师确认, 1=已绑定, 2=讲师拒绝, 3=已解绑, 4=影子状态(待认领) |
| authorization | tinyint | 是 | 0 | 授权级别：0=仅查看, 1=可编辑部分信息（如报价） |
| cooperation_proof_url | varchar(500) | 否 | '' | 合作证明文件 URL（如签约合同扫描件） |
| tags | varchar(500) | 否 | '' | 经纪人为讲师打的标签，逗号分隔 |

| trainer_level | tinyint | 否 | 0 | 讲师等级：0=普通, 1=资深, 2=专家, 3=大咖 |
| sort_order | int | 是 | 0 | 经纪人自定义排序值（越小越靠前） |
| confirmed_at | datetime | 否 | NULL | 讲师确认绑定时间 |
| unbound_at | datetime | 否 | NULL | 解绑时间 |
| created_at | datetime | 是 | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | 是 | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引设计：**
- `idx_agent_trainers_agent_id` — agent_id 普通索引
- `idx_agent_trainers_trainer_id` — trainer_id 普通索引
- `idx_agent_trainers_agent_trainer` — (agent_id, trainer_id) 唯一索引，防止重复绑定
- `idx_agent_trainers_status` — status 普通索引

---

### 3.3 trainer_categories — 经纪人旗下讲师的培训领域分类表

经纪人为旗下讲师指定培训领域分类，用于快速按领域匹配需求。

| 字段名 | 类型 | 是否必填 | 默认值 | 说明 |
|--------|------|----------|--------|------|
| id | int | 是 | 自增主键 | 主键 |
| trainer_id | int | 是 | — | 关联 trainer.id |
| category_id | int | 是 | — | 培训领域分类 ID（关联全局分类表） |
| sort_order | int | 是 | 0 | 排序值 |
| created_at | datetime | 是 | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | 是 | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引设计：**
- `idx_trainer_id` — trainer_id 普通索引
- `idx_category_id` — category_id 普通索引


---

### 3.4 agent_trainer_files — 经纪人上传的讲师资料文件表

存储经纪人为旗下讲师上传的各类资料文件（合作证明、讲师简介、课件、资质等）。

| 字段名 | 类型 | 是否必填 | 默认值 | 说明 |
|--------|------|----------|--------|------|
| id | int | 是 | 自增主键 | 主键 |
| agent_id | int | 是 | — | 经纪人 ID（关联 agents.id） |
| trainer_id | int | 是 | — | 讲师用户 ID（关联 users.id） |
| agent_trainer_id | int | 是 | — | 关联 agent_trainers.id |
| file_name | varchar(255) | 是 | — | 文件原始名称 |
| file_url | varchar(500) | 是 | — | 文件存储 URL |
| file_type | varchar(20) | 是 | — | 文件类型：docx, pdf, ppt, jpg, png |
| file_size | bigint | 是 | 0 | 文件大小（字节） |
| file_category | varchar(50) | 是 | 'other' | 文件分类：cooperation_proof=合作证明, resume=讲师简历, courseware=课件, qualification=资质证明, other=其他 |
| custom_field_name | varchar(8) | 否 | '' | 自定义核心字段名称（长度 ≤ 8 字） |
| description | varchar(500) | 否 | '' | 文件描述 |
| sort_order | int | 是 | 0 | 排序值 |
| created_at | datetime | 是 | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | 是 | CURRENT_TIMESTAMP ON UPDATE | 更新时间 |

**索引设计：**
- `idx_atf_agent_id` — agent_id 普通索引
- `idx_atf_trainer_id` — trainer_id 普通索引
- `idx_atf_agent_trainer_id` — agent_trainer_id 普通索引
- `idx_atf_file_category` — file_category 普通索引

---


## 5. 业务逻辑与规则

### 5.1 入驻申请流程

1. 用户注册并登录后，在经纪人入驻页面填写申请信息。
2. 表单可分步填写，中途离开自动保存为**草稿**（status=0），草稿有效期 **30 天**，超时由定时任务自动进行**物理删除**。
3. 提交申请后状态变为**待审核**（status=1）。
4. 后台客服审核：
   - 通过 → status=2，短信 + 站内消息通知经纪人，经纪人账号激活经纪人角色权限。
   - 驳回 → status=3，写入 reject_reason，短信 + 站内消息通知经纪人，经纪人可修改后重新提交。
5. 一个用户仅可关联一条经纪人记录（user_id 唯一索引）。

### 5.2 讲师绑定流程

1. 经纪人在资源库中发起「添加讲师」，支持两种模式：
   - **邀请已有讲师**：通过手机号等检索平台已有讲师，发起绑定邀请并上传合作证明。
   - **代创建（影子讲师）**：录入新讲师基本信息（姓名、手机号等），系统自动在 `users` 表创建影子账号，并立即生成绑定记录。
2. 绑定状态扭转：
   - **邀请模式**：创建 `agent_trainers` 记录，`status=0`（待讲师确认）。讲师收到站内信邀请。讲师确认后 `status=1`（已绑定），拒绝则 `status=2`。
   - **代创建模式**：创建 `agent_trainers` 记录，`status=4`（影子状态/待认领）。此状态下，经纪人可**立即**将该讲师用于业务推荐和资源展示。
3. 影子讲师认领（针对代创建模式）：
   - 经纪人将专属邀请链接发送给影子讲师。
   - 讲师点击链接，使用预留手机号进行验证。
   - 验证通过后，补充必要信息/密码，影子账号转为正式用户账号。
   - 系统自动将 `agent_trainers` 状态更新为 `status=1`（已绑定），记录 `confirmed_at`。
   - 影子讲师自创建起 14 天内未认领，系统定时任务自动删除影子账号及对应 `agent_trainers` 绑定记录。
4. 绑定后经纪人可查看讲师课程/资质信息。
5. 经纪人仅在讲师设置 authorization=1 后方可编辑讲师报价等有限字段（注：影子状态下，由于账号由经纪人代建，经纪人默认拥有编辑权限）。
6. 任何一方可发起**解绑**操作 → status=3，记录 unbound_at。
7. 同一经纪人与同一讲师之间仅允许一条有效绑定记录（唯一索引约束，解绑后如需重新绑定则更新原记录状态）。

### 5.3 文件上传规则

1. 支持格式：DOCX、PDF、PPT、JPG、PNG。
2. 单个文件大小上限由系统配置决定（建议不超过 50MB）。
3. 上传后需校验文件格式和大小，不合规的文件拒绝上传并提示用户。
4. 文件通过 file_category 分类：合作证明、讲师简历、课件、资质证明、其他。
5. 自定义核心字段名称长度不超过 **8 个字符**。
6. 文件上传后支持在线预览（前端调用预览服务）。

### 5.4 讲师分类管理规则

1. 经纪人可为每个绑定讲师指定 1~N 个培训领域分类（agent_trainer_categories）。
2. 分类引用全局分类表（categories），不独立维护分类数据。
3. 经纪人自身的运营领域分类通过 agent_categories 表维护。
4. 分类信息用于快速匹配培训需求：当培训需求到达时，系统可根据分类快速筛选匹配的讲师。

### 5.5 讲师排序规则

1. 经纪人可通过 agent_trainers.sort_order 自定义旗下讲师的展示顺序。
2. sort_order 值越小排序越靠前，默认值为 0。
3. 同一 sort_order 值按 created_at 升序排列。

### 5.6 数据统计规则

1. 讲师数据指标（曝光量、点赞量、评价量）来自平台公共统计模块，经纪人仅做读取展示。
2. 运营数据按日汇总，支持按周/月/年聚合查询。
3. 支持按培训领域维度筛选统计数据。

### 5.7 草稿清理策略

1. 草稿记录在创建时设置 draft_expired_at = created_at + 30 天。
2. 定时任务每天扫描一次，将超过 draft_expired_at 且 status=0 的记录进行**物理删除**。
3. 影子讲师创建时设置 shadow_expired_at = created_at + 14 天；超过期限且未认领（status=4）时，定时任务自动删除影子账号及绑定关系。

### 5.8 公司账号体系说明（一期边界）

1. **单账号机制**：当前重构一期针对公司型经纪人，暂不支持企业子账号（RBAC）体系分配与业务员资源隔离。
2. **资源共享**：一家公司的多名业务员目前需共用一个账号密码登录平台，讲师资源与客户对接进度在公司内部完全公开共享，无法区分讲师/资源具体由哪位业务员添加。
3. **后续迭代评估**：鉴于旧系统曾存在 `parent_id`（上级代理/主子账号关系），如果现有业务强依赖“业务员业绩独立核算”或“内部讲师资源隔离”，需与业务方确认当前共用账号方案是否满足基本诉求。若不满足，需在后续版本专项迭代「企业子账号体系」。

---

## 6. 与其他模块的依赖关系

| 依赖模块 | 关系说明 |
|----------|----------|
| **用户模块（users）** | agents.user_id → users.id，经纪人必须先注册为平台用户；agent_trainers.trainer_id → users.id，讲师也是用户（包含代创建的影子账号） |
| **分类模块（categories）** | agent_categories.category_id、agent_trainer_categories.category_id 引用全局培训领域分类表 |
| **讲师模块（trainers）** | 经纪人绑定的讲师需已通过讲师入驻认证；经纪人可查看讲师的课程、资质等信息 |
| **消息通知模块** | 入驻审核结果通知、讲师绑定邀请/确认/拒绝通知，均通过消息通知模块发送（短信 + 站内消息） |
| **文件存储模块** | agent_trainer_files 的文件实体存储依赖 OSS/文件存储服务，表中仅记录 file_url |
| **后台审核模块** | 经纪人入驻申请纳入后台客服统一审核工作台 |
| **数据统计模块** | 讲师曝光量、点赞量、评价量等数据来源于平台公共统计服务 |

---

<!-- ## 7. 参考旧表

以下为旧系统中经纪人相关的数据表，供重构时对照参考。新表在旧表基础上进行了以下主要改进：

- 统一时间字段为 `datetime` 类型（旧表使用 `int` 时间戳）
- 统一主键为 `id` 且 `int` 自增
- 所有表增加 `created_at` / `updated_at` 字段
- 地区字段由 `int` 改为 `varchar` 编码（适配标准行政区划编码）
- 新增文件管理表 `agent_trainer_files`，支持多格式文件上传
- 合并旧 `tk_agent_trainer_order` 排序功能到 `agent_trainers.sort_order` 字段
- 合并旧 `tk_agent_trainer_cate` 排序功能到 `agent_trainer_categories.sort_order` 字段
- 暂不迁移旧表 `tk_agent_info` 中的 `parent_id` 字段（因一期明确不支持公司子员工账号与上下级代理体系）。

### 旧表结构

#### tk_agent_info（经纪信息表）

```sql
CREATE TABLE `tk_agent_info` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `uid` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '用户 UID',
  `show_name` varchar(255) NOT NULL DEFAULT '' COMMENT '真实姓名/公司名',
  `gender` tinyint(1) DEFAULT '0' COMMENT '性别 1=男，2=女，0=未知',
  `signature` varchar(255) NOT NULL DEFAULT '' COMMENT '签名',
  `cate` varchar(50) NOT NULL DEFAULT '' COMMENT '领域（大分类）',
  `subcate` varchar(50) NOT NULL DEFAULT '' COMMENT '子领域',
  `province` int(5) unsigned NOT NULL DEFAULT '0' COMMENT '省份',
  `city` int(5) unsigned NOT NULL DEFAULT '0' COMMENT '城市',
  `email` varchar(255) NOT NULL DEFAULT '' COMMENT '邮箱',
  `mobile` varchar(50) NOT NULL DEFAULT '' COMMENT '手机号',
  `intro` text NOT NULL COMMENT '介绍',
  `type` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '个人(1)，公司(2)',
  `parent_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '上级代理 ID',
  `isopen` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否允许自动加入',
  `createtime` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '创建时间戳',
  `updatetime` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '更新时间戳',
  PRIMARY KEY (`id`)
) COMMENT='经纪信息表';
```

#### tk_agent_trainer（经纪人-讲师关系表）

```sql
CREATE TABLE `tk_agent_trainer` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `agent_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '代理 ID',
  `trainer_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '讲师 ID',
  `status` tinyint(11) unsigned NOT NULL DEFAULT '0' COMMENT '状态: 0 未知；1 正常；2 申请中；3 已解除；4 已申请通过但不显示',
  `sort` int(11) NOT NULL DEFAULT '0' COMMENT '排序',
  `createtime` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '创建时间戳',
  `updatetime` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '更新时间戳',
  PRIMARY KEY (`id`),
  UNIQUE KEY `agent_id` (`agent_id`,`trainer_id`)
) COMMENT='经纪人-讲师关系表';
```

#### tk_agent_cate（代理讲师分类）

```sql
CREATE TABLE `tk_agent_cate` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `agent_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '代理 ID',
  `cate_name` varchar(100) NOT NULL DEFAULT '' COMMENT '分类名称',
  `createtime` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '创建时间',
  `updatetime` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '更新时间',
  `sort` smallint(5) unsigned NOT NULL DEFAULT '0' COMMENT '排序',
  `disabled` tinyint(11) unsigned NOT NULL DEFAULT '0' COMMENT '是否禁用: 0 未禁用；1 已禁用',
  PRIMARY KEY (`id`)
) COMMENT='代理讲师分类';
```

#### tk_agent_trainer_cate（代理讲师分类排序）

```sql
CREATE TABLE `tk_agent_trainer_cate` (
  `agent_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '代理 ID',
  `agent_cate_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT 'tk_agent_cate 表 id',
  `trainer_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '讲师 ID',
  `sort` smallint(11) unsigned NOT NULL DEFAULT '9999' COMMENT '顺序',
  `updatetime` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '创建时间',
  PRIMARY KEY (`agent_cate_id`,`trainer_id`)
) COMMENT='代理讲师分类排序';
```

#### tk_agent_trainer_order（门户讲师排序）

```sql
CREATE TABLE `tk_agent_trainer_order` (
  `agent_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '门户 ID',
  `trainer_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '讲师 ID',
  `order_num` smallint(10) unsigned NOT NULL DEFAULT '0' COMMENT '顺序',
  PRIMARY KEY (`agent_id`,`trainer_id`)
) COMMENT='门户讲师排序';
```

### 新旧表映射关系

| 旧表 | 新表 | 说明 |
|------|------|------|
| tk_agent_info | agents | 经纪人主表，新增审核流程字段、草稿过期时间、资质文件JSON、地区编码改为 varchar |
| tk_agent_trainer | agent_trainers | 绑定关系表，新增授权级别、讲师等级、确认/解绑时间；排序字段合并自 tk_agent_trainer_order |
| tk_agent_cate | agent_categories | 经纪人自身运营领域，改为引用全局 categories 表，不再独立维护分类名称 |
| tk_agent_trainer_cate | agent_trainer_categories | 讲师的培训领域分类，改为引用全局 categories 表 |
| tk_agent_trainer_order | agent_trainers.sort_order | 合并到绑定关系表的 sort_order 字段，不再单独建表 |
| —（新增） | agent_trainer_files | 新增文件管理表，支持多格式文件上传（DOCX/PDF/PPT/JPG/PNG） | -->
