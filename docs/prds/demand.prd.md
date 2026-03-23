# 培训需求模块 需求文档

> 模块编码：`demand`
> 版本：v1.0
> 最后更新：2026-03-19

---

## 1. 模块概述

### 1.1 核心定位

培训需求模块是平台的 **B 端企业培训需求发布与智能匹配系统**。企业通过多种入口（首页发布需求、案例定制、内训课预约、版权课咨询）提交培训需求，系统实时同步至客服工作台和外部业务系统进行跟进，并通过 AI 智能匹配为企业推荐最佳讲师/机构资源。

### 1.2 核心业务目标

- 提供统一的需求发布入口，汇聚企业培训采购需求
- 需求数据实时同步至客服工作台与外部业务系统（CRM 等），确保零遗漏跟进
- AI 智能匹配引擎根据需求特征自动推荐讲师，提升供需匹配效率
- 支持后台灵活配置匹配维度与权重，持续优化匹配质量
- 需求全流程可追溯，企业可查看自有需求进度

### 1.3 典型用户行为路径

```
企业用户发布培训需求（多入口）
    → 需求实时同步至客服工作台 + 外部业务系统
    → AI 智能匹配推荐讲师/机构
    → 客服跟进对接（记录跟进日志）
    → 需求完成/取消

企业用户查看自有需求列表 → 查看需求进度与跟进记录
```

---

## 2. 功能描述

### 2.1 企业培训需求发布

| 功能点 | 说明 |
|--------|------|
| 入口 | 首页「发布需求」按钮 |
| 填写内容 | 培训主题（必填）、培训人数、预算范围（最低-最高）、期望开始时间、培训形式（线上/线下/混合）、详细描述 |
| 访问权限 | 需企业账号登录，未登录用户点击引导登录 |
| 需求可见性 | 需求**不公开展示**，仅企业本人、后台客服、指定跟进人可查看 |
| 实时同步 | 提交后实时同步至客服工作台 + 外部业务系统 |
| 同步失败处理 | 同步失败触发自动重试（最多 3 次，间隔 30s/60s/120s）；重试均失败后发送后台客服告警通知，人工介入 |
| 需求进度 | 企业可查看自有需求列表及处理进度，不可查看其他企业的需求 |

### 2.2 AI 智能匹配

| 功能点 | 说明 |
|--------|------|
| 触发入口 | 首页「发布需求」，输入企业名称、培训主题、预算等基础信息 |
| 企业识别 | AI 根据企业名称自动识别企业背景（行业、规模等） |
| 识别失败处理 | 若 AI 无法识别企业背景，引导用户手动补充行业信息，补充后重新触发匹配 |
| 匹配结果 | 按匹配分数（match_score）降序排列，展示讲师/机构信息 + 匹配理由（JSON 格式存储匹配维度得分与说明） |
| 匹配维度配置 | 后台管理员可增删匹配维度（如行业匹配度、擅长领域、评分、成单量等），设置各维度百分比权重 |
| 实时生效 | 维度配置变更后，新的匹配请求立即使用最新配置，不影响历史匹配结果 |
| 人工调整 | 后台客服可手动调整匹配结果（新增/删除推荐讲师） |

### 2.3 案例定制需求

| 功能点 | 说明 |
|--------|------|
| 入口 | 案例详情页「定制类似方案」按钮 |
| 触发条件 | 企业账号登录后方可操作 |
| 自动关联 | 系统自动记录来源案例 ID，便于客服参考原案例内容 |
| 流转逻辑 | 创建 `demand_type=CASE_CUSTOM` 的需求记录，后续流转同通用需求 |

### 2.4 内训课预约

| 功能点 | 说明 |
|--------|------|
| 入口 | 内训课详情页，企业提交预约表单 |
| 提交内容 | 企业信息、培训人数、期望时间、简要说明 |
| 流转逻辑 | 创建 `demand_type=INTERNAL_RESERVATION` 的需求记录，关联内训课 ID |
| 可见性 | 企业可在需求列表查看预约进度 |

### 2.5 版权课咨询采购

| 功能点 | 说明 |
|--------|------|
| 入口 | 版权课专区，点击「咨询采购」按钮 |
| 流转逻辑 | 创建 `demand_type=COPYRIGHT_INQUIRY` 的需求记录，关联版权课 ID，分配至对应客服 |
| 响应方式 | 客服通过站内消息/电话与企业沟通采购事宜 |

---

## 3. 实体属性（字段设计）

