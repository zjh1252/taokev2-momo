# 培训合伙人入驻与合约审核 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补全培训合伙人协议与申请闭环：C 端提交申请 → pending 状态页；Admin「合约管理 → 培训合伙人」审核并通过站内信通知。

**Architecture:** 在 `taoke-user` 新增独立表 `alliance_partner_applications` 与 Service/API；C 端登录用户提交；`taoke-admin` 薄编排审核接口；通知复用 `APPLY_PASSED` / `APPLY_REJECTED` 模板。大使/721 仅 Admin 菜单占位。

**Tech Stack:** Java 21 / Spring Boot 3.5 / JPA / Flyway；Next.js 16（frontend pnpm、admin-frontend bun）；React Query + nuqs（admin）

**Spec:** `docs/superpowers/specs/2026-07-13-alliance-partner-design.md`

## Global Constraints

- 状态：`1` 待审核 / `2` 已通过 / `3` 已驳回（本表专用）
- `partner_code`：`TPC_` + `yyyyMMddHHmmss` + 零填充 6 位 `userId`
- 驳回后重提：**新建记录**；已通过不可再申请；已有待审不可再提交
- 本期无加盟费支付、不发业务角色
- Admin 权限码：`alliance:partner:audit`；`SUPER_ADMIN` 天然绕过
- 通知失败只打日志，不回滚审核状态
- 注释中文；类 JavaDoc `@author Fangxinxin` + `@date`
- **禁止**全量无关 `mvn`；验证用模块范围命令；新增 Flyway 后必须跑 `_validate_flyway_migration.py`

---

## File Map

| 路径 | 职责 |
|------|------|
| `backend/taoke-app/.../V142__alliance_partner_applications.sql` | 建表 + 权限种子 |
| `backend/taoke-user/.../entity/AlliancePartnerApplication.java` | 实体 |
| `backend/taoke-user/.../repository/AlliancePartnerApplicationRepository.java` | 仓储 |
| `backend/taoke-user/.../dto/alliance/*` | 请求/响应 DTO |
| `backend/taoke-user/.../api/AlliancePartnerApplicationService.java` | 跨模块 API |
| `backend/taoke-user/.../service/AlliancePartnerApplicationServiceImpl.java` | 业务实现 |
| `backend/taoke-user/.../controller/AlliancePartnerController.java` | C 端 API |
| `backend/taoke-user/src/test/.../AlliancePartnerApplicationServiceImplTest.java` | 单测 |
| `backend/taoke-admin/.../controller/AdminAlliancePartnerController.java` | Admin API |
| `backend/taoke-admin/.../service/AdminAlliancePartnerService.java` | 薄编排 |
| `frontend/.../alliance/partner/*` | 协议全文、表单、pending |
| `frontend/.../features/alliance-partner/*` | API types/service |
| `admin-frontend/.../nav-config.ts` | 合约管理折叠菜单 |
| `admin-frontend/.../features/alliance-partners/*` | 列表与审核 UI |
| `admin-frontend/.../dashboard/contracts/**` | partners / ambassador / 721 路由 |

---

### Task 1: Flyway 建表与权限

**Files:**
- Create: `backend/taoke-app/src/main/resources/db/migration/V142__alliance_partner_applications.sql`
- （若仓库已有 ≥142，改用 `max+1` 版本号，全文替换本计划中的 142）

**Interfaces:**
- Produces: 表 `alliance_partner_applications`；权限 `alliance:partner:audit`；并挂到 `PLATFORM_AUDITOR`

- [ ] **Step 1: 写入迁移脚本**

