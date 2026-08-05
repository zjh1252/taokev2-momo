# 淘课联盟 · 推广大使与 721 讲师合作入驻设计

日期：2026-07-14  
来源：`docs/tmp/7.13新淘课网协议.pdf` + 同构扩展自 [2026-07-13-alliance-partner-design.md](./2026-07-13-alliance-partner-design.md)

## 背景

培训合伙人闭环已落地。C 端「推广大使」「721讲师合作」仍为写死页（按钮 TODO）；Admin 对应菜单为「功能建设中」占位。本期按合伙人同构补齐完整闭环。

## 范围

### 本期做

1. **推广大使**：协议沿用现页 9 条；一键同意提交；生成 `ambassador_code`；pending 状态页；Admin 列表审核；站内信。
2. **721 讲师合作**：补全协议全文（去掉「更多条款」）；表单字段落库；画布签字上传；仅 ACTIVE 专家可申请；直接提交进 pending；Admin 列表审核（详情含签字图）；站内信。
3. **后端**：两张独立申请表 + C/Admin API（逻辑在 `taoke-user`，Admin 薄编排）。
4. **权限**：`alliance:ambassador:audit`、`alliance:lecturer721:audit`，挂到 `PLATFORM_AUDITOR`。

### 本期不做

- 支付、开票、审核通过后发放业务角色 / 开通培训宝权益
- 协议 CMS 化
- 721「保存并预览」两步流（改为直接提交）
- 改动已有培训合伙人实现

## 方案选择

两套独立申请表，同构复制合伙人模式。拒绝多态单表与把大使塞进平台 Role。

## 已锁定决策

| 项 | 决策 |
|----|------|
| 闭环深度 | 协议+提交 → pending → Admin 通过/驳回 → 站内信 |
| 大使表单 | 无业务字段，仅 `agreementSigned` |
| 721 签字 | canvas 手写 → `POST /uploads/images` → 存 `signature_url` |
| 721 申请人 | 仅 ACTIVE `TRAINER`；非专家引导入驻 |
| 721 提交 | 按钮「提交申请」，直接入库跳 pending |
| 编号 | 大使 `AMB_`、721 `L721_` + `yyyyMMddHHmmss` + 零填充 6 位 `userId` |
| 状态 | `1` 待审 / `2` 通过 / `3` 驳回；驳回重提新建记录；已通过不可再申 |

## 数据模型

### `alliance_ambassador_applications`

| 字段 | 说明 |
|------|------|
| `id` | 自增主键 |
| `user_id` | 申请人，索引 |
| `ambassador_code` | 甲方编号，唯一 |
| `agreement_version` | 默认 `v1` |
| `status` | 1/2/3 |
| `reject_reason` / `reviewed_at` / `reviewed_by` | 审核字段 |
| `created_at` / `updated_at` | 时间戳 |

### `alliance_lecturer721_applications`

| 字段 | 说明 |
|------|------|
| `id` | 自增主键 |
| `user_id` | 申请人，索引 |
| `application_code` | 申请编号 `L721_...`，唯一 |
| `lecturer_name` | 讲师姓名 |
| `id_card_no` | 身份证号 |
| `coop_years` | 合作年限 1/2/3（`TINYINT(2)`） |
| `daily_fee` | 课酬元/天（字符串或 decimal，与表单一致用 `VARCHAR(32)` 存展示值亦可；推荐 `DECIMAL(12,2)`） |
| `address` / `phone` / `wechat` / `email` | 联系信息 |
| `bank_name` / `bank_account` | 开户银行与账号 |
| `signature_url` | 签字图片 URL |
| `agreement_version` | 默认 `v1` |
| `status` / 审核字段 / 时间戳 | 同大使 |

Flyway：`V144__alliance_ambassador_lecturer721_applications.sql`（若仓库已有更高版本则用 max+1），并跑 `_validate_flyway_migration.py`。

`daily_fee` 定稿为 `DECIMAL(12,2) NOT NULL`。

## API

### 推广大使（登录即可）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/alliance/ambassadors/me/application` | 最新一条；无则 data null |
| `POST` | `/alliance/ambassadors/me/application` | `agreementSigned` 必须 true |