### 3.1 demands — 需求主表

> 统一存储所有类型的培训需求，通过 `demand_type` 区分需求来源与类型。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| id | int | 是 | 自增 | 主键 |
| user_id | int | 是 | — | 提交人用户 ID，关联 users.id |
| enterprise_id | int | 否 | NULL | 企业信息 ID，关联 enterprises.id（自动从用户关联获取） |
| demand_type | varchar(30) | 是 | — | 需求类型：TRAINING=企业培训需求, CASE_CUSTOM=案例定制, INTERNAL_RESERVATION=内训课预约, COPYRIGHT_INQUIRY=版权课咨询 |
| title | varchar(200) | 否 | '' | 需求标题 |
| training_topic | varchar(200) | 否 | '' | 培训主题 |
| trainee_count | int | 否 | NULL | 培训人数 |
| budget_min | decimal(12,2) | 否 | NULL | 预算最低金额 |
| budget_max | decimal(12,2) | 否 | NULL | 预算最高金额 |
| expected_start_date | date | 否 | NULL | 期望开始日期 |
| format | varchar(20) | 否 | NULL | 培训形式：ONLINE=线上, OFFLINE=线下, HYBRID=混合 |
| description | text | 否 | NULL | 需求详细描述 |
| source_case_id | int | 否 | NULL | 来源案例 ID（案例定制时关联 cases.id） |
| source_course_id | int | 否 | NULL | 来源课程 ID（内训课预约/版权课咨询时关联） |
| status | tinyint | 是 | 0 | 状态：0=草稿(DRAFT), 1=已提交(SUBMITTED), 2=处理中(PROCESSING), 3=已匹配(MATCHED), 4=已完成(COMPLETED), 5=已取消(CANCELLED) |
| assigned_cs_id | int | 否 | NULL | 指派客服 ID，关联 users.id |
| external_sync_status | tinyint | 是 | 0 | 外部同步状态：0=待同步(PENDING), 1=已同步(SYNCED), 2=同步失败(FAILED) |
| external_sync_retries | int | 否 | 0 | 外部同步重试次数 |
| external_sync_at | datetime | 否 | NULL | 最近一次同步时间 |
| external_ref_id | varchar(100) | 否 | '' | 外部系统关联 ID（如 CRM 工单号） |
| created_at | datetime | 是 | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | 是 | CURRENT_TIMESTAMP | 更新时间 |

**索引设计：**

| 索引名 | 字段 | 类型 |
|--------|------|------|
| `idx_demands_user_id` | `user_id` | 普通 |
| `idx_demands_enterprise_id` | `enterprise_id` | 普通 |
| `idx_demands_demand_type` | `demand_type` | 普通 |
| `idx_demands_status` | `status` | 普通 |
| `idx_demands_assigned_cs_id` | `assigned_cs_id` | 普通 |
| `idx_demands_external_sync` | `external_sync_status` | 普通 |
| `idx_demands_source_case_id` | `source_case_id` | 普通 |
| `idx_demands_created_at` | `created_at` | 普通 |

---

### 3.2 demand_matches — AI 匹配结果表

> 存储 AI 智能匹配为需求推荐的讲师/机构及匹配分数。

| 字段名 | 类型 | 必填 | 默认值 | 说明                                                                                      |
|---|---|---|---|-----------------------------------------------------------------------------------------|
| id | int | 是 | 自增 | 主键                                                                                      |
| demand_id | int | 是 | — | 关联 demands.id                                                                           |
| trainer_id | int | 否 | NULL | 推荐讲师 ID，关联 trainers.id                                                                  |
| organization_id | int | 否 | NULL | 【推荐机构 ID】，关联 organizations.id                                                           |
| match_score | decimal(5,2) | 是 | 0.00 | 匹配分数（0.00-100.00）                                                                       |
| match_reasons | json | 否 | NULL | 匹配理由（JSON 格式，含各维度得分与说明），示例：`[{"dimension":"行业匹配","score":92,"reason":"讲师在制造业有8年授课经验"}]` |
| is_manual | tinyint | 否 | 0 | 是否人工推荐：0=AI 推荐, 1=客服手动添加                                                                |
| sort_order | int | 否 | 0 | 展示排序（AI 推荐按分数自动排序，人工可调整）                                                                |
| status | tinyint | 否 | 1 | 状态：1=有效, 0=已移除（客服手动删除）                                                                  |
| created_at | datetime | 是 | CURRENT_TIMESTAMP | 创建时间                                                                                    |

