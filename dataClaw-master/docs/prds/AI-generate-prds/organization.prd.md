# 机构模块 需求文档

> 本文档面向 AI 编程输入，描述「机构（Organization/Institution）」模块的产品需求、数据模型与接口契约。

---

## 1. 模块概述

### 1.1 核心定位

机构是平台的专业培训服务运营方，具备课程研发能力、讲师团队管理及公开课排课落地的能力。核心需求是发布课程/公开课、管理旗下讲师资源、实现规模化培训变现。

### 1.2 平台核心价值

1. 提供课程/公开课发布、排课、管理的一站式工具，提升运营效率
2. 平台背书提升机构可信度，统一的评价体系打造机构品牌
3. 支持机构讲师团队展示，多维度曝光机构资源
4. 支持多格式文件上传、资料批量导出与客服自定义核心字段管理

### 1.3 典型用户行为路径

```
机构入驻申请 → 资质认证 → 完善机构主页 → 多格式上传课程/讲师资料（同步自定义字段）
→ 发布课程/公开课（排课） → 管理课程/排课信息 → 查看收益/评价
```

---

## 2. 功能需求

### 2.1 机构入驻认证

#### 2.1.1 入驻申请

| 要素 | 说明 |
|------|------|
| 触发角色 | 未认证用户（已注册） |
| 提交信息 | 机构名称、营业执照号、联系人姓名、联系电话、联系邮箱、核心业务领域（多选，关联平台领域标签）、师资团队介绍（富文本） |
| 上传材料 | 资质证明文件、授课案例文件、合作企业证明文件（支持 DOCX/PDF/PPT/JPG/PNG 多格式） |
| 审核流程 | 后台客服审核 → 审核结果短信/平台消息通知 |
| 企业实名 | 必须完成企业实名认证（营业执照与企查查/天眼查人工校验） |
| 草稿保留 | 未完成的入驻申请草稿保留 **48 小时**，超时自动删除 |
| 高校区分 | `org_type` 区分高校与非高校：高校联系方式可对外公布；非高校机构允许显示名称但不允许展示联系方式，甲方不可直接对接非高校机构 |

#### 2.1.2 资质升级

- 已入驻机构可提交更高等级资质（如行业认证、大型企业合作案例），申请资质升级
- 后台客服审核通过后，平台增加该机构的曝光权重，优先推荐其课程/公开课
- 资质等级影响机构星级与搜索排序权重

### 2.2 机构主页管理

#### 2.2.1 机构信息编辑

- 可编辑字段：头像、机构名称、机构简介（富文本）、核心业务领域（多选标签）、办公地址（省/市/详细地址）
- 上传/修改：合作案例、授课成果（需经后台客服审核后展示）
- 主页公开展示：机构星级、评价星分、成单量

#### 2.2.2 师资团队管理

| 要素 | 说明 |
|------|------|
| 添加讲师 | 机构可添加旗下讲师，建立机构-讲师绑定关系 |
| 讲师信息 | 完善讲师的姓名、头衔、擅长领域、从业经历、授课案例等 |
| 标签管理 | 机构可为旗下讲师添加标签，支持分类管理（按领域、等级等维度） |
| 多格式上传 | 讲师资料支持 DOCX/PDF/PPT/JPG/PNG 多格式上传 |
| 自定义字段 | 支持客服自定义核心字段同步（字段长度≤8字） |

### 2.3 版权课管理

- 与讲师版权课管理功能一致
- 机构可上传版权课信息：课程名称、定价、课程大纲、适用人群、版权证书、课程封面
- 后台客服审核通过后，在机构主页及平台版权课专区展示，标注版权标识
- 版权课定价由平台统一定义，机构不可自行修改

### 2.4 课程与公开课运营

#### 2.4.1 在线课

- 功能同讲师在线课发布，额外支持：
  - 标注「机构专属课程」标识
  - 多讲师联合授课的课程发布（一门课关联多个讲师）
  - 多格式课程资料上传（PPT 课件、PDF 讲义等）
  - 前台支持单个视频上传（大小另行约定），批量视频由后台客服统一上传
- 课程发布后需经后台客服审核上线

#### 2.4.2 线下公开课排课

| 要素 | 说明 |
|------|------|
| 批量排课 | 对同一公开课设置多城市/多时间排课，一键发布 |
| 场地信息 | 设置公开课场地名称、地址、容纳人数 |
| 会务人员 | 设置会务联系人、联系电话 |
| 会务提醒 | 报名成功后向甲方发送会务提醒（短信/平台消息） |
| 后台同步 | 排课操作同步至后台，后台客服做关键操作需二次确认 |

