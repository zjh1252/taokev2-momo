# 淘课联盟 · 培训合伙人入驻与合约审核设计

日期：2026-07-13  
来源：`docs/tmp/7.13新淘课网协议.pdf`（本期仅落地「培训合伙人」闭环；推广大使 / 721 菜单占位，后续同构扩展）

## 背景

C 端 `/dashboard/alliance/partner` 协议文案不完整、省市区不可选、提交未接 API；Admin「合约管理」为占位页。PDF 要求补全老站培训合伙人协议、打通申请→审核中页→后台审核→站内信闭环。

## 范围

### 本期做

1. **协议全文**：按 PDF 补全九章（合作要点→其他），去掉「更多条款」占位。
2. **申请表单**：仅「公司」身份；省/市复用现有地区组件；字段与现页一致并落库。
3. **甲方编号**：提交时生成 `partner_code`，格式固定为 `TPC_` + `yyyyMMddHHmmss` + 零填充 6 位 `userId`（例：`TPC_20260713153000_000042`），表内唯一。
4. **状态页**：`/dashboard/alliance/partner/pending`，提交后路由跳转（非弹窗）。
5. **后端**：`alliance_partner_applications` 表 + C 端/Admin API（逻辑在 `taoke-user`，Admin 薄编排）。
6. **Admin**：合约管理改为折叠菜单；「培训合伙人」完整列表（详情/通过/驳回）；大使与 721 子项占位。
7. **通知**：复用 `APPLY_PASSED` / `APPLY_REJECTED`，`roleName=培训合伙人`，站内信 zh-CN。

### 本期不做

- 一次性加盟费 980 元支付与开票
- 审核通过后发放平台业务角色 / 开通培训宝权益
- 推广大使、721 讲师合作的协议补全与申请 API（仅菜单占位）
- 协议 CMS 化与可运营改版

## 方案选择

独立申请表（非平台 Role）。拒绝把合伙人塞进现有角色申请或本期上 CMS。

## 数据模型

表：`alliance_partner_applications`

| 字段 | 说明 |
|------|------|
| `id` | 自增主键 |
| `user_id` | 申请人，索引 |
| `partner_code` | 甲方编号，提交时生成，唯一 |
| `contact_name` | 联系人名字 |
| `company_name` | 公司名称 |
| `company_phone` | 公司电话 |
| `company_email` | 公司邮箱 |
| `province_id` / `city_id` | 公司所在地 |
| `legal_person` | 公司法人 |
| `legal_id_card` | 法人身份证 |
| `contact_qq` | 联系人 QQ |
| `agreement_version` | 默认 `v1` |
| `status` | **本表专用**：`1` 待审核 / `2` 已通过 / `3` 已驳回（勿与部分角色申请「1=已通过」混用） |
| `reject_reason` | 驳回原因，可空 |
| `reviewed_at` / `reviewed_by` | 审核时间与管理员用户 ID |
| `created_at` / `updated_at` | 时间戳 |

Flyway：下一版本号（当前仓库最新为 V141，实现时用 `V142__...` 或当时最大+1），并跑 `_validate_flyway_migration.py`。

### 状态规则

- 已有 `status=1`：禁止再提交。
- `status=3`：允许重新提交，**新建记录**保留审计轨迹。
- `status=2`：禁止再申请。
- 无支付字段；通过不写角色表。

## API

### C 端（登录即可）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/alliance/partners/me/application` | 当前用户**最新一条**申请；无则 data 为 null |
| `POST` | `/alliance/partners/me/application` | 提交；`agreementSigned` 必须为 true |

POST body：`contactName`、`companyName`、`companyPhone`、`companyEmail`、`provinceId`、`cityId`、`legalPerson`、`legalIdCard`、`contactQq`、`agreementSigned`、`agreementVersion`。

### Admin（`@RequirePermission("alliance:partner:audit")`；Flyway 种子写入该权限并挂到 `SUPER_ADMIN` / 既有运营审核角色，写法对齐现有 admin 权限迁移）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/admin/alliance/partners/applications` | 分页，可选 `status` |
| `GET` | `/admin/alliance/partners/applications/{id}` | 详情 |
| `PUT` | `/admin/alliance/partners/applications/{id}/approve` | 仅待审核 → 已通过 |
| `PUT` | `/admin/alliance/partners/applications/{id}/reject` | body `{ "reason": "..." }`，原因必填 |

审核后：`NotificationTemplateService.renderTemplate` + `NotificationService.send`，变量 `roleName` / `reason`。

`taoke-admin` 只调 `taoke-user` 的 api 接口，不注入 Repository。

## C 端交互

### 路由

- `/dashboard/alliance/partner`：协议 + 表单
- `/dashboard/alliance/partner/pending`：状态页

### `partner` 进入逻辑

1. `GET me/application`
2. `status=1` 或 `2` → 重定向 `pending`
3. `status=3` → 留在表单，可展示上次 `rejectReason`，允许重提
4. 无记录 → 空表单

### 协议与表单

- 协议九章全文来自 PDF；乙方固定「上海淘课企业管理咨询有限公司」
- 提交前协议头甲方展示「提交后自动生成」；pending/已通过展示真实 `partnerCode`
- 身份仅「公司」；省市使用 `frontend/src/components/region-cascader`，只采集 `provinceId` + `cityId`（不采集区县）
- 提交成功 → `router.push` 到 `pending`

### `pending`

- 待审核 / 已通过 / 已驳回文案区分；驳回提供返回修改链接
- 侧栏「培训合伙人」保持激活

## Admin 交互

导航：「合约管理」折叠为三子项：

| 子菜单 | 路由 | 本期 |
|--------|------|------|
| 推广大使 | `/dashboard/contracts/ambassador` | 占位 |
| 培训合伙人 | `/dashboard/contracts/partners` | 完整功能 |
| 721 讲师合作 | `/dashboard/contracts/721` | 占位 |

`/dashboard/contracts` → redirect 到 `partners`。

合伙人列表：沿用申请表格模式；操作列详情 / 通过 / 驳回；非待审核操作返回业务错误并由 UI 提示。

## 错误处理

- 表单校验失败：字段级提示
- 重复待审 / 已通过再申请：后端业务错误码 + 前端 toast
- 驳回原因为空：前后端双检
- 通知发送失败：只记日志，**不回滚**已成功的审核状态变更

## 测试与验证

1. 后端：提交校验、重复待审、驳回后新建再提、approve/reject 迁移、通知模板变量渲染（单测优先 Service）。
2. Flyway：`uv run python data-trans/scripts/_validate_flyway_migration.py --version <N>`。
3. `frontend`：`pnpm lint`；必要时页面手测协议滚动、省市、提交跳转。
4. `admin-frontend`：`bun lint`；列表筛选与三按钮。

## 后续（非本期）

同构扩展推广大使、721：独立申请表 + 合约管理子菜单接真实列表；协议全文按 PDF/老站补齐；支付与权益开通另开变更。