**索引设计：**

| 索引名 | 字段 | 类型 |
|--------|------|------|
| `idx_demand_matches_demand_id` | `demand_id` | 普通 |
| `idx_demand_matches_trainer_id` | `trainer_id` | 普通 |
| `idx_demand_matches_org_id` | `organization_id` | 普通 |
| `idx_demand_matches_score` | `demand_id, match_score` | 联合 |

---

### 3.3 demand_follow_ups — 需求跟进记录表

> 记录需求的每一次跟进操作（客服备注、状态变更、沟通记录等），形成完整的需求处理链路。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| id | int | 是 | 自增 | 主键 |
| demand_id | int | 是 | — | 关联 demands.id |
| operator_id | int | 是 | — | 操作人 ID，关联 users.id |
| action | varchar(50) | 是 | — | 操作类型：STATUS_CHANGE=状态变更, CS_NOTE=客服备注, CONTACT_RECORD=沟通记录, ASSIGN_CS=分派客服, MATCH_TRIGGER=触发匹配, SYNC_RETRY=同步重试 |
| content | text | 否 | NULL | 操作内容/备注详情 |
| old_status | tinyint | 否 | NULL | 变更前状态（STATUS_CHANGE 时记录） |
| new_status | tinyint | 否 | NULL | 变更后状态（STATUS_CHANGE 时记录） |
| created_at | datetime | 是 | CURRENT_TIMESTAMP | 操作时间 |

**索引设计：**

| 索引名 | 字段 | 类型 |
|--------|------|------|
| `idx_follow_ups_demand_id` | `demand_id` | 普通 |
| `idx_follow_ups_operator_id` | `operator_id` | 普通 |
| `idx_follow_ups_created_at` | `demand_id, created_at` | 联合 |

---

### 3.4 ai_match_dimensions — AI 匹配维度配置表

> 后台管理员配置 AI 匹配引擎的评分维度与权重，支持动态增删维度、调整权重。

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| id | int | 是 | 自增 | 主键 |
| dimension_key | varchar(50) | 是 | — | 维度编码（唯一标识），如 industry_match, field_match, score, deal_count |
| dimension_name | varchar(100) | 是 | — | 维度显示名称，如"行业匹配度"、"领域匹配度"、"综合评分"、"成单量" |
| description | varchar(500) | 否 | '' | 维度说明，描述该维度的评判标准 |
| weight_percentage | decimal(5,2) | 是 | 0.00 | 权重百分比（所有启用维度权重之和应为 100.00） |
| is_active | tinyint | 是 | 1 | 是否启用：0=停用, 1=启用 |
| sort_order | int | 否 | 0 | 展示排序 |
| created_at | datetime | 是 | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | datetime | 是 | CURRENT_TIMESTAMP | 更新时间 |

**索引设计：**

| 索引名 | 字段 | 类型 |
|--------|------|------|
| `idx_match_dim_key` | `dimension_key` | UNIQUE |
| `idx_match_dim_active` | `is_active` | 普通 |

---


## 5. 业务逻辑与规则

### 5.1 需求状态流转

```
[草稿](0) --提交--> [已提交](1)
[已提交](1) --客服受理--> [处理中](2)
[处理中](2) --AI/人工匹配完成--> [已匹配](3)
[已匹配](3) --对接成功--> [已完成](4)
[处理中](2) --对接成功--> [已完成](4)
[已提交](1) --企业取消--> [已取消](5)
[处理中](2) --企业取消--> [已取消](5)
[已匹配](3) --企业取消--> [已取消](5)
```

- 每次状态变更自动创建 `demand_follow_ups` 记录（`action=STATUS_CHANGE`）
- 已完成和已取消为终态，不可回退

### 5.2 需求提交与同步流程

```
企业填写需求表单
    → 保存草稿（可选，status=0）
    → 提交需求（status=1）
        → 异步触发外部同步
            → 同步成功 → external_sync_status=1，记录 external_sync_at
            → 同步失败 → external_sync_retries+1
                → 重试次数 < 3 → 延迟重试（30s/60s/120s）
                → 重试次数 ≥ 3 → external_sync_status=2，通知后台客服告警
        → 异步触发 AI 智能匹配（仅 demand_type=TRAINING 时）
        → 通知客服工作台（实时推送）
```

### 5.3 AI 智能匹配规则

#### 5.3.1 匹配触发时机