#### 2.4.3 公开课运营管理

- 查看公开课报名人数（仅结果数据，无报名者明细）
- 查看预约人数（仅结果数据，无明细）
- 查看剩余名额

#### 2.4.4 内训课

- 机构可代旗下讲师发布、编辑内训课（与讲师高度绑定）
- 填写：课程名称、简介、核心模块、适配行业、企业规模、授课时长、课程封面、讲师资质及内训案例
- 允许填写定价，不开放平台直接报名入口
- 支持批量管理旗下讲师的内训课，统一上下架、修改展示信息
- 发布及修改后均需经后台客服审核

### 2.5 公开课状态管理

| 状态 | 枚举值 | 说明 |
|------|--------|------|
| 招生中 | `ENROLLING` | 仅支持预约/咨询，不允许下单支付 |
| 确认开课 | `CONFIRMED` | 允许下单支付，开放线上报名 |
| 已取消 | `CANCELLED` | 自动关闭报名入口 |

- 状态变更后实时同步至前台展示
- 状态变更时向已预约用户发送通知（短信/平台消息）
- 仅机构/后台客服可手动更新状态

### 2.6 收益与数据

#### 2.6.1 收益管理

- 查看课程/公开课收益明细（按课程维度、时间维度）
- 查看累计收益与结算状态
- 支持申请企业公户提现，平台审核后完成结算

#### 2.6.2 运营数据统计

- 机构曝光量（按日/周/月）
- 在线课销量
- 公开课报名量

---

## 3. 角色与权限

| 角色 | 权限说明 |
|------|----------|
| 机构管理员 | 机构入驻、主页管理、师资管理、课程管理、收益查看、公开课状态管理的完整操作权限 |
| 后台客服 | 入驻审核、内容审核（课程/案例/讲师资料）、版权课审核、公开课状态变更、关键操作二次确认 |
| 甲方用户（浏览者） | 查看机构主页、课程列表；高校机构可查看联系方式，非高校机构仅可查看名称 |

---

## 4. 数据模型

### 4.1 organizations（机构主表）

> 机构核心信息表，与 `users` 表通过 `user_id` 关联。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | int | PK, AUTO_INCREMENT | 主键 |
| `user_id` | int | NOT NULL | 关联用户表 ID |
| `name` | varchar(200) | NOT NULL | 机构名称 |
| `short_name` | varchar(100) | | 机构简称 |
| `org_type` | tinyint | NOT NULL, DEFAULT 0 | 机构类型：0=普通机构, 1=高校 |
| `avatar` | varchar(500) | | 机构头像 URL |
| `intro` | text | | 机构简介（富文本） |
| `business_areas` | varchar(500) | | 核心业务领域，逗号分隔的标签 ID |
| `business_license_no` | varchar(100) | | 营业执照号 |
| `business_license_url` | varchar(500) | | 营业执照文件 URL |
| `contact_name` | varchar(50) | | 联系人姓名 |
| `contact_phone` | varchar(30) | | 联系电话 |
| `contact_email` | varchar(150) | | 联系邮箱 |
| `province_code` | varchar(10) | | 省份编码 |
| `city_code` | varchar(10) | | 城市编码 |
| `address` | varchar(300) | | 详细办公地址 |
| `teacher_team_intro` | text | | 师资团队介绍（富文本） |
| `status` | tinyint | NOT NULL, DEFAULT 0 | 入驻状态：0=草稿, 1=待审核, 2=审核通过, 3=审核驳回, 4=已冻结 |
| `reject_reason` | varchar(500) | | 审核驳回原因 |
| `qualification_level` | tinyint | NOT NULL, DEFAULT 1 | 资质等级：1=基础, 2=中级, 3=高级 |
| `star_level` | tinyint | NOT NULL, DEFAULT 0 | 机构星级（0-5） |
| `exposure_weight` | int | NOT NULL, DEFAULT 0 | 曝光权重（资质升级后增加） |
| `is_contact_public` | tinyint | NOT NULL, DEFAULT 0 | 联系方式是否公开：0=否, 1=是（高校默认1，非高校固定0） |
| `deal_count` | int | NOT NULL, DEFAULT 0 | 累计成单量（冗余统计字段） |
| `review_score` | decimal(3,2) | NOT NULL, DEFAULT 0.00 | 综合评分（冗余统计字段） |
| `review_count` | int | NOT NULL, DEFAULT 0 | 评价总数（冗余统计字段） |
| `draft_expire_at` | datetime | | 草稿过期时间（创建后 48 小时） |
| `verified_at` | datetime | | 审核通过时间 |
| `created_at` | datetime | NOT NULL | 创建时间 |
| `updated_at` | datetime | NOT NULL | 更新时间 |