```sql
-- V142: 培训合伙人申请表 + 合约审核权限
CREATE TABLE `alliance_partner_applications` (
    `id`                INT          NOT NULL AUTO_INCREMENT,
    `user_id`           INT          NOT NULL COMMENT '申请人用户 ID',
    `partner_code`      VARCHAR(64)  NOT NULL COMMENT '甲方编号 TPC_...',
    `contact_name`      VARCHAR(64)  NOT NULL COMMENT '联系人名字',
    `company_name`      VARCHAR(128) NOT NULL COMMENT '公司名称',
    `company_phone`     VARCHAR(32)  NOT NULL COMMENT '公司电话',
    `company_email`     VARCHAR(128) NOT NULL COMMENT '公司邮箱',
    `province_id`       INT          NOT NULL DEFAULT 0 COMMENT '省份 ID',
    `city_id`           INT          NOT NULL DEFAULT 0 COMMENT '城市 ID',
    `legal_person`      VARCHAR(64)  NOT NULL COMMENT '公司法人',
    `legal_id_card`     VARCHAR(32)  NOT NULL COMMENT '法人身份证',
    `contact_qq`        VARCHAR(32)  NULL COMMENT '联系人 QQ',
    `agreement_version` VARCHAR(32)  NOT NULL DEFAULT 'v1' COMMENT '协议版本',
    `status`            TINYINT(2)   NOT NULL DEFAULT 1 COMMENT '1待审核 2已通过 3已驳回',
    `reject_reason`     VARCHAR(512) NULL COMMENT '驳回原因',
    `reviewed_at`       DATETIME     NULL COMMENT '审核时间',
    `reviewed_by`       INT          NULL COMMENT '审核人用户 ID',
    `created_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_partner_code` (`partner_code`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_status_created` (`status`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='培训合伙人申请';

INSERT INTO `sys_permissions` (`permission_code`, `permission_name`, `module`, `action_type`, `parent_id`, `sort_order`, `description`)
VALUES ('alliance:partner:audit', '审核培训合伙人申请', 'alliance', 'REVIEW', 0, 700, '合约管理-培训合伙人通过/驳回');

INSERT INTO `sys_role_permissions` (`role_id`, `permission_id`, `created_at`)
SELECT
    (SELECT `id` FROM `sys_roles` WHERE `role_code` = 'PLATFORM_AUDITOR'),
    (SELECT `id` FROM `sys_permissions` WHERE `permission_code` = 'alliance:partner:audit'),
    NOW();
```

- [ ] **Step 2: Flyway 自检**

Run: `uv run python data-trans/scripts/_validate_flyway_migration.py --version 142`  
Expected: 通过（无 checksum/语法风险报错）

- [ ] **Step 3: Commit**

```bash
git add backend/taoke-app/src/main/resources/db/migration/V142__alliance_partner_applications.sql
git commit -m "$(cat <<'EOF'
feat(db): add alliance partner applications table and audit permission

EOF
)"
```

---

### Task 2: Entity / Repository / DTO / Service API（TDD）

**Files:**
- Create: `backend/taoke-user/src/main/java/com/taoke/user/entity/AlliancePartnerApplication.java`
- Create: `backend/taoke-user/src/main/java/com/taoke/user/repository/AlliancePartnerApplicationRepository.java`
- Create: `backend/taoke-user/src/main/java/com/taoke/user/dto/alliance/AlliancePartnerApplyRequest.java`
- Create: `backend/taoke-user/src/main/java/com/taoke/user/dto/alliance/AlliancePartnerApplicationResponse.java`
- Create: `backend/taoke-user/src/main/java/com/taoke/user/api/AlliancePartnerApplicationService.java`
- Create: `backend/taoke-user/src/main/java/com/taoke/user/service/AlliancePartnerApplicationServiceImpl.java`
- Create: `backend/taoke-user/src/test/java/com/taoke/user/service/AlliancePartnerApplicationServiceImplTest.java`

**Interfaces:**
- Produces:
  - `AlliancePartnerApplicationResponse getLatestByUserId(Integer userId)`
  - `AlliancePartnerApplicationResponse submit(Integer userId, AlliancePartnerApplyRequest request)`
  - `PageResult<AlliancePartnerApplicationResponse> pageForAdmin(Integer status, int page, int size)`
  - `AlliancePartnerApplicationResponse getById(Integer id)`
  - `void approve(Integer id, Integer reviewerUserId)`
  - `void reject(Integer id, Integer reviewerUserId, String reason)`
- Consumes: `AlliancePartnerApplicationRepository`；`NotificationTemplateService.renderTemplate`；`NotificationService.send`

- [ ] **Step 1: 写失败单测（核心规则）**

```java
@ExtendWith(MockitoExtension.class)
class AlliancePartnerApplicationServiceImplTest {

    @Mock AlliancePartnerApplicationRepository repository;
    @Mock NotificationTemplateService templateService;
    @Mock NotificationService notificationService;
    @InjectMocks AlliancePartnerApplicationServiceImpl service;