| 时机 | 说明 |
|------|------|
| 需求提交 | `demand_type=TRAINING` 的需求提交后自动触发 |
| 企业信息补充 | AI 识别企业失败 → 企业手动补充行业信息后重新触发 |
| 客服手动触发 | 客服在需求详情页可手动重新触发匹配 |

#### 5.3.2 匹配流程

1. 读取需求的培训主题、行业、预算、人数等维度信息
2. 根据企业名称调用 AI 服务识别企业背景（行业、规模、类型）
3. 若 AI 无法识别企业背景，返回"需补充企业信息"状态，前端引导用户手动补充行业信息
4. 用户补充后重新触发匹配
5. 读取 `ai_match_dimensions` 表中所有启用维度（`is_active=1`），按权重计算综合匹配分
6. 结果按 `match_score` 降序写入 `demand_matches` 表，同时记录每个维度的单项得分与匹配理由

#### 5.3.3 匹配维度配置规则

- 后台管理员可增删匹配维度，设置百分比权重
- 所有启用维度的 `weight_percentage` 之和应为 100.00，保存时系统校验
- 维度配置变更实时生效，仅影响新的匹配请求，不影响历史 `demand_matches` 记录
- 预置维度示例：行业匹配度(25%)、培训领域匹配度(25%)、讲师综合评分(20%)、成单量(15%)、预算匹配度(15%)

### 5.4 外部系统同步规则

| 规则 | 说明 |
|------|------|
| 同步时机 | 需求提交（status 从 0→1）时立即触发 |
| 同步内容 | 需求全量字段 + 企业信息 + 提交人信息 |
| 重试策略 | 指数退避：30s → 60s → 120s，最多 3 次 |
| 失败处理 | 重试耗尽后标记 `external_sync_status=2`，发送告警至后台客服（站内消息 + 企业微信通知） |
| 同步回写 | 外部系统返回工单号写入 `external_ref_id`，便于双向追踪 |

### 5.5 需求可见性规则

| 角色 | 可见范围 |
|------|----------|
| 企业用户 | 仅可查看本人提交的需求列表与详情 |
| 后台客服 | 可查看所有需求，按状态/类型/时间筛选 |
| 指派客服 | 在工作台中优先展示分配给自己的需求 |
| 其他角色 | 不可见（需求数据不公开展示） |

### 5.6 各类型需求差异

| 需求类型 | 入口 | 必填字段 | 特殊逻辑 |
|----------|------|----------|----------|
| TRAINING | 首页「发布需求」 | training_topic | 自动触发 AI 匹配 |
| CASE_CUSTOM | 案例详情「定制类似方案」 | — | 自动填充 source_case_id |
| INTERNAL_RESERVATION | 内训课详情预约 | — | 自动填充 source_course_id |
| COPYRIGHT_INQUIRY | 版权课「咨询采购」 | — | 自动填充 source_course_id，分派版权课客服 |

### 5.7 跟进记录规则

- 系统自动记录：状态变更、AI 匹配触发、同步重试、客服分派
- 人工记录：客服备注、沟通记录
- 跟进记录不可删除，仅可追加
- 企业用户可查看与自己需求相关的跟进记录（排除内部备注，仅展示沟通记录和状态变更）

---

## 6. 与其他模块的依赖关系

| 依赖模块 | 关系说明 |
|----------|----------|
| **用户模块 (users)** | `demands.user_id → users.id`，需求提交人身份；`demands.assigned_cs_id → users.id`，指派客服 |
| **企业信息 (enterprises)** | `demands.enterprise_id → enterprises.id`，企业信息用于 AI 匹配和客服参考 |
| **讲师模块 (trainers)** | `demand_matches.trainer_id → trainers.id`，AI 匹配推荐讲师 |
| **机构模块 (organizations)** | `demand_matches.organization_id → organizations.id`，AI 匹配推荐机构 |
| **企业案例模块 (cases)** | `demands.source_case_id → cases.id`，案例定制需求关联来源案例 |
| **课程模块 (courses)** | `demands.source_course_id` 关联内训课/版权课，用于预约和咨询 |
| **消息通知模块 (notifications)** | 需求提交通知客服、同步失败告警、状态变更通知企业 |
| **外部业务系统 (CRM)** | 需求数据通过接口实时同步至外部 CRM/业务系统，`external_ref_id` 双向追踪 |
| **AI 服务（外接）** | AI 智能匹配引擎：企业背景识别、讲师-需求匹配计算 |
| **审核工作台 (admin)** | 后台客服在统一工作台管理需求：受理、分派、跟进、匹配调整 |

---