**索引：**

| 索引名 | 字段 | 类型 |
|--------|------|------|
| `idx_org_user_id` | `user_id` | UNIQUE |
| `idx_org_status` | `status` | 普通 |
| `idx_org_type` | `org_type` | 普通 |
| `idx_org_province_city` | `province_code, city_code` | 联合 |
| `idx_org_qualification` | `qualification_level` | 普通 |
| `idx_org_exposure_weight` | `exposure_weight` | 普通 |

### 4.2 organization_certifications（机构资质表）

> 存储机构入驻/资质升级时提交的各类资质文件。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | int | PK, AUTO_INCREMENT | 主键 |
| `org_id` | int | NOT NULL | 关联机构 ID |
| `cert_type` | tinyint | NOT NULL | 资质类型：1=营业执照, 2=行业认证, 3=授课案例, 4=合作企业证明, 5=其他资质 |
| `file_name` | varchar(200) | NOT NULL | 文件原始名称 |
| `file_url` | varchar(500) | NOT NULL | 文件存储 URL |
| `file_type` | varchar(20) | | 文件格式（docx/pdf/ppt/jpg/png） |
| `file_size` | bigint | | 文件大小（字节） |
| `description` | varchar(500) | | 资质说明 |
| `review_status` | tinyint | NOT NULL, DEFAULT 0 | 审核状态：0=待审核, 1=审核通过, 2=审核驳回 |
| `reviewer_id` | int | | 审核人 ID |
| `reviewed_at` | datetime | | 审核时间 |
| `reject_reason` | varchar(500) | | 驳回原因 |
| `created_at` | datetime | NOT NULL | 创建时间 |
| `updated_at` | datetime | NOT NULL | 更新时间 |

**索引：**

| 索引名 | 字段 | 类型 |
|--------|------|------|
| `idx_cert_org_id` | `org_id` | 普通 |
| `idx_cert_type` | `org_id, cert_type` | 联合 |
| `idx_cert_review_status` | `review_status` | 普通 |

### 4.3 organization_trainers（机构-讲师关系表）

> 管理机构旗下讲师绑定关系，一个讲师可属于多个机构。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | int | PK, AUTO_INCREMENT | 主键 |
| `org_id` | int | NOT NULL | 关联机构 ID |
| `trainer_id` | int | NOT NULL | 关联讲师 ID（讲师表主键） |
| `display_name` | varchar(100) | | 在该机构下的展示名称（为空则用讲师原名） |
| `title` | varchar(200) | | 在该机构下的头衔 |
| `specialty` | varchar(500) | | 擅长领域描述 |
| `category` | varchar(100) | | 机构内部分类（如按领域/等级） |
| `tags` | varchar(500) | | 标签，逗号分隔 |
| `sort_order` | int | NOT NULL, DEFAULT 0 | 排序序号（越小越靠前） |
| `status` | tinyint | NOT NULL, DEFAULT 1 | 状态：0=已解绑, 1=正常 |
| `bound_at` | datetime | | 绑定时间 |
| `created_at` | datetime | NOT NULL | 创建时间 |
| `updated_at` | datetime | NOT NULL | 更新时间 |

**索引：**

| 索引名 | 字段 | 类型 |
|--------|------|------|
| `idx_ot_org_id` | `org_id` | 普通 |
| `idx_ot_trainer_id` | `trainer_id` | 普通 |
| `idx_ot_org_trainer` | `org_id, trainer_id` | UNIQUE |
| `idx_ot_status` | `status` | 普通 |

### 4.4 organization_cooperation_cases（机构合作案例表）