    @Test
    void submit_rejectsWhenPendingExists() {
        when(repository.findFirstByUserIdAndStatusOrderByIdDesc(1, 1))
                .thenReturn(Optional.of(new AlliancePartnerApplication()));
        AlliancePartnerApplyRequest req = validRequest();
        assertThrows(BusinessException.class, () -> service.submit(1, req));
    }

    @Test
    void submit_rejectsWhenAlreadyApproved() {
        when(repository.findFirstByUserIdAndStatusOrderByIdDesc(1, 1)).thenReturn(Optional.empty());
        when(repository.findFirstByUserIdAndStatusOrderByIdDesc(1, 2))
                .thenReturn(Optional.of(new AlliancePartnerApplication()));
        assertThrows(BusinessException.class, () -> service.submit(1, validRequest()));
    }

    @Test
    void submit_createsPendingWithPartnerCode() {
        when(repository.findFirstByUserIdAndStatusOrderByIdDesc(anyInt(), anyInt()))
                .thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(inv -> {
            AlliancePartnerApplication a = inv.getArgument(0);
            a.setId(10);
            return a;
        });
        var resp = service.submit(42, validRequest());
        assertEquals(1, resp.getStatus());
        assertTrue(resp.getPartnerCode().startsWith("TPC_"));
        assertTrue(resp.getPartnerCode().endsWith("000042"));
    }

    @Test
    void approve_sendsApplyPassed() {
        AlliancePartnerApplication app = pendingApp(5, 42);
        when(repository.findById(5)).thenReturn(Optional.of(app));
        when(templateService.renderTemplate(eq("APPLY_PASSED"), any()))
                .thenReturn(new NotificationTemplateService.RenderedTemplate("t", "c"));
        service.approve(5, 99);
        assertEquals(2, app.getStatus());
        verify(notificationService).send(eq(42), eq(NotificationType.APPLY_RESULT), any(), any(), any(), any());
    }

    // validRequest() / pendingApp() 辅助方法略：填满必填字段
}
```

（`RenderedTemplate` 若为 record/内部类，按 `NotificationTemplateService` 实际签名调整 import。）

- [ ] **Step 2: 运行确认失败**

Run（在 `backend/`）:
`mvn -pl taoke-user -am test -Dtest=AlliancePartnerApplicationServiceImplTest`

Expected: 编译失败或测试失败（类尚不存在）

- [ ] **Step 3: 实现 Entity + Repository + DTO + Service**

Entity 要点：
- `@Entity @Table(name = "alliance_partner_applications") @DynamicInsert @DynamicUpdate`
- 继承 `BaseEntity`
- 字段与迁移一致；`status` 用 `Integer`

Repository：
```java
public interface AlliancePartnerApplicationRepository extends JpaRepository<AlliancePartnerApplication, Integer> {
    Optional<AlliancePartnerApplication> findFirstByUserIdOrderByIdDesc(Integer userId);
    Optional<AlliancePartnerApplication> findFirstByUserIdAndStatusOrderByIdDesc(Integer userId, Integer status);
    Page<AlliancePartnerApplication> findByStatus(Integer status, Pageable pageable);
}
```

`submit` 逻辑：
1. `agreementSigned != true` → `BusinessException(ErrorCode.PARAM_INVALID, "请先勾选并同意协议")`
2. 已有 status=1 或 status=2 → 业务错误文案
3. 生成 `partnerCode`：`TPC_` + `DateTimeFormatter.ofPattern("yyyyMMddHHmmss").format(LocalDateTime.now())` + `String.format("%06d", userId)`
4. `status=1`，`agreementVersion` 默认 `v1`，save

`approve` / `reject`：
- 仅 `status==1` 可操作，否则抛错
- 更新 `reviewedAt` / `reviewedBy` / `status`（reject 写 `rejectReason`，blank 则 PARAM_INVALID）
- `renderTemplate("APPLY_PASSED"|"APPLY_REJECTED", Map.of("roleName","培训合伙人", "reason", reason))`
- `notificationService.send(userId, NotificationType.APPLY_RESULT, title, content, String.valueOf(id), null)`；外层 try/catch 只 `log.warn`

`getLatestByUserId`：`findFirstByUserIdOrderByIdDesc`，无则 null。

- [ ] **Step 4: 再跑测试通过**

Run: `mvn -pl taoke-user -am test -Dtest=AlliancePartnerApplicationServiceImplTest`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/taoke-user
git commit -m "$(cat <<'EOF'
feat(user): implement alliance partner application service

EOF
)"
```