Admin（`@RequirePermission("alliance:ambassador:audit")`）：

| 方法 | 路径 |
|------|------|
| `GET` | `/admin/alliance/ambassadors/applications` |
| `GET` | `/admin/alliance/ambassadors/applications/{id}` |
| `PUT` | `/admin/alliance/ambassadors/applications/{id}/approve` |
| `PUT` | `/admin/alliance/ambassadors/applications/{id}/reject` body `{ "reason" }` |

### 721（GET 登录即可；POST 校验 ACTIVE TRAINER）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/alliance/lecturers721/me/application` | 最新一条；无则 null |
| `POST` | `/alliance/lecturers721/me/application` | 表单字段 + `signatureUrl` + `agreementSigned` |

Admin（`alliance:lecturer721:audit`）：路径前缀 `/admin/alliance/lecturers721/applications`，同形 list/detail/approve/reject。

通知：`APPLY_PASSED` / `APPLY_REJECTED`，`roleName` 分别为「推广大使」「721讲师合作」；发送失败只记日志不回滚审核。

`taoke-admin` 只调 `taoke-user` api，不注入 Repository。

## C 端交互

### 路由

| 路径 | 用途 |
|------|------|
| `/dashboard/alliance/ambassador` | 协议 + 一键申请 |
| `/dashboard/alliance/ambassador/pending` | 状态页 |
| `/dashboard/alliance/721` | 协议 + 表单 + 签字 |
| `/dashboard/alliance/721/pending` | 状态页 |

进入申请页逻辑（两者同构）：

1. GET me/application
2. `status=1|2` → redirect pending
3. `status=3` → 留在申请页，可展示 `rejectReason` 并重提
4. 无记录 → 空状态可申请

甲方/申请编号：提交前显示「提交后自动生成」；pending/已通过展示真实 code。

### 推广大使

- 协议：现页 9 条全文，乙方固定「上海淘课企业管理咨询有限公司」
- 按钮：「本人同意上述协议并自愿申请成为推广大使」→ POST → pending

### 721

- 非 ACTIVE 专家：不展示可提交表单，提示引导专家入驻
- 协议：现有要点/期限/结算基础上补质量五包、双方义务、保密、违约、其他；去掉「更多条款」。PDF 暂缺时按此结构补齐，后续可替换文案
- 表单必填：讲师姓名、身份证号、合作年限、课酬、地址、手机、微信、Email、开户银行、账号、签字
- 签字：canvas → blob → 现有 `uploadImage`（`/uploads/images`）→ `signatureUrl`
- 按钮文案改为「提交申请」；成功 `router.push` pending

## Admin 交互

| 子菜单 | 路由 | 本期 |
|--------|------|------|
| 推广大使 | `/dashboard/contracts/ambassador` | 完整列表审核 |
| 培训合伙人 | `/dashboard/contracts/partners` | 已有，不动 |
| 721讲师合作 | `/dashboard/contracts/721` | 完整列表审核 |

Feature 目录：

- `admin-frontend/src/features/alliance-ambassadors/**`
- `admin-frontend/src/features/alliance-lecturers721/**`
- BFF 对齐合伙人：`src/app/api/alliance/ambassadors/**`、`.../lecturers721/**`

列表：状态筛、分页、详情/通过/驳回；721 详情展示签字图。

## 错误处理

- 表单校验失败：字段级提示
- 重复待审 / 已通过再申请：业务错误 + toast
- 721 非专家提交：业务错误
- 驳回原因为空：前后端双检
- 通知失败：只日志，不回滚审核

## 测试与验证

1. 后端单测：大使/721 提交校验、重复待审、驳回重提、approve/reject、721 非专家拒绝、通知变量
2. Flyway：`uv run python data-trans/scripts/_validate_flyway_migration.py --version 144`
3. `frontend`：`pnpm lint`；手测大使一键申请、721 签字上传与专家拦截
4. `admin-frontend`：`bun lint`；两列表筛选与三按钮
5. 后端改动后：`mvn -pl taoke-user,taoke-admin,taoke-app -am install -DskipTests` 再重启，避免本地旧 JAR

## 后续（非本期）

权益开通、角色发放、协议 CMS、721 预览流（若产品需要）。