> 存储机构的合作案例与授课成果，展示在机构主页。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | int | PK, AUTO_INCREMENT | 主键 |
| `org_id` | int | NOT NULL | 关联机构 ID |
| `title` | varchar(200) | NOT NULL | 案例标题 |
| `client_company` | varchar(200) | | 合作企业名称 |
| `training_field` | varchar(100) | | 培训领域 |
| `description` | text | | 案例描述（富文本） |
| `cover_url` | varchar(500) | | 案例封面图 URL |
| `review_status` | tinyint | NOT NULL, DEFAULT 0 | 审核状态：0=待审核, 1=审核通过, 2=审核驳回 |
| `reviewer_id` | int | | 审核人 ID |
| `reviewed_at` | datetime | | 审核时间 |
| `reject_reason` | varchar(500) | | 驳回原因 |
| `sort_order` | int | NOT NULL, DEFAULT 0 | 排序序号 |
| `is_visible` | tinyint | NOT NULL, DEFAULT 1 | 是否展示：0=隐藏, 1=展示 |
| `created_at` | datetime | NOT NULL | 创建时间 |
| `updated_at` | datetime | NOT NULL | 更新时间 |

**索引：**

| 索引名 | 字段 | 类型 |
|--------|------|------|
| `idx_case_org_id` | `org_id` | 普通 |
| `idx_case_review_status` | `review_status` | 普通 |

### 4.5 organization_review_stats（机构课程评分统计表）

> 机构维度的评分统计（定时任务或事件驱动聚合）。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | int | PK, AUTO_INCREMENT | 主键 |
| `org_id` | int | NOT NULL | 关联机构 ID |
| `overall_score` | decimal(3,2) | NOT NULL, DEFAULT 0.00 | 综合评分 |
| `quality_score` | decimal(3,2) | NOT NULL, DEFAULT 0.00 | 课程质量评分 |
| `service_score` | decimal(3,2) | NOT NULL, DEFAULT 0.00 | 服务质量评分 |
| `venue_score` | decimal(3,2) | NOT NULL, DEFAULT 0.00 | 场地评分 |
| `good_count` | int | NOT NULL, DEFAULT 0 | 好评数 |
| `medium_count` | int | NOT NULL, DEFAULT 0 | 中评数 |
| `bad_count` | int | NOT NULL, DEFAULT 0 | 差评数 |
| `total_count` | int | NOT NULL, DEFAULT 0 | 评价总数 |
| `good_rate` | decimal(5,2) | NOT NULL, DEFAULT 0.00 | 好评率（百分比） |
| `created_at` | datetime | NOT NULL | 创建时间 |
| `updated_at` | datetime | NOT NULL | 更新时间 |

**索引：**

| 索引名 | 字段 | 类型 |
|--------|------|------|
| `idx_rs_org_id` | `org_id` | UNIQUE |

### 4.6 organization_settlements（机构结算记录表）

> 记录机构的收益结算与提现申请。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| `id` | int | PK, AUTO_INCREMENT | 主键 |
| `org_id` | int | NOT NULL | 关联机构 ID |
| `settlement_no` | varchar(64) | NOT NULL | 结算单号 |
| `settlement_type` | tinyint | NOT NULL | 结算类型：1=在线课收益, 2=公开课收益, 3=内训课收益 |
| `amount` | decimal(12,2) | NOT NULL | 结算金额 |
| `status` | tinyint | NOT NULL, DEFAULT 0 | 状态：0=待审核, 1=审核通过, 2=已打款, 3=审核驳回 |
| `bank_account_name` | varchar(200) | | 收款账户名称 |
| `bank_account_no` | varchar(50) | | 收款银行账号 |
| `bank_name` | varchar(200) | | 开户银行名称 |
| `reviewer_id` | int | | 审核人 ID |
| `reviewed_at` | datetime | | 审核时间 |
| `paid_at` | datetime | | 打款时间 |
| `reject_reason` | varchar(500) | | 驳回原因 |
| `remark` | varchar(500) | | 备注 |
| `created_at` | datetime | NOT NULL | 创建时间 |
| `updated_at` | datetime | NOT NULL | 更新时间 |

**索引：**

| 索引名 | 字段 | 类型 |
|--------|------|------|
| `idx_settle_org_id` | `org_id` | 普通 |
| `idx_settle_no` | `settlement_no` | UNIQUE |
| `idx_settle_status` | `status` | 普通 |
| `idx_settle_created` | `created_at` | 普通 |

---

## 5. 旧表映射参考