---

### Task 3: C 端与 Admin Controllers

**Files:**
- Create: `backend/taoke-user/src/main/java/com/taoke/user/controller/AlliancePartnerController.java`
- Create: `backend/taoke-admin/src/main/java/com/taoke/admin/controller/AdminAlliancePartnerController.java`
- Create: `backend/taoke-admin/src/main/java/com/taoke/admin/service/AdminAlliancePartnerService.java`

**Interfaces:**
- Consumes: `AlliancePartnerApplicationService`
- Produces: HTTP 路由见 Spec §API

- [ ] **Step 1: C 端 Controller**

```java
@RestController
@RequiredArgsConstructor
@Tag(name = "淘课联盟-培训合伙人")
public class AlliancePartnerController {

    private final AlliancePartnerApplicationService alliancePartnerApplicationService;

    @GetMapping("/alliance/partners/me/application")
    public ApiResponse<AlliancePartnerApplicationResponse> myApplication() {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(alliancePartnerApplicationService.getLatestByUserId(userId));
    }

    @PostMapping("/alliance/partners/me/application")
    public ApiResponse<AlliancePartnerApplicationResponse> submit(
            @Valid @RequestBody AlliancePartnerApplyRequest request) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(alliancePartnerApplicationService.submit(userId, request));
    }
}
```

（无类级角色注解 → 登录即可，符合 Spec。）

- [ ] **Step 2: Admin 薄服务 + Controller**

```java
@RestController
@RequiredArgsConstructor
@Tag(name = "后台-培训合伙人")
public class AdminAlliancePartnerController {

    private final AdminAlliancePartnerService adminAlliancePartnerService;

    @GetMapping("/admin/alliance/partners/applications")
    @RequirePermission("alliance:partner:audit")
    public ApiResponse<PageResult<AlliancePartnerApplicationResponse>> list(
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(adminAlliancePartnerService.page(status, page, size));
    }

    @GetMapping("/admin/alliance/partners/applications/{id}")
    @RequirePermission("alliance:partner:audit")
    public ApiResponse<AlliancePartnerApplicationResponse> detail(@PathVariable Integer id) {
        return ApiResponse.ok(adminAlliancePartnerService.get(id));
    }

    @PutMapping("/admin/alliance/partners/applications/{id}/approve")
    @RequirePermission("alliance:partner:audit")
    public ApiResponse<Void> approve(@PathVariable Integer id) {
        adminAlliancePartnerService.approve(id);
        return ApiResponse.ok(null);
    }

    @PutMapping("/admin/alliance/partners/applications/{id}/reject")
    @RequirePermission("alliance:partner:audit")
    public ApiResponse<Void> reject(@PathVariable Integer id,
                                    @Valid @RequestBody RejectApplicationRequest request) {
        adminAlliancePartnerService.reject(id, request.getReason());
        return ApiResponse.ok(null);
    }
}
```

`AdminAlliancePartnerService`：注入 `AlliancePartnerApplicationService`，`approve/reject` 用 `SecurityUtils.getRequiredUserId()` 作为 `reviewedBy`。

- [ ] **Step 3: 编译自检**

Run: `mvn -pl taoke-app -am compile -DskipTests`（在 `backend/`）  
Expected: BUILD SUCCESS

- [ ] **Step 4: Commit**

```bash
git add backend/taoke-user backend/taoke-admin
git commit -m "$(cat <<'EOF'
feat(api): expose alliance partner apply and admin audit endpoints

EOF
)"
```

---

### Task 4: C 端协议全文 + 表单 + pending

