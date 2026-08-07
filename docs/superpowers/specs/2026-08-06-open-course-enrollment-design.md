# 公开课报名（Open Course Enrollment）设计

> 版本：v1.0 | 日期：2026-08-06 | 状态：已批准

## 目标

公开课详情页「立即报名」弹出报名表单；运营在后台「平台运营管理 → 公开课报名」统一处理线索。数据与「需求管理」「专家留言」隔离。

## 方案

独立 lead 表 `open_course_enrollments`，镜像 `trainer_lead_messages` 的交互与后台管理模式。

## 认证

- C 端提交：`@Public`，**登录可选（方案 C）**
- 已登录：`SecurityUtils.getCurrentUserId()` 写入 `user_id`
- 未登录：`user_id` 为空，仍可提交

## 数据模型

表名：`open_course_enrollments`（Flyway **V158**）

| 列 | 类型 | 说明 |
|----|------|------|
| id | int PK AI | |
| user_id | int NULL | 登录用户，可空 |
| course_id | int NOT NULL | 课程 ID（课程删除后仍保留） |
| plan_id | int NOT NULL | 开课计划 ID |
| real_name | varchar(50) | 真实姓名 |
| company_name | varchar(200) | 公司名称 |
| email | varchar(100) | 电子邮件 |
| company_phone | varchar(30) NULL | 公司电话 |
| mobile | varchar(20) NULL | 手机号码 |
| course_title | varchar(500) | 提交时冗余课程名 |
| plan_start_time | datetime NULL | 冗余期次开始 |
| plan_end_time | datetime NULL | 冗余期次结束 |
| status | tinyint(2) DEFAULT 0 | 0 待处理 / 1 已联系 / 2 已无效 |
| admin_remark | text NULL | 运营备注，默认空 |
| created_at / updated_at | datetime | BaseEntity |

索引：`idx_created_at`、`idx_course_id`、`idx_status`、`idx_plan_id`

**课程删除后**：列表「关联课程」优先读 `course_title`；若课程实体不存在则展示「课程已删除」（仍带冗余标题时可「课程已删除（原标题）」或纯「课程已删除」——产品要求显示【课程已删除】）。

## 校验（提交）

1. 真实姓名、公司名称、电子邮件必填；邮箱格式校验
2. 公司电话、手机号码至少填一项（二选一）
3. `course_id`、`plan_id` 必填；计划须属于该课程
4. 不校验登录；不与订单/支付联动

## API

### C 端

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/open-course-enrollments` | `@Public` 提交报名，返回 id |

Body：`realName, companyName, email, companyPhone?, mobile?, courseId, planId`

### 管理端（`@RequireRole(SUPER_ADMIN)`，与需求管理一致）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/admin/open-course-enrollments` | 分页列表：时间范围、keyword（课程名/课程ID）、status |
| GET | `/admin/open-course-enrollments/{id}` | 详情 |
| PUT | `/admin/open-course-enrollments/{id}` | 更新 status + adminRemark |
| GET | `/admin/open-course-enrollments/export` | Excel 导出；`ids` 可选，空则按当前筛选导出全部 |

## 前端

### C 端

- 组件：`OpenCourseEnrollDialog`（对齐 `TrainerMessageDialog` + 图三文案）
- `CoursePlanTable`：「立即报名」打开弹窗（传 `courseId`/`planId`），不再跳转 SEO 期次页
- 成功：toast；表单重置关闭

### 管理端

- 菜单：`nav-config`「平台运营管理」末尾「公开课报名」→ `/dashboard/open-course-enrollments`
- Feature：`admin-frontend/src/features/open-course-enrollments/`（对齐 `trainer-messages` / `demands`）
- 能力：筛选、刷新、查看详情弹窗、编辑状态&备注、导出选中/全部

## 权限与菜单

- 菜单仅配置于 `nav-config.ts`（与现有分组一致；`use-nav` 暂无按 permission 过滤）
- 接口层：`SUPER_ADMIN`，与同分组需求管理一致
- 「继承分组权限」：与分组内其他项同等可见性

## 非目标

- 不写入 `demands` / `trainer_lead_messages`
- 不自动创建订单或支付
- 不改 UniApp（本期仅 Web C 端 + Admin）

## 自检

- [x] 无 TBD / 占位未决项
- [x] 与「需求管理」数据隔离
- [x] 登录可选与产品确认一致
- [x] 课程删除后历史保留