| 旧表 | 新表 | 说明 |
|------|------|------|
| `tk_member`（groupid=3） | `users` + `organizations` | 旧系统机构复用 member 表（groupid=3），新系统拆分为用户表 + 机构专属表 |
| `tk_member_org` | `organization_trainers` | 旧系统的机构成员信息，新系统通过机构-讲师关系表管理 |
| `tk_company_course_score` | `organization_review_stats` | 机构课程评分统计 |
| `tk_company_demand` | 归入统一的咨询/需求模块 | 机构咨询信息，不再单独建机构需求表 |
| `tk_company_recommend` | 归入统一的推荐/运营模块 | 机构推荐记录 |

---

## 6. 接口契约（REST API）

### 6.1 机构入驻

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/organizations/apply` | 提交入驻申请（含草稿保存） |
| PUT | `/api/v1/organizations/apply` | 更新入驻申请草稿 |
| GET | `/api/v1/organizations/apply/draft` | 获取当前用户的入驻草稿 |
| POST | `/api/v1/organizations/{id}/upgrade` | 提交资质升级申请 |

### 6.2 机构主页管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/organizations/{id}` | 获取机构详情（公开信息） |
| PUT | `/api/v1/organizations/{id}` | 编辑机构基础信息 |
| PUT | `/api/v1/organizations/{id}/avatar` | 更新机构头像 |
| GET | `/api/v1/organizations/{id}/stats` | 获取机构运营数据统计 |

### 6.3 师资团队管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/organizations/{id}/trainers` | 获取机构旗下讲师列表（分页） |
| POST | `/api/v1/organizations/{id}/trainers` | 添加讲师到机构 |
| PUT | `/api/v1/organizations/{orgId}/trainers/{trainerId}` | 编辑机构下讲师信息 |
| DELETE | `/api/v1/organizations/{orgId}/trainers/{trainerId}` | 解绑讲师 |

### 6.4 合作案例管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/organizations/{id}/cases` | 获取合作案例列表（分页） |
| POST | `/api/v1/organizations/{id}/cases` | 新增合作案例 |
| PUT | `/api/v1/organizations/{orgId}/cases/{caseId}` | 编辑合作案例 |
| DELETE | `/api/v1/organizations/{orgId}/cases/{caseId}` | 删除合作案例 |

### 6.5 资质管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/organizations/{id}/certifications` | 获取资质列表 |
| POST | `/api/v1/organizations/{id}/certifications` | 上传资质文件 |
| DELETE | `/api/v1/organizations/{orgId}/certifications/{certId}` | 删除资质文件 |

### 6.6 公开课状态管理

| 方法 | 路径 | 说明 |
|------|------|------|
| PUT | `/api/v1/organizations/{orgId}/open-courses/{courseId}/status` | 更新公开课状态（ENROLLING/CONFIRMED/CANCELLED） |
| GET | `/api/v1/organizations/{orgId}/open-courses/{courseId}/enrollment-stats` | 获取公开课报名统计（人数/预约数/剩余名额） |

### 6.7 收益与结算

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/organizations/{id}/revenue/summary` | 获取收益概览（累计/按月） |
| GET | `/api/v1/organizations/{id}/revenue/details` | 获取收益明细（分页，支持按课程/时间筛选） |
| POST | `/api/v1/organizations/{id}/settlements` | 提交提现申请 |
| GET | `/api/v1/organizations/{id}/settlements` | 获取结算记录列表（分页） |

### 6.8 后台审核接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/admin/organizations/pending` | 获取待审核机构列表 |
| PUT | `/api/v1/admin/organizations/{id}/review` | 审核机构入驻（通过/驳回） |
| GET | `/api/v1/admin/organizations/certifications/pending` | 获取待审核资质列表 |
| PUT | `/api/v1/admin/organizations/certifications/{id}/review` | 审核资质（通过/驳回） |
| GET | `/api/v1/admin/organizations/cases/pending` | 获取待审核案例列表 |
| PUT | `/api/v1/admin/organizations/cases/{id}/review` | 审核案例（通过/驳回） |

### 6.9 公开搜索/列表接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/organizations` | 机构列表（分页，支持按领域/地区/资质筛选） |
| GET | `/api/v1/organizations/{id}/public` | 机构公开主页详情（含讲师列表、案例、评分） |

---

## 7. 业务规则与约束

### 7.1 入驻与审核

1. 一个用户只能创建一个机构（`user_id` 唯一约束）
2. 入驻草稿超过 48 小时未提交审核，系统定时任务自动删除（`status=0` 且 `draft_expire_at < now()`）
3. 审核驳回后可重新编辑并再次提交
4. 企业实名认证是入驻前置条件
5. 高校机构（`org_type=1`）联系方式默认公开（`is_contact_public=1`），非高校机构强制为 0