**Files:**
- Create: `frontend/src/features/alliance-partner/api/types.ts`
- Create: `frontend/src/features/alliance-partner/api/service.ts`
- Create: `frontend/src/features/alliance-partner/components/partner-agreement-content.tsx`
- Create: `frontend/src/features/alliance-partner/components/partner-apply-form.tsx`
- Modify: `frontend/src/app/[locale]/(usercenter)/dashboard/alliance/partner/page.tsx`
- Create: `frontend/src/app/[locale]/(usercenter)/dashboard/alliance/partner/pending/page.tsx`
- Modify: `frontend/src/config/routes.ts` — 增加 `UC_ALLIANCE_PARTNER_PENDING: '/dashboard/alliance/partner/pending'`

**Interfaces:**
- Consumes: `GET/POST /alliance/partners/me/application`；`RegionCascader`（`maxLevel={2}`）
- Produces: 可提交的申请页与状态页

- [ ] **Step 1: API layer**

`types.ts`：与后端 Response 字段对齐（camelCase）。  
`service.ts`：
```ts
export async function getMyPartnerApplication() {
  const res = await apiGet<ApiResponse<AlliancePartnerApplication | null>>(
    '/alliance/partners/me/application'
  );
  return res.data;
}

export async function submitPartnerApplication(body: AlliancePartnerApplyPayload) {
  const res = await apiPost<ApiResponse<AlliancePartnerApplication>>(
    '/alliance/partners/me/application',
    body
  );
  return res.data;
}
```

- [ ] **Step 2: 协议组件**

`partner-agreement-content.tsx`：把 PDF 中培训合伙人九章全文写入（来源 `docs/tmp/7.13新淘课网协议.pdf` 第 1–4 页提取正文：一、合作要点 … 九、其他）。**禁止**保留「... 更多条款 ...」。  
Props：`partnerCode?: string` — 有则显示正式编号，无则显示「提交后自动生成」。

- [ ] **Step 3: 表单组件**

受控字段：`contactName`、`companyName`、`companyPhone`、`companyEmail`、`provinceId`/`cityId`（`RegionCascader` `maxLevel={2}`）、`legalPerson`、`legalIdCard`、`contactQq`。  
身份「公司」单选写死勾选。  
提交：`agreementSigned: true`, `agreementVersion: 'v1'` → 成功后 `router.push(ROUTES.UC_ALLIANCE_PARTNER_PENDING)`。  
校验：省市必选；必填为空时中文提示。

- [ ] **Step 4: `partner/page.tsx` 路由守卫**

挂载后 `getMyPartnerApplication()`：
- `status === 1 || status === 2` → `redirect` pending
- `status === 3` → 展示驳回原因 + 空表单可重提
- `null` → 空表单

- [ ] **Step 5: `pending/page.tsx`**

按最新申请 status 展示：审核中 / 已通过（含 partnerCode）/ 已驳回（链回 partner）。侧栏仍指向培训合伙人路由即可。

- [ ] **Step 6: Lint**

Run: `cd frontend && pnpm lint`  
Expected: 无新增 error

- [ ] **Step 7: Commit**

```bash
git add frontend
git commit -m "$(cat <<'EOF'
feat(frontend): complete alliance partner agreement apply and pending pages

EOF
)"
```

---

### Task 5: Admin 导航 + 培训合伙人列表

**Files:**
- Modify: `admin-frontend/src/config/nav-config.ts` — 「合约管理」改为折叠三项
- Modify: `admin-frontend/src/hooks/use-breadcrumbs.tsx` — 面包屑标题
- Create: `admin-frontend/src/features/alliance-partners/api/types.ts`
- Create: `admin-frontend/src/features/alliance-partners/api/service.ts`
- Create: `admin-frontend/src/features/alliance-partners/api/queries.ts`
- Create: `admin-frontend/src/features/alliance-partners/api/server-service.ts`（若项目惯例需要 SSR prefetch）
- Create: `admin-frontend/src/features/alliance-partners/components/application-listing.tsx`
- Create: `admin-frontend/src/features/alliance-partners/components/applications-table/*`（columns + 详情 Dialog）
- Create: `admin-frontend/src/app/dashboard/contracts/partners/page.tsx`
- Modify: `admin-frontend/src/app/dashboard/contracts/page.tsx` — `redirect('/dashboard/contracts/partners')`
- Create BFF routes under `admin-frontend/src/app/api/alliance/partners/...` **仅当**现有 feature 用 BFF 代理时；否则 `service.ts` 直打后端（对齐 `features/trainers` / `features/books` 既有模式）