### 7.2 师资团队

1. 同一讲师可被多个机构绑定（多对多关系，但关系表保证 `org_id + trainer_id` 唯一）
2. 机构可在讲师授权范围内编辑讲师部分信息
3. 解绑讲师为逻辑删除（`status=0`），保留历史数据

### 7.3 公开课状态

1. 状态流转规则：`招生中` → `确认开课` 或 `已取消`；`确认开课` → `已取消`
2. 状态回退限制：`已取消` 状态不可回退到其他状态
3. 状态变更须触发消息通知（向已预约用户推送）
4. 仅 `确认开课` 状态才能接受下单支付

### 7.4 收益与结算

1. 提现申请需关联企业公户银行信息
2. 平台审核通过后完成打款，全程有状态追踪
3. 收益明细支持按课程类型（在线课/公开课/内训课）和时间维度筛选

### 7.5 数据安全

1. 非高校机构的联系电话、邮箱等敏感信息对甲方用户不可见
2. 营业执照等资质文件 URL 使用带时效的签名链接，不直接暴露存储路径
3. 关键操作（课程上下架、状态变更）需后台客服二次确认

---

## 附录 A: 状态枚举汇总

### 机构入驻状态（organizations.status）

| 值 | 常量 | 说明 |
|----|------|------|
| 0 | `DRAFT` | 草稿（未提交） |
| 1 | `PENDING_REVIEW` | 待审核 |
| 2 | `APPROVED` | 审核通过 |
| 3 | `REJECTED` | 审核驳回 |
| 4 | `FROZEN` | 已冻结 |

### 资质类型（organization_certifications.cert_type）

| 值 | 常量 | 说明 |
|----|------|------|
| 1 | `BUSINESS_LICENSE` | 营业执照 |
| 2 | `INDUSTRY_CERT` | 行业认证 |
| 3 | `TEACHING_CASE` | 授课案例 |
| 4 | `COOPERATION_PROOF` | 合作企业证明 |
| 5 | `OTHER` | 其他资质 |

### 机构类型（organizations.org_type）

| 值 | 常量 | 说明 |
|----|------|------|
| 0 | `GENERAL` | 普通机构（非高校） |
| 1 | `UNIVERSITY` | 高校 |

### 资质等级（organizations.qualification_level）

| 值 | 常量 | 说明 |
|----|------|------|
| 1 | `BASIC` | 基础 |
| 2 | `INTERMEDIATE` | 中级 |
| 3 | `ADVANCED` | 高级 |

### 公开课状态

| 值 | 常量 | 说明 |
|----|------|------|
| 1 | `ENROLLING` | 招生中 |
| 2 | `CONFIRMED` | 确认开课 |
| 3 | `CANCELLED` | 已取消 |

### 结算状态（organization_settlements.status）

| 值 | 常量 | 说明 |
|----|------|------|
| 0 | `PENDING_REVIEW` | 待审核 |
| 1 | `APPROVED` | 审核通过 |
| 2 | `PAID` | 已打款 |
| 3 | `REJECTED` | 审核驳回 |

---

## 附录 B: 与其他模块的关联关系

```
users (用户表)
  └── organizations (机构主表)           via user_id
        ├── organization_certifications  via org_id    资质文件
        ├── organization_trainers        via org_id    旗下讲师
        │     └── trainers (讲师表)      via trainer_id
        ├── organization_cooperation_cases via org_id  合作案例
        ├── organization_review_stats    via org_id    评分统计
        ├── organization_settlements     via org_id    结算记录
        ├── courses (课程表)             via org_id    机构发布的课程
        └── open_courses (公开课表)      via org_id    机构排课的公开课
```

### 跨模块依赖

| 依赖模块 | 关联说明 |
|----------|----------|
| 用户模块 | `organizations.user_id` → `users.id`，机构通过用户注册后创建 |
| 讲师模块 | `organization_trainers.trainer_id` → `trainers.id`，机构绑定讲师 |
| 课程模块 | 在线课/内训课/版权课均通过 `org_id` 关联到机构 |
| 公开课模块 | 公开课通过 `org_id` 关联，机构控制排课与状态 |
| 订单模块 | 公开课/在线课订单关联机构 ID 用于收益结算 |
| 评价模块 | 甲方对机构/课程的评价聚合至 `organization_review_stats` |
| 消息模块 | 审核结果通知、公开课状态变更通知、会务提醒 |