**Interfaces:**
- Consumes: Admin 四个 API
- Produces: 可筛选列表 + InlineAuditActions（详情/通过/驳回）

- [ ] **Step 1: nav-config**

将合约管理改为（与专家菜单同构）：
```ts
{
  title: '合约管理',
  url: '#',
  icon: 'contract',
  isActive: false,
  items: [
    { title: '推广大使', url: '/dashboard/contracts/ambassador' },
    { title: '培训合伙人', url: '/dashboard/contracts/partners' },
    { title: '721讲师合作', url: '/dashboard/contracts/721' }
  ]
}
```

- [ ] **Step 2: feature API + table**

状态映射：`1` 待审核 / `2` 已通过 / `3` 已驳回。  
操作列：待审核显示通过/驳回；详情弹窗展示全部字段；复用 `InlineAuditActions` 或机构申请同等交互。  
`roleName` 无需前端传，后端写死。

- [ ] **Step 3: partners page**

`PageContainer`：`pageTitle='培训合伙人'`，`pageDescription='审核淘课联盟培训合伙人入驻申请'` + listing。

- [ ] **Step 4: contracts 根路径 redirect**

```tsx
import { redirect } from 'next/navigation';
export default function ContractsPage() {
  redirect('/dashboard/contracts/partners');
}
```

- [ ] **Step 5: Lint**

Run: `cd admin-frontend && bun lint`  
Expected: 通过

- [ ] **Step 6: Commit**

```bash
git add admin-frontend
git commit -m "$(cat <<'EOF'
feat(admin): add alliance partner contract audit list under contracts menu

EOF
)"
```

---

### Task 6: Admin 大使 / 721 占位页

**Files:**
- Create: `admin-frontend/src/app/dashboard/contracts/ambassador/page.tsx`
- Create: `admin-frontend/src/app/dashboard/contracts/721/page.tsx`

- [ ] **Step 1: 两页占位**

沿用原 `contracts/page.tsx`「功能建设中」卡片文案，分别改 title 为「推广大使」「721讲师合作」。

- [ ] **Step 2: Commit**

```bash
git add admin-frontend/src/app/dashboard/contracts
git commit -m "$(cat <<'EOF'
chore(admin): placeholder pages for ambassador and 721 contracts

EOF
)"
```

---

### Task 7: 端到端验证清单

- [ ] **Step 1: 后端测试 + 编译**

```bash
cd backend
mvn -pl taoke-user -am test -Dtest=AlliancePartnerApplicationServiceImplTest
mvn -pl taoke-app -am compile -DskipTests
```

Expected: 全部 SUCCESS

- [ ] **Step 2: Flyway 再确认**

`uv run python data-trans/scripts/_validate_flyway_migration.py --version 142`

- [ ] **Step 3: 前端 lint**

`cd frontend && pnpm lint`  
`cd admin-frontend && bun lint`

- [ ] **Step 4: 手工冒烟（开发者启动后端后）**

1. 登录 C 端 → 培训合伙人 → 协议可滚到「九、其他」→ 选省市 → 提交 → 进入 pending  
2. Admin → 合约管理展开三子项 → 培训合伙人 → 详情 → 通过 → C 端 pending 变已通过，站内信含「培训合伙人」  
3. 另一账号驳回 → 可回表单重提（新记录）  
4. 已通过账号再打开 partner 应进 pending，无法再提交

---

## Spec Coverage Checklist

| Spec 项 | Task |
|---------|------|
| 表 + status 规则 + partner_code | 1–2 |
| C/Admin API + 权限 | 1, 3 |
| 通知 APPLY_* | 2 |
| 协议全文 + 表单 + RegionCascader | 4 |
| pending 路由跳转 | 4 |
| 合约管理折叠 + 合伙人审核 | 5 |
| 大使/721 占位 | 6 |
| 无支付/无角色 | Global + 不做 |
| 验证命令 | 7 |

## Self-Review Notes

- 无 TBD；`RenderedTemplate` / BFF 是否存在以仓库现有代码为准，实现时对照 `NotificationTemplateService` 与 `features/books` 模式微调，不改变 Spec 行为。
- 若执行时最新 Flyway 已非 141，Task 1 版本号改为 `max+1`。
